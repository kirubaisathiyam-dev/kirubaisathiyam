const TAMIL_MONTHS = [
  "ஜனவரி",
  "பெப்ரவரி",
  "மார்ச்",
  "ஏப்ரல்",
  "மே",
  "ஜூன்",
  "ஜூலை",
  "ஆகஸ்ட்",
  "செப்டம்பர்",
  "அக்டோபர்",
  "நவம்பர்",
  "டிசம்பர்",
];

function parseDateValue(value: string | Date): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]);
    const day = Number(dateOnlyMatch[3]);
    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatTamilDate(
  value: string | Date | null | undefined,
): string {
  if (!value) return "";
  const parsed = parseDateValue(value);
  if (!parsed) return typeof value === "string" ? value : "";

  const day = parsed.getDate();
  const month = TAMIL_MONTHS[parsed.getMonth()] ?? "";
  const year = parsed.getFullYear();
  if (!month) return typeof value === "string" ? value : "";

  return `${day} ${month} ${year}`;
}
