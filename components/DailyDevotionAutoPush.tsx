"use client";

import { useEffect } from "react";
import {
  getCurrentDevotionSlot,
  getTimePartsInTimeZone,
  SITE_TIME_ZONE,
} from "@/lib/daily-devotion";

const autoPushStoragePrefix = "ks-devotion-auto-push";

function getCurrentSlotStorageKey() {
  const now = new Date();
  const slot = getCurrentDevotionSlot(now, SITE_TIME_ZONE);
  const { year, monthShort, day } = getTimePartsInTimeZone(now, SITE_TIME_ZONE);
  return `${autoPushStoragePrefix}:${year}-${monthShort}-${String(day).padStart(2, "0")}-${slot}`;
}

export default function DailyDevotionAutoPush() {
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.onLine) {
      return;
    }

    const storageKey = getCurrentSlotStorageKey();
    if (window.sessionStorage.getItem(storageKey) === "done") {
      return;
    }

    let cancelled = false;

    const trigger = async () => {
      try {
        const response = await fetch("/api/push/devotion-auto", {
          method: "POST",
          cache: "no-store",
          keepalive: true,
        });

        if (!response.ok || cancelled) {
          return;
        }

        window.sessionStorage.setItem(storageKey, "done");
      } catch {
        // Ignore auto-trigger failures and let the next app open retry.
      }
    };

    void trigger();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
