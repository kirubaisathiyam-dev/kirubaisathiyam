"use client";

import { useMemo, useState } from "react";

export type NewsletterArticle = {
  slug: string;
  title: string;
  date: string;
  content: string;
};

type Props = {
  articles: NewsletterArticle[];
};

export default function SendNewsletterForm({ articles }: Props) {
  const [selectedSlug, setSelectedSlug] = useState(
    articles[0]?.slug ?? "",
  );
  const [adminKey, setAdminKey] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const selectedArticle = useMemo(
    () => articles.find((article) => article.slug === selectedSlug),
    [articles, selectedSlug],
  );

  async function handleSend() {
    if (!selectedArticle) {
      setStatus("error");
      setMessage("Select an article first.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/send-latest-article", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(adminKey ? { "x-admin-key": adminKey } : {}),
        },
        body: JSON.stringify({
          slug: selectedArticle.slug,
          title: selectedArticle.title,
          content: selectedArticle.content,
        }),
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
    <div
      style={{
        marginTop: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        alignItems: "flex-start",
      }}
    >
      <label style={{ fontWeight: 600 }}>Article</label>
      <select
        value={selectedSlug}
        onChange={(event) => setSelectedSlug(event.target.value)}
        style={{
          padding: "0.5rem 0.75rem",
          border: "1px solid #ccc",
          borderRadius: "6px",
          minWidth: "280px",
        }}
      >
        {articles.length === 0 && <option>No articles found</option>}
        {articles.map((article) => (
          <option key={article.slug} value={article.slug}>
            {article.title} ({article.date})
          </option>
        ))}
      </select>

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
        disabled={status === "loading" || articles.length === 0}
        style={{
          padding: "0.6rem 1.2rem",
          borderRadius: "6px",
          border: "1px solid #111",
          background: "#111",
          color: "#fff",
          cursor:
            status === "loading" || articles.length === 0
              ? "not-allowed"
              : "pointer",
        }}
      >
        Send newsletter
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
  );
}
