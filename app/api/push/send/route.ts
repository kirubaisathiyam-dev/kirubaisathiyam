import { NextResponse } from "next/server";
import {
  deletePushSubscription,
  listPushSubscriptions,
  sendPushToToken,
  type PushMessage,
} from "@/lib/push-edge";

export const runtime = "edge";

const batchSize = 20;

function isAuthorized(request: Request) {
  const adminKey = process.env.PUSH_ADMIN_KEY || process.env.NEWSLETTER_ADMIN_KEY;
  const providedKey = request.headers.get("x-admin-key");
  return !adminKey || providedKey === adminKey;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  let payload: Partial<PushMessage> = {};

  try {
    payload = (await request.json()) as Partial<PushMessage>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const body = typeof payload.body === "string" ? payload.body.trim() : "";
  const url = typeof payload.url === "string" ? payload.url.trim() : "";
  const image = typeof payload.image === "string" ? payload.image.trim() : "";

  if (!title) {
    return NextResponse.json(
      { ok: false, error: "Missing notification title" },
      { status: 400 },
    );
  }

  try {
    const subscribers = await listPushSubscriptions();

    if (subscribers.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No push subscribers found" },
        { status: 400 },
      );
    }

    let sent = 0;
    let failed = 0;
    let removed = 0;

    for (let index = 0; index < subscribers.length; index += batchSize) {
      const batch = subscribers.slice(index, index + batchSize);
      const results = await Promise.all(
        batch.map(async (subscriber) => {
          const result = await sendPushToToken(subscriber.token, {
            title,
            body,
            url,
            image,
          });

          if (!result.ok && result.invalid) {
            await deletePushSubscription(subscriber.documentName);
          }

          return result;
        }),
      );

      for (const result of results) {
        if (result.ok) {
          sent += 1;
        } else {
          failed += 1;
          if (result.invalid) {
            removed += 1;
          }
        }
      }
    }

    return NextResponse.json({
      ok: true,
      subscribers: subscribers.length,
      sent,
      failed,
      removed,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Push notification failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
