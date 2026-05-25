import { NextRequest, NextResponse } from "next/server";
import { getCachedUnsplashImage } from "@/lib/unsplash";

export async function GET(request: NextRequest) {
  const contextParam = request.nextUrl.searchParams.get("context");
  const id = request.nextUrl.searchParams.get("id")?.trim();
  const context = contextParam === "devotion" ? "devotion" : "verse";

  if (!id) {
    return NextResponse.json(
      { error: "Missing required query parameter: id" },
      { status: 400 },
    );
  }

  const image = await getCachedUnsplashImage(context, id);
  return NextResponse.json(image, {
    headers: {
      "Cache-Control": "public, s-maxage=2592000, stale-while-revalidate=86400",
    },
  });
}
