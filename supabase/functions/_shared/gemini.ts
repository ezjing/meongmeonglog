export const GEMINI_MODEL = "gemini-2.5-flash";

type GeminiPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function fetchImagePart(imageUrl: string): Promise<GeminiPart> {
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error("산책 사진을 불러오지 못했습니다.");
  }

  const contentType = imageResponse.headers.get("content-type") ?? "image/jpeg";
  const buffer = await imageResponse.arrayBuffer();

  return {
    inline_data: {
      mime_type: contentType.split(";")[0],
      data: arrayBufferToBase64(buffer),
    },
  };
}

function parseGeminiError(errorText: string, status: number): string {
  try {
    const parsed = JSON.parse(errorText);
    const message = parsed?.error?.message as string | undefined;
    const code = parsed?.error?.code as number | undefined;

    if (code === 429 || message?.toLowerCase().includes("quota")) {
      return "Gemini API 사용 한도를 초과했습니다. 잠시 후 다시 시도하거나 Google AI Studio에서 한도를 확인해주세요.";
    }
    if (code === 503 || message?.includes("high demand")) {
      return "Gemini 서버가 일시적으로 바쁩니다. 잠시 후 다시 시도해주세요.";
    }
    if (message) return message;
  } catch {
    // fall through
  }

  return errorText || `Gemini API error: ${status}`;
}

export async function generateGeminiContent(options: {
  systemInstruction?: string;
  userPrompt: string;
  jsonResponse?: boolean;
  imageUrl?: string;
  imagePrompt?: string;
}): Promise<string> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY가 설정되지 않았습니다. supabase secrets set GEMINI_API_KEY=... 를 실행해주세요.",
    );
  }

  const parts: GeminiPart[] = [{ text: options.userPrompt }];

  if (options.imageUrl) {
    parts.push(await fetchImagePart(options.imageUrl));
    parts.push({
      text: options.imagePrompt ?? "사진을 참고해 상황을 묘사해주세요.",
    });
  }

  const body: Record<string, unknown> = {
    contents: [{ role: "user", parts }],
  };

  if (options.systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: options.systemInstruction }],
    };
  }

  if (options.jsonResponse) {
    body.generationConfig = { responseMimeType: "application/json" };
  }

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(parseGeminiError(errorText, response.status));
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemini가 응답을 생성하지 못했습니다.");
  }

  return text;
}
