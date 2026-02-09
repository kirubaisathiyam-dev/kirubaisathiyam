"use client";

import { useEffect } from "react";

const COOKIE_CONSENT_OPTIONS = {
  palette: {
    popup: { background: "#1b1b1b" },
    button: { background: "#f7c84b", text: "#1b1b1b" },
  },
  theme: "classic",
  position: "bottom",
  content: {
    message: "This site uses cookies to improve your experience.",
    dismiss: "Got it",
  },
};

export default function CookieConsentBanner() {
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const module = await import("cookieconsent");
        if (cancelled) return;

        const instance =
          (window as any).cookieconsent ?? (module as any).default ?? module;

        if (instance && typeof instance.initialise === "function") {
          instance.initialise(COOKIE_CONSENT_OPTIONS);
        }
      } catch {
        // No-op: cookie consent is non-critical.
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
