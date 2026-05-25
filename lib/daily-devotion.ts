import { getCachedUnsplashImage, type UnsplashImage } from "@/lib/unsplash";

export type DailyDevotionSlotKey = "am" | "pm";

export type DailyDevotionSlot = {
  verse?: string;
  devotion?: string;
};

export type DailyDevotionRecord = {
  date?: string;
  am?: DailyDevotionSlot;
  pm?: DailyDevotionSlot;
};

export const SITE_TIME_ZONE = "Asia/Colombo";
export const DEVOTION_ATTRIBUTION =
  "சார்ல்ஸ் ஸ்பர்ஜனின் காலை மற்றும் மாலை தியானங்கள்.";

export function normalizeDevotionDateLabel(date: string) {
  const [day = "", month = ""] = date.trim().split(/\s+/);
  const normalizedDay = String(Number(day) || day).padStart(2, "0");
  const normalizedMonth = month.slice(0, 3);
  return `${normalizedDay} ${normalizedMonth}`;
}

export function getDevotionSlug(
  date: string,
  slot: DailyDevotionSlotKey,
) {
  const [day = "", month = ""] = normalizeDevotionDateLabel(date).split(" ");
  return `${day}-${month.toLowerCase()}-${slot}`;
}

export function parseDevotionSlug(slug: string) {
  const match = slug.match(/^(\d{1,2})-([a-z]{3})-(am|pm)$/i);
  if (!match) {
    return null;
  }

  const [, day, month, slot] = match;
  return {
    date: `${String(Number(day)).padStart(2, "0")} ${month[0].toUpperCase()}${month
      .slice(1)
      .toLowerCase()}`,
    slot: slot.toLowerCase() as DailyDevotionSlotKey,
  };
}

export function formatDevotionLabel(
  date: string,
  slot: DailyDevotionSlotKey,
) {
  const [day = "", month = ""] = date.split(" ");
  return `${month.toUpperCase()} ${day} ${slot === "am" ? "MORNING" : "EVENING"}`;
}

export async function getDevotionImage(slug: string): Promise<UnsplashImage> {
  return getCachedUnsplashImage("devotion", slug);
}

export function getDevotionRoute(slug: string) {
  return `/devotions/${slug}`;
}

export function getDevotionImageFileName(date: string) {
  const [day = "", month = ""] = normalizeDevotionDateLabel(date).split(" ");
  return `kirubaisathiyam_${month.toLowerCase()}_${Number(day) || day}_devotion.png`;
}

export function getDevotionPreviewText(devotion: string, wordLimit = 20) {
  const words = devotion.trim().split(/\s+/).filter(Boolean);
  if (words.length <= wordLimit) {
    return devotion.trim();
  }

  return `${words.slice(0, wordLimit).join(" ")}...`;
}

export function getTimePartsInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value ?? "0"),
    monthShort: parts.find((part) => part.type === "month")?.value ?? "Jan",
    day: Number(parts.find((part) => part.type === "day")?.value ?? "1"),
    hour: Number(parts.find((part) => part.type === "hour")?.value ?? "0"),
    minute: Number(parts.find((part) => part.type === "minute")?.value ?? "0"),
  };
}

export function getCurrentDevotionSlot(
  date = new Date(),
  timeZone = SITE_TIME_ZONE,
) {
  const { hour } = getTimePartsInTimeZone(date, timeZone);
  return hour < 12 ? "am" : "pm";
}

export function getTodayDevotionCandidates(
  date = new Date(),
  timeZone = SITE_TIME_ZONE,
) {
  const { day, monthShort } = getTimePartsInTimeZone(date, timeZone);
  const dayLabel = String(day).padStart(2, "0");
  return [`${dayLabel} ${monthShort}`, `${dayLabel} Jan`];
}

export function findCurrentDevotionRecord(
  records: DailyDevotionRecord[],
  date = new Date(),
  timeZone = SITE_TIME_ZONE,
) {
  const slot = getCurrentDevotionSlot(date, timeZone);
  const record = getTodayDevotionCandidates(date, timeZone)
    .map((candidate) =>
      records.find((item) => item.date === candidate && item[slot]?.verse),
    )
    .find(Boolean);

  if (!record?.date) {
    return null;
  }

  return {
    record,
    slot,
    slug: getDevotionSlug(record.date, slot),
  };
}
