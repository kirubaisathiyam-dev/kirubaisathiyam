import { NextRequest, NextResponse } from "next/server";

const IMAGE_WIDTH = 1600;
const IMAGE_HEIGHT = 1200;

export async function GET(request: NextRequest) {
  const dayParam = request.nextUrl.searchParams.get("day") || "1";
  const day = Number.parseInt(dayParam, 10);
  const lock = Number.isFinite(day) && day > 0 ? day : 1;
  const sourceUrl = `https://loremflickr.com/${IMAGE_WIDTH}/${IMAGE_HEIGHT}/landscape?lock=${lock}`;

  try {
    const response = await fetch(sourceUrl, {
      cache: "force-cache",
      next: { revalidate: 86_400 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Unable to load verse image." },
        { status: 502 },
      );
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
    return NextResponse.json(
      { error: "Unable to load verse image." },
      { status: 500 },
    );
  }
}
