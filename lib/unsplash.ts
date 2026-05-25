export type UnsplashImage = {
  url: string;
  photographerName: string | null;
  photographerUrl: string | null;
  unsplashUrl: string | null;
  source: "unsplash" | "picsum";
};

export type UnsplashContext = "devotion" | "verse";

type UnsplashPhotoResponse = {
  links?: {
    html?: string;
  };
  urls?: {
    raw?: string;
    regular?: string;
  };
  user?: {
    name?: string;
    links?: {
      html?: string;
    };
  };
};

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY?.trim() || "";
const IMAGE_WIDTH = 1600;
const IMAGE_HEIGHT = 1200;

function getFallbackImageUrl(seed: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${IMAGE_WIDTH}/${IMAGE_HEIGHT}.jpg`;
}

export function getFallbackUnsplashImage(
  context: UnsplashContext,
  cacheKey: string,
): UnsplashImage {
  return {
    url: getFallbackImageUrl(`${context}-${cacheKey}`),
    photographerName: null,
    photographerUrl: null,
    unsplashUrl: null,
    source: "picsum",
  };
}

function getQueryForContext(context: UnsplashContext) {
  if (context === "devotion") {
    return "nature landscape mountains river sea forest wilderness";
  }

  return "nature landscape mountains river ocean coastline forest wilderness";
}

function buildUnsplashCdnUrl(rawUrl?: string, regularUrl?: string) {
  if (rawUrl) {
    const url = new URL(rawUrl);
    url.searchParams.set("w", String(IMAGE_WIDTH));
    url.searchParams.set("h", String(IMAGE_HEIGHT));
    url.searchParams.set("fit", "crop");
    url.searchParams.set("crop", "entropy");
    url.searchParams.set("auto", "format");
    url.searchParams.set("q", "80");
    return url.toString();
  }

  return regularUrl || "";
}

export async function getUnsplashImage(
  context: UnsplashContext,
  cacheKey: string,
): Promise<UnsplashImage> {
  if (!UNSPLASH_ACCESS_KEY) {
    return getFallbackUnsplashImage(context, cacheKey);
  }

  const query = new URLSearchParams({
    query: getQueryForContext(context),
    orientation: "landscape",
    content_filter: "high",
  });

  try {
    const response = await fetch(
      `https://api.unsplash.com/photos/random?${query.toString()}`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          "Accept-Version": "v1",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error(`Unsplash returned ${response.status}`);
    }

    const photo = (await response.json()) as UnsplashPhotoResponse;

    const url = buildUnsplashCdnUrl(photo.urls?.raw, photo.urls?.regular);

    if (!url) {
      throw new Error("Unsplash photo response did not include a usable image URL.");
    }

    return {
      url,
      photographerName: photo.user?.name?.trim() || null,
      photographerUrl: photo.user?.links?.html?.trim() || null,
      unsplashUrl: photo.links?.html?.trim() || null,
      source: "unsplash",
    };
  } catch {
    return getFallbackUnsplashImage(context, cacheKey);
  }
}

export async function getCachedUnsplashImage(
  context: UnsplashContext,
  cacheKey: string,
): Promise<UnsplashImage> {
  return getUnsplashImage(context, cacheKey);
}
