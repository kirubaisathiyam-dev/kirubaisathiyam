"use client";

import { useEffect } from "react";

type CookieConsentInstance = {
  initialise?: (options: typeof COOKIE_CONSENT_OPTIONS) => void;
};

declare global {
  interface Window {
    cookieconsent?: CookieConsentInstance;
  }
}

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
        const cookieModule = (await import("cookieconsent")) as
          | CookieConsentInstance
          | { default?: CookieConsentInstance };
        if (cancelled) return;

        const maybeInstance =
          window.cookieconsent ??
          ("default" in cookieModule ? cookieModule.default : undefined) ??
          cookieModule;

        const instance = maybeInstance as CookieConsentInstance | undefined;

        if (instance?.initialise) {
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
