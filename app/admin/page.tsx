"use client";

import Link from "next/link";
import { useSyncExternalStore, useState } from "react";

const storageKey = "ks_admin_auth";
const authEvent = "ks-admin-auth-change";

function getSnapshot() {
  if (typeof window === "undefined") {
    return false;
  }
  return window.localStorage.getItem(storageKey) === "true";
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", callback);
  window.addEventListener(authEvent, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(authEvent, callback);
  };
}

export default function AdminHomePage() {
  const isAuthed = useSyncExternalStore(subscribe, getSnapshot, () => false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const expectedEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";
  const expectedPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "";

  function handleLogout() {
    window.localStorage.removeItem(storageKey);
    window.dispatchEvent(new Event(authEvent));
    setEmail("");
    setPassword("");
  }

  function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!expectedEmail || !expectedPassword) {
      setError("Admin credentials are missing in env.");
      return;
    }

    if (email.trim() === expectedEmail && password === expectedPassword) {
      window.localStorage.setItem(storageKey, "true");
      window.dispatchEvent(new Event(authEvent));
      setPassword("");
      return;
    }

    setError("Invalid email or password.");
  }

  if (!isAuthed) {
    return (
      <div className="mx-auto max-w-md space-y-5 border p-6" style={{ borderColor: "var(--border-color)" }}>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--muted-foreground)" }}>
            Kirubai Sathiyam
          </p>
          <h2 className="text-2xl font-semibold">Admin Login</h2>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Sign in to manage content, newsletters, and notifications.
          </p>
        </div>
        <form className="space-y-3" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full border px-3 py-3 text-sm"
            style={{ borderColor: "var(--border-color)" }}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full border px-3 py-3 text-sm"
            style={{ borderColor: "var(--border-color)" }}
            required
          />
          <button
            type="submit"
            className="w-full cursor-pointer border px-4 py-3 text-sm font-semibold"
            style={{
              borderColor: "var(--foreground)",
              background: "var(--foreground)",
              color: "var(--background)",
            }}
          >
            Login
          </button>
        </form>
        {error && (
          <p className="text-sm" style={{ color: "#b00020" }}>
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section
        className="border p-6"
        style={{
          borderColor: "var(--border-color)",
          background:
            "linear-gradient(135deg, var(--muted-background), var(--background))",
        }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p
              className="text-xs font-semibold uppercase tracking-[0.18em]"
              style={{ color: "var(--muted-foreground)" }}
            >
              Admin workspace
            </p>
            <h2 className="text-2xl font-semibold leading-tight sm:text-3xl">
              Dashboard
            </h2>
            <p className="max-w-2xl text-sm" style={{ color: "var(--muted-foreground)" }}>
              Manage publishing, email campaigns, and push notifications from
              one place.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="cursor-pointer self-start border px-4 py-2 text-sm font-semibold sm:self-auto"
            style={{
              borderColor: "var(--border-color)",
              color: "var(--foreground)",
            }}
          >
            Logout
          </button>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminCard
          href="/admin/cms"
          title="TinaCMS"
          description="Create and update articles and theology content."
          label="Open CMS"
        />
        <AdminCard
          href="/admin/send-newsletter"
          title="Newsletter"
          description="Send the selected article to email subscribers."
          label="Send email"
        />
        <AdminCard
          href="/admin/notifications"
          title="Push Notifications"
          description="Send article, daily verse, or custom push messages."
          label="Send push"
        />
      </div>

      <section
        className="border p-5 text-sm"
        style={{ borderColor: "var(--border-color)" }}
      >
        <p className="font-semibold">Deployment note</p>
        <p className="mt-2" style={{ color: "var(--muted-foreground)" }}>
          TinaCMS uses local mode in development and TinaCloud in production.
          On Cloudflare, `/admin/cms` works after the Tina env vars are set for
          the deployed app.
        </p>
      </section>
    </div>
  );
}

function AdminCard({
  href,
  title,
  description,
  label,
}: {
  href: string;
  title: string;
  description: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-48 flex-col justify-between border p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
      style={{
        borderColor: "var(--border-color)",
        background: "var(--background)",
      }}
    >
      <span className="space-y-2">
        <span className="block text-lg font-semibold">{title}</span>
        <span
          className="block text-sm leading-6"
          style={{ color: "var(--muted-foreground)" }}
        >
          {description}
        </span>
      </span>
      <span className="mt-6 text-sm font-semibold group-hover:underline">
        {label}
      </span>
    </Link>
  );
}
