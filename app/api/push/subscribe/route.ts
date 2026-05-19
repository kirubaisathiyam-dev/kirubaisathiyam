import { NextResponse } from "next/server";
import { savePushSubscription } from "@/lib/push-edge";

export const runtime = "edge";

export async function POST(request: Request) {
  let payload: { token?: unknown } = {};

  try {
    payload = (await request.json()) as { token?: unknown };
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const token = typeof payload.token === "string" ? payload.token.trim() : "";

  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Missing push token" },
      { status: 400 },
    );
  }

  try {
    await savePushSubscription(token, request.headers.get("user-agent") || "");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save push token.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
