import { NextResponse } from "next/server";

export const runtime = "edge";

const emailRegex =
  /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

function isValidEmail(value: string) {
  return emailRegex.test(value);
}

export async function POST(request: Request) {
  let email = "";

  try {
    const body = (await request.json()) as { email?: unknown };
    if (typeof body?.email === "string") {
      email = body.email.trim();
    }
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { ok: false, error: "Invalid email" },
      { status: 400 },
    );
  }

  const apiKey = process.env.BREVO_API_KEY;
  const listIdRaw = process.env.BREVO_LIST_ID;
  const listId = listIdRaw ? Number(listIdRaw) : NaN;

  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "Missing BREVO_API_KEY" },
      { status: 500 },
    );
  }

  if (!Number.isFinite(listId)) {
    return NextResponse.json(
      { ok: false, error: "Missing BREVO_LIST_ID" },
      { status: 500 },
    );
  }

  const brevoResponse = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      email,
      listIds: [listId],
      updateEnabled: true,
    }),
  });

  if (!brevoResponse.ok) {
    return NextResponse.json(
      { ok: false, error: "Subscription failed" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
