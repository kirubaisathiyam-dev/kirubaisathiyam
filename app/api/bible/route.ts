import { NextResponse } from "next/server";
import { parseBibleReference } from "@/lib/bible";

export const runtime = "edge";

const defaultBibleId = "2730";

export async function GET(request: Request) {
  const apiKey = process.env.YVP_APP_KEY || process.env.YOUVERSION_APP_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "Missing YVP_APP_KEY" },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(request.url);
  const passage = searchParams.get("passage");
  const ref = searchParams.get("ref");
  const bibleId = searchParams.get("bibleId") || defaultBibleId;

  let passageId = passage;
  let reference = ref || "";

  if (!passageId) {
    const parsed = ref ? parseBibleReference(ref) : null;
    if (!parsed) {
      return NextResponse.json(
        { ok: false, error: "Invalid reference" },
        { status: 400 },
      );
    }
    passageId = parsed.passageId;
    reference = parsed.reference;
  }

  const response = await fetch(
    `https://api.youversion.com/v1/bibles/${encodeURIComponent(
      bibleId,
    )}/passages/${encodeURIComponent(passageId)}`,
    {
      headers: {
        "x-yvp-app-key": apiKey,
      },
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      { ok: false, error: errorText || "Failed to fetch verse" },
      { status: 502 },
    );
  }

  const data = (await response.json()) as {
    id?: string;
    content?: string;
    reference?: string;
  };

  return NextResponse.json({
    ok: true,
    id: data.id || passageId,
    content: data.content || "",
    reference: data.reference || reference || passageId,
  });
}
