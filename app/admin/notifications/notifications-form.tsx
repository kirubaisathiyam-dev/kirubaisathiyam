"use client";

import { LoadingIcon } from "@/components/Icons";
import PushNotificationPrompt from "@/components/PushNotificationPrompt";
import { formatTamilDate } from "@/lib/date";
import { useMemo, useState } from "react";

export type NotificationArticle = {
  slug: string;
  title: string;
  date: string;
  summary?: string;
  image?: string;
};

type VerseOfTheDayRecord = {
  day?: number;
  verse_reference?: string;
  explanation?: string;
};

type DailyDevotionSlot = {
  verse?: string;
  devotion?: string;
};

type DailyDevotionRecord = {
  date?: string;
  am?: DailyDevotionSlot;
  pm?: DailyDevotionSlot;
};

type Props = {
  articles: NotificationArticle[];
};

type SendStatus = "idle" | "loading" | "success" | "error";

function getColomboDayOfYear() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(new Date()).map((part) => [part.type, part.value]),
  );
  const year = Number(parts.year);
  const month = Number(parts.month);
  const day = Number(parts.day);
  const current = Date.UTC(year, month - 1, day);
  const start = Date.UTC(year, 0, 1);
  return Math.floor((current - start) / 86_400_000) + 1;
}

function trimNotificationBody(value: string, limit = 180) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= limit) {
    return clean;
  }
  return `${clean.slice(0, limit - 3).trim()}...`;
}

function getColomboDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  );

  return {
    day: Number(parts.day),
    monthShort: parts.month ?? "Jan",
    hour: Number(parts.hour),
  };
}

function getTodayDevotionCandidates(date = new Date()) {
  const { day, monthShort } = getColomboDateParts(date);
  const dayLabel = String(day).padStart(2, "0");
  return [`${dayLabel} ${monthShort}`, `${dayLabel} Jan`];
}

function getCurrentDevotionSlot(date = new Date()) {
  return getColomboDateParts(date).hour < 12 ? "am" : "pm";
}

export default function NotificationsForm({ articles }: Props) {
  const [selectedSlug, setSelectedSlug] = useState(articles[0]?.slug ?? "");
  const [adminKey, setAdminKey] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [customUrl, setCustomUrl] = useState("/");
  const [status, setStatus] = useState<SendStatus>("idle");
  const [message, setMessage] = useState("");

  const selectedArticle = useMemo(
    () => articles.find((article) => article.slug === selectedSlug),
    [articles, selectedSlug],
  );

  async function sendPush(payload: {
    title: string;
    body?: string;
    url?: string;
    image?: string;
  }) {
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(adminKey ? { "x-admin-key": adminKey } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
            sent?: number;
            subscribers?: number;
            failed?: number;
            removed?: number;
          }
        | null;

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Push send failed.");
      }

      setStatus("success");
      setMessage(
        `Sent ${data.sent || 0}/${data.subscribers || 0}. Failed: ${
          data.failed || 0
        }. Removed: ${data.removed || 0}.`,
      );
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : "Push send failed.";
      setStatus("error");
      setMessage(messageText);
    }
  }

  async function sendArticlePush() {
    if (!selectedArticle) {
      setStatus("error");
      setMessage("Select an article first.");
      return;
    }

    await sendPush({
      title: selectedArticle.title,
      body: trimNotificationBody(selectedArticle.summary || ""),
      url: `/articles/${selectedArticle.slug}`,
      image: selectedArticle.image,
    });
  }

  async function sendDailyVersePush() {
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/verse-of-the-day.json", {
        cache: "no-cache",
      });
      const records = (await response.json()) as VerseOfTheDayRecord[];
      const day = getColomboDayOfYear();
      const record = records.find((item) => item.day === day);

      if (!record) {
        throw new Error(`Verse day ${day} was not found.`);
      }

      await sendPush({
        title: "Today verse",
        body: trimNotificationBody(
          [record.verse_reference, record.explanation].filter(Boolean).join(" "),
        ),
        url: "/",
      });
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : "Unable to send daily verse.";
      setStatus("error");
      setMessage(messageText);
    }
  }

  async function sendDailyDevotionPush() {
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/daily-devotion.json", {
        cache: "no-cache",
      });
      const records = (await response.json()) as DailyDevotionRecord[];
      const slot = getCurrentDevotionSlot();
      const record = getTodayDevotionCandidates()
        .map((candidate) =>
          records.find((item) => item.date === candidate && item[slot]?.verse),
        )
        .find(Boolean);

      const slotRecord = record?.[slot];

      if (!record || !slotRecord?.verse) {
        throw new Error(`Daily devotion for the current ${slot.toUpperCase()} slot was not found.`);
      }

      await sendPush({
        title: slot === "am" ? "Daily morning devotion" : "Daily evening devotion",
        body: trimNotificationBody(
          [slotRecord.verse, slotRecord.devotion].filter(Boolean).join(" "),
        ),
        url: "/",
      });
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : "Unable to send daily devotion.";
      setStatus("error");
      setMessage(messageText);
    }
  }

  async function sendCustomPush() {
    if (!customTitle.trim()) {
      setStatus("error");
      setMessage("Custom title is required.");
      return;
    }

    await sendPush({
      title: customTitle.trim(),
      body: customBody.trim(),
      url: customUrl.trim() || "/",
    });
  }

  const isLoading = status === "loading";

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <section
          className="space-y-4 border p-5"
          style={{ borderColor: "var(--border-color)" }}
        >
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Send push notification</h2>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Use the same admin key as newsletter, unless PUSH_ADMIN_KEY is set.
            </p>
          </div>

          <input
            type="password"
            placeholder="Admin key"
            value={adminKey}
            onChange={(event) => setAdminKey(event.target.value)}
            className="w-full border px-3 py-2 text-sm"
            style={{ borderColor: "var(--border-color)" }}
          />

          <div className="space-y-2">
            <label className="text-sm font-semibold">Article</label>
            <select
              value={selectedSlug}
              onChange={(event) => setSelectedSlug(event.target.value)}
              className="w-full border px-3 py-2 text-sm"
              style={{ borderColor: "var(--border-color)" }}
            >
              {articles.length === 0 && <option>No articles found</option>}
              {articles.map((article) => (
                <option key={article.slug} value={article.slug}>
                  {article.title} ({formatTamilDate(article.date)})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={sendArticlePush}
              disabled={isLoading || articles.length === 0}
              className="inline-flex cursor-pointer items-center justify-center gap-2 border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
              style={{
                borderColor: "var(--foreground)",
                background: "var(--foreground)",
                color: "var(--background)",
              }}
            >
              {isLoading && <LoadingIcon style={{ width: 16, height: 16 }} />}
              <span>{isLoading ? "Sending..." : "Send article push"}</span>
            </button>
          </div>

          <div
            className="border-t pt-4"
            style={{ borderColor: "var(--border-color)" }}
          >
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={sendDailyVersePush}
                disabled={isLoading}
                className="inline-flex cursor-pointer items-center justify-center gap-2 border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--muted-background)",
                  color: "var(--foreground)",
                }}
              >
                {isLoading && <LoadingIcon style={{ width: 16, height: 16 }} />}
                <span>{isLoading ? "Sending..." : "Send today verse push"}</span>
              </button>
              <button
                type="button"
                onClick={sendDailyDevotionPush}
                disabled={isLoading}
                className="inline-flex cursor-pointer items-center justify-center gap-2 border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--muted-background)",
                  color: "var(--foreground)",
                }}
              >
                {isLoading && <LoadingIcon style={{ width: 16, height: 16 }} />}
                <span>{isLoading ? "Sending..." : "Send today devotion push"}</span>
              </button>
            </div>
          </div>
        </section>

        <section
          className="space-y-4 border p-5"
          style={{ borderColor: "var(--border-color)" }}
        >
          <h2 className="text-lg font-semibold">Custom push</h2>
          <input
            type="text"
            placeholder="Title"
            value={customTitle}
            onChange={(event) => setCustomTitle(event.target.value)}
            className="w-full border px-3 py-2 text-sm"
            style={{ borderColor: "var(--border-color)" }}
          />
          <textarea
            placeholder="Body"
            value={customBody}
            onChange={(event) => setCustomBody(event.target.value)}
            rows={4}
            className="w-full border px-3 py-2 text-sm"
            style={{ borderColor: "var(--border-color)" }}
          />
          <input
            type="text"
            placeholder="URL"
            value={customUrl}
            onChange={(event) => setCustomUrl(event.target.value)}
            className="w-full border px-3 py-2 text-sm"
            style={{ borderColor: "var(--border-color)" }}
          />
          <button
            type="button"
            onClick={sendCustomPush}
            disabled={isLoading}
            className="inline-flex cursor-pointer items-center justify-center gap-2 border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
            style={{
              borderColor: "var(--foreground)",
              background: "var(--foreground)",
              color: "var(--background)",
            }}
          >
            {isLoading && <LoadingIcon style={{ width: 16, height: 16 }} />}
            <span>{isLoading ? "Sending..." : "Send custom push"}</span>
          </button>

          {message && (
            <p
              className="text-sm"
              style={{ color: status === "error" ? "#b00020" : "#0a7a2f" }}
            >
              {message}
            </p>
          )}
        </section>
      </div>

      <aside className="space-y-5">
        <PushNotificationPrompt />
        <section
          className="space-y-2 border p-4 text-sm"
          style={{ borderColor: "var(--border-color)" }}
        >
          <h2 className="font-semibold">Required env</h2>
          <p style={{ color: "var(--muted-foreground)" }}>
            NEXT_PUBLIC_FIREBASE_VAPID_KEY, FCM_SERVICE_ACCOUNT_PROJECT_ID,
            FCM_SERVICE_ACCOUNT_CLIENT_EMAIL, FCM_SERVICE_ACCOUNT_PRIVATE_KEY.
          </p>
        </section>
      </aside>
    </div>
  );
}
