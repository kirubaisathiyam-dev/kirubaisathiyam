import dailyDevotionRecords from "@/public/daily-devotion.json";
import {
  getCurrentDevotionSlot,
  getDevotionRoute,
  getDevotionSlug,
  getTimePartsInTimeZone,
  getTodayDevotionCandidates,
  SITE_TIME_ZONE,
  type DailyDevotionRecord,
  type DailyDevotionSlotKey,
} from "@/lib/daily-devotion";
import type { PushMessage } from "@/lib/push-edge";

function trimNotificationBody(value: string, limit = 180) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= limit) {
    return clean;
  }

  return `${clean.slice(0, limit - 3).trim()}...`;
}

export function getCurrentDevotionNotificationState(
  date = new Date(),
  timeZone = SITE_TIME_ZONE,
) {
  const slot = getCurrentDevotionSlot(date, timeZone);
  const { year, monthShort, day } = getTimePartsInTimeZone(date, timeZone);
  const dayLabel = String(day).padStart(2, "0");
  const dateLabel = `${dayLabel} ${monthShort}`;

  return {
    slot,
    dateLabel,
    dateKey: `${year}-${String(
      new Date(`${monthShort} 1, ${year}`).getMonth() + 1,
    ).padStart(2, "0")}-${dayLabel}`,
    documentId: `devotion-${year}-${String(
      new Date(`${monthShort} 1, ${year}`).getMonth() + 1,
    ).padStart(2, "0")}-${dayLabel}-${slot}`,
  };
}

export function findDailyDevotionForSlot(
  records: DailyDevotionRecord[],
  slot: DailyDevotionSlotKey,
  date = new Date(),
  timeZone = SITE_TIME_ZONE,
) {
  const record = getTodayDevotionCandidates(date, timeZone)
    .map((candidate) =>
      records.find((item) => item.date === candidate && item[slot]?.verse),
    )
    .find(Boolean);

  const slotRecord = record?.[slot];
  if (!record?.date || !slotRecord?.verse) {
    return null;
  }

  return {
    record,
    slot,
    slotRecord,
    slug: getDevotionSlug(record.date, slot),
  };
}

export function getCurrentDailyDevotionPushMessage(
  date = new Date(),
  timeZone = SITE_TIME_ZONE,
): PushMessage | null {
  const records = dailyDevotionRecords as DailyDevotionRecord[];
  const slot = getCurrentDevotionSlot(date, timeZone);
  const devotion = findDailyDevotionForSlot(records, slot, date, timeZone);

  if (!devotion) {
    return null;
  }

  return {
    title: slot === "am" ? "Daily morning devotion" : "Daily evening devotion",
    body: trimNotificationBody(
      [devotion.slotRecord.verse, devotion.slotRecord.devotion]
        .filter(Boolean)
        .join(" "),
    ),
    url: getDevotionRoute(getDevotionSlug(devotion.record.date!, slot)),
  };
}
