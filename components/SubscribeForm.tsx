"use client";

import { useState } from "react";
import { LoadingIcon } from "@/components/Icons";

const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

function isValidEmail(value: string) {
  return emailRegex.test(value);
}

export default function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const successText = "பதிவு செய்ததற்கு நன்றி";
  const errorText = "மீண்டும் முயற்சிக்கவும்";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setStatus("error");
      return;
    }

    setStatus("loading");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      if (!response.ok) {
        throw new Error("Subscription failed");
      }

      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 flex flex-wrap items-center gap-2 md:gap-3"
    >
      <input
        type="email"
        name="email"
        placeholder="your@email.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
        className="min-w-[220px] flex-1 border px-4 py-3 text-sm transition-colors"
        style={{
          borderColor: "var(--border-color)",
          background: "var(--background)",
        }}
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex items-center justify-center gap-2 px-6 border py-3 text-sm font-semibold hover:opacity-90 transition-all"
        style={{
          borderColor: "var(--theme-border-color)",
          backgroundColor: "var(--theme-foreground-bible)",
          color: "var(--theme-foreground-contrast)",
          cursor: status === "loading" ? "not-allowed" : "pointer",
          opacity: status === "loading" ? 0.7 : 1,
        }}
      >
        {status === "loading" && (
          <LoadingIcon style={{ width: 16, height: 16 }} />
        )}
        <span>{status === "loading" ? "Subscribing..." : "Subscribe"}</span>
      </button>

      {status === "success" && (
        <span className="w-full text-sm" style={{ color: "#2b7243" }}>
          {successText}
        </span>
      )}
      {status === "error" && (
        <span className="w-full text-sm" style={{ color: "#883645" }}>
          {errorText}
        </span>
      )}
    </form>
  );
}
