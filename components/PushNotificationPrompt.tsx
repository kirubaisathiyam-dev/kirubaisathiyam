"use client";

import { BellIcon, BellOffIcon, LoadingIcon } from "@/components/Icons";
import { app } from "@/lib/firebase";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { useEffect, useState } from "react";

type Status = "checking" | "hidden" | "ready" | "loading" | "enabled" | "error";

type PushNotificationPromptProps = {
  variant?: "compact" | "card" | "icon" | "auto";
};

const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "";
const autoPromptStorageKey = "ks_push_auto_prompt_seen";

export default function PushNotificationPrompt({
  variant = "card",
}: PushNotificationPromptProps) {
  const [status, setStatus] = useState<Status>("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function checkSupport() {
      if (!vapidKey || typeof window === "undefined") {
        setStatus("hidden");
        return;
      }

      if (
        variant === "auto" &&
        window.localStorage.getItem(autoPromptStorageKey) === "true"
      ) {
        setStatus("hidden");
        return;
      }

      const supported =
        "Notification" in window &&
        "serviceWorker" in navigator &&
        (await isSupported().catch(() => false));

      if (cancelled) {
        return;
      }

      if (!supported) {
        setStatus("hidden");
        setMessage("Notifications are not supported in this browser.");
        return;
      }

      if (Notification.permission === "granted") {
        if (variant === "auto") {
          window.localStorage.setItem(autoPromptStorageKey, "true");
        }
        setStatus("enabled");
        setMessage("Notifications are enabled.");
        return;
      }

      if (Notification.permission === "denied") {
        if (variant === "icon") {
          setStatus("error");
          setMessage("Notifications are blocked in browser settings.");
        } else {
          setStatus("hidden");
        }
        if (variant === "auto") {
          window.localStorage.setItem(autoPromptStorageKey, "true");
        }
        return;
      }

      setStatus("ready");
    }

    void checkSupport();

    return () => {
      cancelled = true;
    };
  }, [variant]);

  async function enableNotifications() {
    if (Notification.permission === "denied") {
      const blockedMessage =
        "Notifications are blocked. Enable them from browser site settings, then click again.";
      setStatus("error");
      setMessage(blockedMessage);
      window.alert(blockedMessage);
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setStatus("ready");
        setMessage("Browser notification permission is required.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const messaging = getMessaging(app);
      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (!token) {
        throw new Error("Unable to create push token.");
      }

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Unable to save push subscription.");
      }

      setStatus("enabled");
      setMessage("Notifications are enabled.");
      window.localStorage.setItem(autoPromptStorageKey, "true");
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : "Push notification failed.";
      setStatus("error");
      setMessage(messageText);
    }
  }

  if (variant === "icon" && (status === "checking" || status === "hidden")) {
    return (
      <button
        type="button"
        disabled
        className="text-base opacity-60"
        aria-label="Notifications unavailable"
        title={message || "Notifications unavailable"}
      >
        <BellOffIcon style={{ width: 25, height: 25 }} />
      </button>
    );
  }

  if (status === "checking" || status === "hidden") {
    return null;
  }

  const isLoading = status === "loading";
  const isEnabled = status === "enabled";

  if (variant === "auto") {
    function dismissAutoPrompt() {
      window.localStorage.setItem(autoPromptStorageKey, "true");
      setStatus("hidden");
    }

    return (
      <div className="fixed inset-x-0 bottom-4 z-[70] px-4">
        <section
          className="mx-auto max-w-md space-y-3 border p-4 shadow-2xl"
          style={{
            borderColor: "var(--border-color)",
            background: "var(--background)",
            color: "var(--foreground)",
          }}
        >
          <div className="flex items-start gap-3">
            <BellIcon style={{ width: 24, height: 24, flex: "0 0 auto" }} />
            <div className="space-y-1">
              <h2 className="text-sm font-semibold">Enable notifications?</h2>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                Get today&apos;s verse and new article alerts from Kirubai
                Sathiyam.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={enableNotifications}
              disabled={isLoading}
              className="inline-flex cursor-pointer items-center justify-center gap-2 border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
              style={{
                borderColor: "var(--foreground)",
                background: "var(--foreground)",
                color: "var(--background)",
              }}
            >
              {isLoading && <LoadingIcon style={{ width: 16, height: 16 }} />}
              <span>{isLoading ? "Enabling..." : "Enable"}</span>
            </button>
            <button
              type="button"
              onClick={dismissAutoPrompt}
              disabled={isLoading}
              className="cursor-pointer border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
              style={{
                borderColor: "var(--border-color)",
                color: "var(--foreground)",
              }}
            >
              Not now
            </button>
          </div>
          {message && (
            <p
              className="text-xs"
              style={{
                color:
                  status === "error" ? "#b00020" : "var(--muted-foreground)",
              }}
            >
              {message}
            </p>
          )}
        </section>
      </div>
    );
  }

  if (variant === "icon") {
    const isBlocked = status === "error";

    return (
      <button
        type="button"
        onClick={enableNotifications}
        disabled={isLoading || isEnabled}
        className="cursor-pointer text-base hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-60"
        aria-label={
          isBlocked
            ? message
            : isEnabled
              ? "Notifications enabled"
              : "Enable notifications"
        }
        title={
          isBlocked
            ? message
            : isEnabled
              ? "Notifications enabled"
              : "Enable notifications"
        }
      >
        {isLoading ? (
          <LoadingIcon style={{ width: 25, height: 25 }} />
        ) : isBlocked ? (
          <BellOffIcon style={{ width: 25, height: 25 }} />
        ) : (
          <BellIcon style={{ width: 25, height: 25 }} />
        )}
      </button>
    );
  }

  if (variant === "compact") {
    return (
      <div className="flex flex-col items-start gap-2 text-sm">
        <button
          type="button"
          onClick={enableNotifications}
          disabled={isLoading || isEnabled}
          className="inline-flex cursor-pointer items-center justify-center gap-2 border px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-70"
          style={{
            borderColor: "var(--border-color)",
            background: "var(--background)",
            color: "var(--foreground)",
          }}
        >
          {isLoading && <LoadingIcon style={{ width: 16, height: 16 }} />}
          <span>{isEnabled ? "Notifications enabled" : "Get notifications"}</span>
        </button>
        {message && (
          <span
            className="text-xs"
            style={{ color: status === "error" ? "#b00020" : "var(--muted-foreground)" }}
          >
            {message}
          </span>
        )}
      </div>
    );
  }

  return (
    <section
      className="space-y-3 border p-4"
      style={{
        borderColor: "var(--border-color)",
        background: "var(--background)",
      }}
    >
      <div className="space-y-1">
        <h2 className="text-base font-semibold">Notifications</h2>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Get alerts for today&apos;s verse and new articles.
        </p>
      </div>
      <button
        type="button"
        onClick={enableNotifications}
        disabled={isLoading || isEnabled}
        className="inline-flex cursor-pointer items-center justify-center gap-2 border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
        style={{
          borderColor: "var(--foreground)",
          background: "var(--foreground)",
          color: "var(--background)",
        }}
      >
        {isLoading && <LoadingIcon style={{ width: 16, height: 16 }} />}
        <span>{isEnabled ? "Notifications enabled" : "Get notifications"}</span>
      </button>
      {message && (
        <p
          className="text-sm"
          style={{ color: status === "error" ? "#b00020" : "var(--muted-foreground)" }}
        >
          {message}
        </p>
      )}
    </section>
  );
}
