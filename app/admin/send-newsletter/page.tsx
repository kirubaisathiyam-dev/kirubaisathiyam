"use client";

import { useState } from "react";

export default function SendNewsletterPage() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [adminKey, setAdminKey] = useState("");

  async function handleSend() {
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/send-latest-article", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(adminKey ? { "x-admin-key": adminKey } : {}),
        },
      });

      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; sent?: number; article?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.error || "Failed to send newsletter");
      }

      setStatus("success");
      setMessage(
        data?.sent
          ? `Sent to ${data.sent} subscribers (${data.article}).`
          : "Newsletter sent.",
      );
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : "Failed to send newsletter";
      setStatus("error");
      setMessage(messageText);
    }
  }

  return (
    <main style={{ padding: "2rem", maxWidth: "640px" }}>
      <h1>Send Newsletter</h1>

      <p style={{ marginTop: "0.5rem", color: "#555" }}>
        Send the latest article as a newsletter.
      </p>

      <div
        style={{
          marginTop: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          alignItems: "flex-start",
        }}
      >
        <input
          type="password"
          placeholder="Admin key (optional)"
          value={adminKey}
          onChange={(event) => setAdminKey(event.target.value)}
          style={{
            padding: "0.5rem 0.75rem",
            border: "1px solid #ccc",
            borderRadius: "6px",
            width: "100%",
            maxWidth: "320px",
          }}
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={status === "loading"}
          style={{
            padding: "0.6rem 1.2rem",
            borderRadius: "6px",
            border: "1px solid #111",
            background: "#111",
            color: "#fff",
            cursor: status === "loading" ? "not-allowed" : "pointer",
          }}
        >
          Send latest article newsletter
        </button>

        {message && (
          <span
            style={{
              color: status === "error" ? "#b00020" : "#0a7a2f",
            }}
          >
            {message}
          </span>
        )}
      </div>
    </main>
  );
}
