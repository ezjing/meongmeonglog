import { getEdgeFunctionErrorMessage } from "@/lib/api/edgeFunctions";
import { fetchWalkPhotos, getMockWalk } from "@/lib/api/walkApi";
import { DEFAULT_DOG_NAME } from "@/constants/dog";
import { AppError } from "@/lib/AppError";
import { toDiary } from "@/lib/mappers/diaryMappers";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { DiaryRow } from "@/types/database";
import type { CalendarDay, Diary, DiaryListItem } from "@/types/domain";

const mockDiaries: DiaryListItem[] = [];

type WalkPhotoRow = { image_url: string; sort_order: number };

type WalkWithPhotos = {
  distance_meter: number;
  duration_sec: number;
  walk_photos: WalkPhotoRow[] | null;
};

function pickThumbnailUrl(
  walkPhotos: WalkPhotoRow[] | null | undefined,
): string | null {
  if (!walkPhotos?.length) return null;
  return (
    [...walkPhotos].sort((a, b) => a.sort_order - b.sort_order)[0]?.image_url ??
    null
  );
}

async function attachMockThumbnail(
  diary: DiaryListItem,
): Promise<DiaryListItem> {
  const photos = await fetchWalkPhotos(diary.walkId);
  return {
    ...diary,
    thumbnailUrl: photos[0]?.imageUrl ?? null,
  };
}

async function attachMockThumbnails(
  diaries: DiaryListItem[],
): Promise<DiaryListItem[]> {
  return Promise.all(diaries.map(attachMockThumbnail));
}

function mapDiaryRow(row: Record<string, unknown>): DiaryListItem {
  const diary = toDiary(row as DiaryRow);
  const walks = row.walks as WalkWithPhotos | null;
  const dogs = row.dogs as { name: string } | null;
  return {
    ...diary,
    dogName: dogs?.name,
    distanceMeter: walks?.distance_meter,
    durationSec: walks?.duration_sec,
    thumbnailUrl: pickThumbnailUrl(walks?.walk_photos),
  };
}

export const diaryKeys = {
  all: ["diaries"] as const,
  list: () => [...diaryKeys.all, "list"] as const,
  detail: (id: string) => [...diaryKeys.all, id] as const,
  calendar: (year: number, month: number) =>
    [...diaryKeys.all, "calendar", year, month] as const,
};

export async function fetchDiaries(date?: string): Promise<DiaryListItem[]> {
  if (!isSupabaseConfigured) {
    const filtered = date
      ? mockDiaries.filter((d) => d.createdAt.startsWith(date))
      : [...mockDiaries].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    return attachMockThumbnails(filtered);
  }

  let query = supabase
    .from("diaries")
    .select(
      "*, walks(distance_meter, duration_sec, walk_photos(image_url, sort_order)), dogs(name)",
    )
    .order("created_at", { ascending: false });

  if (date) {
    query = query
      .gte("created_at", `${date}T00:00:00`)
      .lte("created_at", `${date}T23:59:59`);
  }

  const { data, error } = await query;
  if (error) throw new AppError("fetch_diaries_failed", error.message);

  return (data ?? []).map((row) => mapDiaryRow(row as Record<string, unknown>));
}

export async function fetchDiary(
  diaryId: string,
): Promise<DiaryListItem | null> {
  if (!isSupabaseConfigured) {
    const diary = mockDiaries.find((d) => d.diaryId === diaryId);
    if (!diary) return null;
    return attachMockThumbnail(diary);
  }

  const { data, error } = await supabase
    .from("diaries")
    .select("*, walks(*, walk_photos(image_url, sort_order)), dogs(name)")
    .eq("id", diaryId)
    .maybeSingle();

  if (error) throw new AppError("fetch_diary_failed", error.message);
  if (!data) return null;

  return mapDiaryRow(data as Record<string, unknown>);
}

export async function fetchCalendar(
  year: number,
  month: number,
): Promise<CalendarDay[]> {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0);
  const end = `${year}-${String(month).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

  if (!isSupabaseConfigured) {
    const daysInMonth = endDate.getDate();
    const diaryDates = new Set(
      mockDiaries.map((d) => d.createdAt.slice(0, 10)),
    );
    return Array.from({ length: daysInMonth }, (_, i) => {
      const date = `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
      return { date, hasDiary: diaryDates.has(date) };
    });
  }

  const { data, error } = await supabase
    .from("diaries")
    .select("created_at")
    .gte("created_at", `${start}T00:00:00`)
    .lte("created_at", `${end}T23:59:59`);

  if (error) throw new AppError("fetch_calendar_failed", error.message);

  const diaryDates = new Set(
    (data ?? []).map((d) => d.created_at.slice(0, 10)),
  );
  const daysInMonth = endDate.getDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
    return { date, hasDiary: diaryDates.has(date) };
  });
}

export async function generateDiary(walkId: string): Promise<Diary> {
  if (!isSupabaseConfigured) {
    const photos = await fetchWalkPhotos(walkId);
    const walk = getMockWalk(walkId);
    const diary: DiaryListItem = {
      diaryId: `diary-${Date.now()}`,
      walkId,
      dogId: "mock-dog",
      content:
        "오늘은 엄마랑 공원에 다녀왔어! 친구도 만나고 잔디밭도 열심히 뛰어다녔지. 간식도 먹고 냄새 탐험도 많이 해서 정말 즐거운 하루였어!",
      dailyQuote: "친구는 냄새만 맡아도 알 수 있대!",
      aiModel: "qwen/qwen3-32b",
      generatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      dogName: DEFAULT_DOG_NAME,
      distanceMeter: walk?.distanceMeter ?? null,
      durationSec: walk?.durationSec ?? null,
      thumbnailUrl: photos[0]?.imageUrl ?? null,
    };
    mockDiaries.unshift(diary);
    return diary;
  }

  const { data, error } = await supabase.functions.invoke("diaries-generate", {
    body: { walkId },
  });

  if (error || (data as { error?: string } | null)?.error) {
    const message = await getEdgeFunctionErrorMessage(
      data,
      error,
      "일기 생성에 실패했습니다.",
    );
    throw new AppError("diary_generate_failed", message);
  }

  const result = data as {
    diaryId: string;
    content: string;
    dailyQuote: string;
    aiModel?: string;
  };
  return {
    diaryId: result.diaryId,
    walkId,
    dogId: "",
    content: result.content,
    dailyQuote: result.dailyQuote,
    aiModel: result.aiModel ?? "qwen/qwen3-32b",
    generatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

export async function createShareCard(diaryId: string): Promise<string> {
  if (!isSupabaseConfigured) {
    return `https://placeholder.share/${diaryId}.png`;
  }

  const { data, error } = await supabase.functions.invoke("share-card", {
    body: { diaryId },
  });

  if (error) throw new AppError("share_card_failed", error.message);
  return (data as { imageUrl: string }).imageUrl;
}

export async function fetchWelcomeGreeting(
  dogName: string,
  personality: string[],
  speechStyle: string | null,
): Promise<string> {
  if (!isSupabaseConfigured) {
    const traits = personality.slice(0, 2).join("하고 ");
    return `안녕! 나는 ${dogName}야~ ${traits ? `${traits} ` : ""}말투로 매일매일 산책일기 같이 써보자, 멍멍!`;
  }

  const { data, error } = await supabase.functions.invoke("welcome-greeting", {
    body: { dogName, personality, speechStyle },
  });

  if (error) {
    return `안녕! 나는 ${dogName}야~ 오늘부터 매일매일 산책일기 같이 써보자, 멍멍!`;
  }

  return (data as { greeting: string }).greeting;
}

export function getMockDiaries(): DiaryListItem[] {
  return mockDiaries;
}
