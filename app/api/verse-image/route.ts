import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const IMAGE_WIDTH = 1600;
const IMAGE_HEIGHT = 1200;
const FALLBACK_IMAGES = [
  "/images/1.png",
  "/images/history.jpg",
  "/images/reformed.jpg",
  "/images/systematic.jpg",
  "/images/church-history.jpg",
  "/uploads/long.jpg",
  "/uploads/life.jpg",
  "/uploads/14089.jpg",
  "/uploads/24107.jpg",
  "/uploads/56144.jpg",
  "/uploads/58582.jpg",
  "/uploads/7203.jpg",
];

function getFallbackImagePath(day: number) {
  return FALLBACK_IMAGES[(day - 1) % FALLBACK_IMAGES.length] || "/images/1.png";
}

export async function GET(request: NextRequest) {
  const dayParam = request.nextUrl.searchParams.get("day") || "1";
  const day = Number.parseInt(dayParam, 10);
  const lock = Number.isFinite(day) && day > 0 ? day : 1;
  const sourceUrl = `https://loremflickr.com/${IMAGE_WIDTH}/${IMAGE_HEIGHT}/landscape?lock=${lock}`;
  const fallbackPath = getFallbackImagePath(lock);

  try {
    const response = await fetch(sourceUrl, {
      cache: "force-cache",
    });

    if (!response.ok) {
      return NextResponse.redirect(new URL(fallbackPath, request.url), 307);
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch {
    return NextResponse.redirect(new URL(fallbackPath, request.url), 307);
  }
}
