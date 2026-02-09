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
      style={{
        display: "flex",
        gap: "0.75rem",
        flexWrap: "wrap",
        alignItems: "center",
        marginTop: "0.75rem",
      }}
    >
      <input
        type="email"
        name="email"
        placeholder="you@example.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
        style={{
          padding: "0.5rem 0.75rem",
          border: "1px solid #ccc",
          borderRadius: "6px",
          minWidth: "220px",
          flex: "1 1 220px",
        }}
      />
      <button
        type="submit"
        disabled={status === "loading"}
        style={{
          padding: "0.5rem 1rem",
          borderRadius: "6px",
          border: "1px solid #111",
          background: "#111",
          color: "#fff",
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
