/// <reference path="./deno.d.ts" />

import { externalApiSignal } from "./http.ts";

/** 사진 유무와 관계없이 같은 모델(비전 지원)을 쓴다 */
export const GROQ_MODEL = "qwen/qwen3.8-27b";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MAX_BASE64_IMAGE_BYTES = 4 * 1024 * 1024;
const GROQ_SUPPORTED_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type MessageContent =
  | string
  | Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  >;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function detectMimeFromBuffer(
  buffer: ArrayBuffer,
  headerContentType: string,
  imageUrl: string,
): string {
  const bytes = new Uint8Array(buffer.slice(0, 16));

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 &&
    bytes[3] === 0x46
  ) {
    return "image/webp";
  }

  const ftyp = String.fromCharCode(...bytes.slice(4, 8));
  if (ftyp === "ftyp") {
    const brand = String.fromCharCode(...bytes.slice(8, 12)).toLowerCase();
    if (
      brand.includes("heic") || brand.includes("heix") ||
      brand.includes("hevc") || brand.includes("mif1")
    ) {
      return "image/heic";
    }
  }

  const ext = imageUrl.split(".").pop()?.split("?")[0]?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "heic" || ext === "heif") return "image/heic";

  return headerContentType.split(";")[0].toLowerCase();
}

function isGroqCompatibleMime(mime: string): boolean {
  return GROQ_SUPPORTED_MIMES.has(mime);
}

/** Content-Range("bytes 0-15/12345") 또는 Content-Length에서 전체 파일 크기 */
function readTotalSize(response: Response): number | null {
  const range = response.headers.get("content-range");
  const total = range?.split("/")[1];
  if (total && total !== "*") return Number(total);
  if (response.status === 200) {
    const length = response.headers.get("content-length");
    if (length) return Number(length);
  }
  return null;
}

async function prepareGroqImageInput(
  imageUrl: string,
): Promise<{ url: string } | null> {
  // 형식 판별에 필요한 앞부분만 받는다 (Groq가 URL로 사진을 직접 받으므로 전체를 내려받지 않음)
  const headResponse = await fetch(imageUrl, {
    headers: { Range: "bytes=0-15" },
    signal: externalApiSignal(),
  });
  if (!headResponse.ok) {
    throw new Error("산책 사진을 불러오지 못했습니다.");
  }

  const headerContentType = headResponse.headers.get("content-type") ??
    "image/jpeg";
  const prefix = await headResponse.arrayBuffer();
  const mime = detectMimeFromBuffer(prefix, headerContentType, imageUrl);

  if (!isGroqCompatibleMime(mime)) {
    return null;
  }

  const totalSize = readTotalSize(headResponse);
  if (
    imageUrl.startsWith("https://") && totalSize != null &&
    totalSize <= 20 * 1024 * 1024
  ) {
    return { url: imageUrl };
  }

  // URL로 넘길 수 없으면 base64로 보낸다. 서버가 Range를 무시했으면 이미 전체를 받은 상태
  const buffer = headResponse.status === 200 ? prefix : await (await fetch(imageUrl, {
    signal: externalApiSignal(),
  })).arrayBuffer();

  if (buffer.byteLength > MAX_BASE64_IMAGE_BYTES) {
    throw new Error(
      "산책 사진이 너무 큽니다 (4MB 이하). 더 작은 사진을 사용해주세요.",
    );
  }

  return {
    url: `data:${mime};base64,${arrayBufferToBase64(buffer)}`,
  };
}

function parseGroqError(errorText: string, status: number): string {
  try {
    const parsed = JSON.parse(errorText);
    const message = parsed?.error?.message as string | undefined;

    if (status === 429 || message?.toLowerCase().includes("rate limit")) {
      return "Groq API 사용 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
    }
    if (status === 503) {
      return "Groq 서버가 일시적으로 바쁩니다. 잠시 후 다시 시도해주세요.";
    }
    if (message?.toLowerCase().includes("invalid image")) {
      return "산책 사진 형식을 분석하지 못했습니다. JPEG 사진으로 다시 시도해주세요.";
    }
    if (message) return message;
  } catch {
    // fall through
  }

  return errorText || `Groq API error: ${status}`;
}

/** qwen3 등 reasoning 모델이 content에 포함하는 추론 블록 제거 */
export function stripModelReasoning(text: string): string {
  let result = text;

  result = result.replace(
    /<(?:think|redacted_reasoning)[^>]*>[\s\S]*?<\/(?:think|redacted_reasoning)>\s*/gi,
    "",
  );

  const segments = result.split(/<\/(?:think|redacted_reasoning)>/i);
  if (segments.length > 1) {
    result = segments[segments.length - 1];
  }

  result = result.replace(/<\/?(?:think|redacted_reasoning)[^>]*>/gi, "");
  result = result.trim().replace(/^["'`]+|["'`]+$/g, "").trim();

  return result;
}

export async function generateGroqContent(options: {
  systemInstruction?: string;
  userPrompt: string;
  jsonResponse?: boolean;
  imageUrl?: string;
  imagePrompt?: string;
  temperature?: number;
}): Promise<{ text: string; model: string }> {
  const apiKey = Deno.env.get("GROQ_API_KEY");
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY가 설정되지 않았습니다. supabase secrets set GROQ_API_KEY=... 를 실행해주세요.",
    );
  }

  let userPrompt = options.userPrompt;
  let imageInput: { url: string } | null = null;

  if (options.imageUrl) {
    imageInput = await prepareGroqImageInput(options.imageUrl);
    if (!imageInput) {
      userPrompt +=
        "\n\n(참고: 산책 사진 형식(HEIC 등)을 AI가 읽지 못해 텍스트 정보만으로 작성합니다.)";
    }
  }

  const model = GROQ_MODEL;
  const userContent: MessageContent = [{ type: "text", text: userPrompt }];

  if (imageInput) {
    userContent.push({
      type: "image_url",
      image_url: { url: imageInput.url },
    });
    userContent.push({
      type: "text",
      text: options.imagePrompt ?? "사진을 참고해 상황을 묘사해주세요.",
    });
  }

  const messages: Array<{ role: string; content: MessageContent }> = [];
  if (options.systemInstruction) {
    messages.push({ role: "system", content: options.systemInstruction });
  }
  messages.push({ role: "user", content: userContent });

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: options.temperature ?? 0.8,
    max_tokens: 800,
  };

  if (model.startsWith("qwen/qwen3")) {
    body.reasoning_effort = "none";
  }

  if (options.jsonResponse) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: externalApiSignal(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(parseGroqError(errorText, response.status));
  }

  const data = await response.json();
  const rawText = data?.choices?.[0]?.message?.content;

  if (!rawText) {
    throw new Error("Groq가 응답을 생성하지 못했습니다.");
  }

  const text = stripModelReasoning(rawText);

  if (!text) {
    throw new Error("Groq가 응답을 생성하지 못했습니다.");
  }

  return { text, model };
}
