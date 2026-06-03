import { NextResponse } from "next/server";
import { getCurrentDailyDevotionPushMessage, getCurrentDevotionNotificationState } from "@/lib/devotion-push";
import {
  deletePushSubscription,
  getFirebaseProjectId,
  getGoogleAccessToken,
  listPushSubscriptions,
  sendPushToToken,
} from "@/lib/push-edge";

export const runtime = "edge";

type FirestoreValue =
  | { stringValue: string }
  | { booleanValue: boolean }
  | { timestampValue: string };

type FirestoreDocument = {
  name?: string;
  fields?: Record<string, FirestoreValue>;
};

const collectionName = "pushNotificationStatus";
const batchSize = 20;
const staleLockMs = 15 * 60 * 1000;

function firestoreBaseUrl(projectId: string) {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
}

function readBooleanField(document: FirestoreDocument | null, fieldName: string) {
  const field = document?.fields?.[fieldName];
  return field && "booleanValue" in field ? field.booleanValue : false;
}

function readStringField(document: FirestoreDocument | null, fieldName: string) {
  const field = document?.fields?.[fieldName];
  return field && "stringValue" in field ? field.stringValue : "";
}

function readTimestampField(document: FirestoreDocument | null, fieldName: string) {
  const field = document?.fields?.[fieldName];
  return field && "timestampValue" in field ? field.timestampValue : "";
}

function isStalePendingDocument(document: FirestoreDocument | null) {
  if (!document || readBooleanField(document, "sent")) {
    return false;
  }

  if (readStringField(document, "status") !== "sending") {
    return false;
  }

  const updatedAt = readTimestampField(document, "updatedAt");
  if (!updatedAt) {
    return true;
  }

  const updatedTime = new Date(updatedAt).getTime();
  return Number.isFinite(updatedTime) && Date.now() - updatedTime > staleLockMs;
}

async function readStatusDocument(documentId: string) {
  const projectId = getFirebaseProjectId();
  const accessToken = await getGoogleAccessToken();
  const response = await fetch(
    `${firestoreBaseUrl(projectId)}/${collectionName}/${documentId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Unable to load devotion push status.");
  }

  return (await response.json().catch(() => null)) as FirestoreDocument | null;
}

async function createPendingStatusDocument(
  documentId: string,
  dateKey: string,
  slot: string,
) {
  const projectId = getFirebaseProjectId();
  const accessToken = await getGoogleAccessToken();
  const response = await fetch(
    `${firestoreBaseUrl(projectId)}/${collectionName}/${documentId}?currentDocument.exists=false`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          dateKey: { stringValue: dateKey },
          slot: { stringValue: slot },
          sent: { booleanValue: false },
          status: { stringValue: "sending" },
          updatedAt: { timestampValue: new Date().toISOString() },
        } satisfies Record<string, FirestoreValue>,
      }),
    },
  );

  if (response.ok) {
    return true;
  }

  if (response.status === 409 || response.status === 412) {
    return false;
  }

  const errorText = await response.text();
  throw new Error(`Unable to claim devotion push lock: ${response.status} ${errorText}`);
}

async function updateStatusDocument(
  documentId: string,
  fields: Record<string, FirestoreValue>,
) {
  const projectId = getFirebaseProjectId();
  const accessToken = await getGoogleAccessToken();
  const response = await fetch(
    `${firestoreBaseUrl(projectId)}/${collectionName}/${documentId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Unable to update devotion push status: ${response.status} ${errorText}`);
  }
}

async function deleteStatusDocument(documentId: string) {
  const projectId = getFirebaseProjectId();
  const accessToken = await getGoogleAccessToken();
  await fetch(
    `${firestoreBaseUrl(projectId)}/${collectionName}/${documentId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
}

export async function POST() {
  const { dateKey, slot, documentId } = getCurrentDevotionNotificationState();

  try {
    let existing = await readStatusDocument(documentId);
    if (isStalePendingDocument(existing)) {
      await deleteStatusDocument(documentId);
      existing = null;
    }

    if (readBooleanField(existing, "sent")) {
      return NextResponse.json({ ok: true, triggered: false, reason: "already-sent" });
    }

    const claimed = await createPendingStatusDocument(documentId, dateKey, slot);
    if (!claimed) {
      const latest = await readStatusDocument(documentId);
      return NextResponse.json({
        ok: true,
        triggered: false,
        reason: readBooleanField(latest, "sent") ? "already-sent" : "already-processing",
      });
    }

    const message = getCurrentDailyDevotionPushMessage();
    if (!message) {
      await deleteStatusDocument(documentId);
      return NextResponse.json(
        { ok: false, error: `Daily devotion for ${dateKey} ${slot.toUpperCase()} was not found.` },
        { status: 404 },
      );
    }

    const subscribers = await listPushSubscriptions();
    if (subscribers.length === 0) {
      await deleteStatusDocument(documentId);

      return NextResponse.json({
        ok: true,
        triggered: false,
        reason: "no-subscribers",
        sent: 0,
        failed: 0,
        removed: 0,
        subscribers: 0,
      });
    }

    let sent = 0;
    let failed = 0;
    let removed = 0;

    for (let index = 0; index < subscribers.length; index += batchSize) {
      const batch = subscribers.slice(index, index + batchSize);
      const results = await Promise.all(
        batch.map(async (subscriber) => {
          const result = await sendPushToToken(subscriber.token, message);
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

    await updateStatusDocument(documentId, {
      dateKey: { stringValue: dateKey },
      slot: { stringValue: slot },
      sent: { booleanValue: true },
      status: { stringValue: "sent" },
      updatedAt: { timestampValue: new Date().toISOString() },
      sentCount: { stringValue: String(sent) },
      failedCount: { stringValue: String(failed) },
      removedCount: { stringValue: String(removed) },
    });

    return NextResponse.json({
      ok: true,
      triggered: true,
      sent,
      failed,
      removed,
      subscribers: subscribers.length,
    });
  } catch (error) {
    try {
      await deleteStatusDocument(documentId);
    } catch {
      // Ignore cleanup failures so the original error is returned.
    }

    const message =
      error instanceof Error ? error.message : "Automatic daily devotion push failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
