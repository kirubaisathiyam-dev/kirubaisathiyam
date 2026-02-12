const FALLBACK_SITE_URL = "https://kirubaisathiyam.netlify.app";

function normalizeSiteUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

export function getSiteUrl() {
  const raw =
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    FALLBACK_SITE_URL;

  try {
    return new URL(normalizeSiteUrl(raw));
  } catch {
    return new URL(FALLBACK_SITE_URL);
  }
}

export function toAbsoluteUrl(pathOrUrl: string) {
  if (!pathOrUrl) return "";

  try {
    return new URL(pathOrUrl).toString();
  } catch {
    const base = getSiteUrl();
    const normalized = pathOrUrl.startsWith("/")
      ? pathOrUrl
      : `/${pathOrUrl}`;
    return new URL(normalized, base).toString();
  }
}
