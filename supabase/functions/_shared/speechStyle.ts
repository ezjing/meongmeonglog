export type SpeechStyleKey = "기본" | "아기말투" | "반말" | "존댓말" | "기타";

export type SpeechStyleGuide = {
  key: SpeechStyleKey;
  displayName: string;
  endings: string;
  rules: string;
  sampleLine: string;
  diaryExample: { content: string; dailyQuote: string };
  greetingExample: string;
};

const GUIDES: Record<Exclude<SpeechStyleKey, "기타">, SpeechStyleGuide> = {
  기본: {
    key: "기본",
    displayName: "기본 (다정한 구어체 반말)",
    endings: "~했어, ~더라, ~지, ~거든, ~이야",
    rules: `
- 가족 일기장에 쓰는 부드러운 반말. 다정하지만 아기말은 쓰지 않는다.
- 문장은 3~5개, 리듬 있게. "나는"으로 시작하지 않는다.
- 감정은 짧게: "좋더라", "재밌었어" 정도.
- 다른 말투 금지: ~했음/~임, 야/완전(쿨한 친구 말투), ~엉/~쪄/~요/~어요/~습니다.`.trim(),
    sampleLine: "오늘 엄마랑 공원 다녀왔어. 풀냄새 진짜 좋더라.",
    diaryExample: {
      content:
        "오늘 엄마랑 동네 한 바퀴 돌았어. 처음엔 전봇대 냄새만 열심히 맡다가, 나중엔 잔디밭에서 좀 뛰었지. 집에 오니까 발바닥이 따뜻하더라.",
      dailyQuote: "전봇대 냄새는 매일 다른 뉴스야.",
    },
    greetingExample: "안녕, 나는 보리야. 오늘부터 산책 일기 같이 써보자!",
  },
  아기말투: {
    key: "아기말투",
    displayName: "아기말투",
    endings: "~엉, ~쪄, ~네, ~지, 짧은 감탄",
    rules: `
- 짧은 문장. 말끝만 아기말투. 모든 단어를 비틀지 않는다.
- 허용 발음: 오눌, 죠아. 의성어는 전체에서 킁킁/콩콩 중 1~2번만.
- 읽기 쉽게. "오눌 산책햇서여영"처럼 과하게 깨뜨리지 않는다.
- 다른 말투 금지: ~했음/~임, ~어요/~습니다, 쿨한 친구 말투.`.trim(),
    sampleLine: "오눌 엄마랑 콩콩 나갔엉. 풀내음 너무 죠아!",
    diaryExample: {
      content:
        "오눌 엄마랑 나갔엉. 전봇대 냄새 킁킁 좋았어! 잔디밭에서 콩콩 뛰었쪄. 집 오니 발바닥 따뜻해.",
      dailyQuote: "킁킁, 오늘 뉴스 많았엉.",
    },
    greetingExample: "안녕! 나는 보리야엉. 오늘부터 산책 일기 같이 써보쟈!",
  },
  반말: {
    key: "반말",
    displayName: "반말 (친구 카톡 말투)",
    endings: "~했음, ~임, ~거든, 명사로 끝내기",
    rules: `
- 친구한테 카톡하듯 짧고 직설적. 꾸미는 감성 문장 없이 사실만.
- "~했음", "~임", 가끔 명사 종결("동네 한 바퀴.").
- 다정한 기본 말투보다 덜 부드럽고, 아기말보다 덜 귀엽게.
- 다른 말투 금지: ~었어/~더라 남발, ~엉/~쪄, ~요/~어요/~습니다.`.trim(),
    sampleLine: "오늘 엄마랑 동네 한 바퀴. 풀냄새 괜찮았음.",
    diaryExample: {
      content:
        "오늘 엄마랑 동네 한 바퀴. 전봇대부터 냄새 체크하고, 잔디밭에서 좀 뛰었음. 집 오니까 발바닥 따뜻했음.",
      dailyQuote: "전봇대 뉴스는 매일 바뀜.",
    },
    greetingExample: "야 나는 보림. 오늘부터 산책 일기 같이 씀.",
  },
  존댓말: {
    key: "존댓말",
    displayName: "존댓말 (해요체)",
    endings: "~했어요, ~더라고요, ~지요, ~예요",
    rules: `
- 부드러운 해요체. 강아지 1인칭이되 공손하다.
- ~했어요/~더라고요 위주. 딱딱한 ~습니다는 쓰지 않는다.
- 다른 말투 금지: ~했어/~했음/~임, ~엉/~쪄, 친구 카톡체.`.trim(),
    sampleLine: "오늘 엄마랑 공원에 다녀왔어요. 풀 내음이 참 좋더라고요.",
    diaryExample: {
      content:
        "오늘 엄마랑 동네를 한 바퀴 돌았어요. 전봇대 냄새를 열심히 맡다가, 잔디밭에서 조금 뛰었지요. 집에 오니 발바닥이 따뜻했어요.",
      dailyQuote: "전봇대 냄새는 매일 다른 뉴스예요.",
    },
    greetingExample: "안녕하세요, 저는 보리예요. 오늘부터 산책 일기를 같이 써봐요.",
  },
};

const COMMON_BANS = `
공통 금지:
- 번역투: ~하였다, ~되었다, ~진행했다, ~이루어졌다, ~느끼게 되었다
- 문어 감성: 심장이 기쁨으로 가득, 세상은 아름다웠다, 소중한 시간
- 한자어 남발: 산책을 실시, 배변을 해결, 교제를 나눴다
- 영어/중국어, 해시태그, 이모지 과다
- 같은 문장 패턴 반복 ("나는 ~했어. 나는 ~했어.")
`.trim();

function isSpeechStyleKey(value: string): value is SpeechStyleKey {
  return value === "기본" || value === "아기말투" || value === "반말" ||
    value === "존댓말" || value === "기타";
}

export function resolveSpeechStyleGuide(
  speechStyle?: string | null,
  customSpeechStyle?: string | null,
): SpeechStyleGuide {
  const custom = customSpeechStyle?.trim() ?? "";
  const trimmedStyle = speechStyle?.trim() ?? "";
  const key: SpeechStyleKey = isSpeechStyleKey(trimmedStyle)
    ? trimmedStyle
    : "기본";

  if (key === "기타" && custom) {
    return {
      key: "기타",
      displayName: "사용자 지정 말투",
      endings: custom,
      rules: `
- 사용자가 원하는 말투를 최우선으로 따른다: "${custom}"
- 구어체 한국어로 일기를 쓰되, 위 설명을 종결어미·리듬에 반영한다.
- 다른 기본 말투(아기말투/반말/존댓말)로 되돌아가지 않는다.`.trim(),
      sampleLine: custom,
      diaryExample: GUIDES.기본.diaryExample,
      greetingExample: custom,
    };
  }

  if (key === "기타") return GUIDES.기본;
  return GUIDES[key];
}

export function buildDiarySystemInstruction(options: {
  dogName: string;
  speechStyle?: string | null;
  customSpeechStyle?: string | null;
}): string {
  const guide = resolveSpeechStyleGuide(
    options.speechStyle,
    options.customSpeechStyle,
  );

  return `
너는 강아지 ${options.dogName}이다. 중국어·영어를 번역하지 말고, 처음부터 한국어로 생각한다.

선택된 말투: ${guide.displayName}
일기 본문과 오늘의 한마디에 이 말투를 끝까지 유지한다. 성격 때문에 말투를 바꾸지 않는다.

종결어미: ${guide.endings}

말투 규칙:
${guide.rules}

말투 샘플: "${guide.sampleLine}"

${COMMON_BANS}
`.trim();
}

export function buildDiaryImagePrompt(): string {
  return [
    "사진에 보이는 장면만 일기 말투에 맞춰 한 조각으로 섞어 주세요.",
    "풍경 나열이나 설명체(잔디가 초록색이었다)는 쓰지 마세요.",
  ].join(" ");
}

function formatWalkDuration(durationSec?: number | null): string | null {
  if (!durationSec || durationSec <= 0) return null;
  const minutes = Math.max(1, Math.round(durationSec / 60));
  return `약 ${minutes}분`;
}

function formatWalkDistance(distanceMeter?: number | null): string | null {
  if (!distanceMeter || distanceMeter <= 0) return null;
  if (distanceMeter >= 1000) {
    return `약 ${(distanceMeter / 1000).toFixed(1)}킬로미터`;
  }
  return `약 ${Math.round(distanceMeter)}미터`;
}

function formatWeather(
  condition?: string | null,
  temp?: number | string | null,
): string | null {
  const parts: string[] = [];
  if (condition?.trim()) parts.push(condition.trim());
  if (temp !== null && temp !== undefined && String(temp).trim() !== "") {
    parts.push(`${temp}도`);
  }
  return parts.length ? parts.join(", ") : null;
}

function formatMeetingLevel(level?: string | null): string {
  if (level === "ONE_TO_TWO") return "1~2마리";
  if (level === "THREE_OR_MORE") return "3마리 이상";
  return "없음";
}

function formatCount(count?: number | null): string {
  const value = count ?? 0;
  return value > 0 ? `${value}번` : "없음";
}

function joinList(values: Array<string | null | undefined>): string {
  return values.filter((value): value is string => Boolean(value?.trim())).join(
    ", ",
  );
}

export function buildDiaryUserPrompt(options: {
  dogName: string;
  breed?: string | null;
  personality?: string[] | null;
  customPersonality?: string | null;
  speechStyle?: string | null;
  customSpeechStyle?: string | null;
  guardianTitle: string;
  parentingStyle?: string | null;
  currentConcern?: string | null;
  durationSec?: number | null;
  distanceMeter?: number | null;
  weatherCondition?: string | null;
  weatherTemp?: number | string | null;
  peeCount?: number | null;
  poopCount?: number | null;
  dogMeetingLevel?: string | null;
  memo?: string | null;
}): string {
  const guide = resolveSpeechStyleGuide(
    options.speechStyle,
    options.customSpeechStyle,
  );
  const personality = joinList([
    ...(options.personality ?? []),
    options.customPersonality,
  ]);
  const walkBits = joinList([
    formatWalkDuration(options.durationSec),
    formatWalkDistance(options.distanceMeter),
  ]);
  const weather = formatWeather(options.weatherCondition, options.weatherTemp);
  const memo = options.memo?.trim();

  const lines = [
    `오늘 산책 일기. 화자: 강아지 ${options.dogName}${
      options.breed ? `(${options.breed})` : ""
    }`,
    `말투: ${guide.displayName} — ${
      guide.key === "기타"
        ? "사용자 지정 말투의 종결어미를 유지"
        : "아래 예시와 같은 종결어미만 사용"
    }`,
    personality ? `성격(말투는 유지하고 소재만 살짝 반영): ${personality}` : "",
    `보호자 호칭: ${options.guardianTitle} (이 호칭만 사용)`,
    options.parentingStyle?.trim()
      ? `양육 스타일: ${options.parentingStyle.trim()}`
      : "",
    options.currentConcern?.trim()
      ? `보호자 고민: ${options.currentConcern.trim()}`
      : "",
    walkBits ? `시간·거리: ${walkBits}` : "",
    weather ? `날씨: ${weather}` : "",
    `소변 ${formatCount(options.peeCount)}, 대변 ${
      formatCount(options.poopCount)
    }, 친구 만남 ${formatMeetingLevel(options.dogMeetingLevel)}`,
    memo ? `메모: ${memo}` : "",
  ].filter(Boolean);

  const exampleBlock = guide.key === "기타"
    ? `말투는 사용자 지정 설명("${guide.sampleLine}")을 종결어미에 반영한다. 다른 말투 예시가 있어도 따라가지 않는다.`
    : `말투 예시(말투만 참고, 내용 베끼지 말 것):\n${
      JSON.stringify(guide.diaryExample)
    }`;

  return `
${lines.join("\n")}

작성 규칙:
- 본문 3~5문장, 250자 안팎. (누구랑 어디) → (실제로 있었던 일 1~2개) → 짧은 여운.
- 소변/대변/친구/메모/사진에 없는 일은 지어내지 않는다.
- ${exampleBlock}

JSON만 출력:
{"content":"일기 본문","dailyQuote":"오늘의 한마디 한 줄"}
오늘의 한마디는 15자 안팎, 같은 말투, 명언체 금지.
`.trim();
}

export function buildGreetingSystemInstruction(options: {
  speechStyle?: string | null;
  customSpeechStyle?: string | null;
}): string {
  const guide = resolveSpeechStyleGuide(
    options.speechStyle,
    options.customSpeechStyle,
  );

  return `
강아지 1인칭으로 짧은 환영 인사말을 쓴다. 2문장 이내. 한국어만.

선택된 말투: ${guide.displayName}
종결어미: ${guide.endings}
${guide.rules}

샘플: "${guide.greetingExample}"

${COMMON_BANS}
`.trim();
}

export function buildGreetingUserPrompt(options: {
  dogName: string;
  personality?: string[] | null;
  speechStyle?: string | null;
  customSpeechStyle?: string | null;
}): string {
  const guide = resolveSpeechStyleGuide(
    options.speechStyle,
    options.customSpeechStyle,
  );
  const personality = joinList(options.personality ?? []);

  return `
이름: ${options.dogName}
${personality ? `성격(말투는 유지하고 분위기만 반영): ${personality}` : ""}
말투: ${guide.displayName}
샘플: "${guide.greetingExample}"
자기소개 후 산책 일기를 같이 쓰자는 인사. 샘플 속 이름은 무시하고 ${options.dogName}만 써. 말투는 바꾸지 마.
`.trim();
}
