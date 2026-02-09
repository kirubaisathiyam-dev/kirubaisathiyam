"use client";

import { useState } from "react";

const emailRegex =
  /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

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
      className="mt-3 flex flex-wrap items-center gap-3"
    >
      <input
        type="email"
        name="email"
        placeholder="you@example.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
        className="min-w-[220px] flex-1 border px-3 py-2 text-sm"
        style={{ borderColor: "var(--border-color)" }}
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="border px-4 py-2 text-sm font-semibold"
        style={{
          borderColor: "var(--foreground)",
          background: "var(--foreground)",
          color: "var(--background)",
          cursor: status === "loading" ? "not-allowed" : "pointer",
        }}
      >
        Subscribe
      </button>

      {status === "success" && (
        <span style={{ color: "#0a7a2f" }}>{successText}</span>
      )}
      {status === "error" && (
        <span style={{ color: "#b00020" }}>{errorText}</span>
      )}
    </form>
  );
}
