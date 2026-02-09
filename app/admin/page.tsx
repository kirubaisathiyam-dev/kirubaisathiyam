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
      <div className="max-w-md space-y-4">
        <h2 className="text-xl font-semibold">Admin Login</h2>
        <form className="space-y-3" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full border px-3 py-2 text-sm"
            style={{ borderColor: "var(--border-color)" }}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full border px-3 py-2 text-sm"
            style={{ borderColor: "var(--border-color)" }}
            required
          />
          <button
            type="submit"
            className="border px-4 py-2 text-sm font-semibold"
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
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Admin Dashboard</h2>
      <p style={{ color: "var(--muted-foreground)" }}>
        Choose where you want to go next.
      </p>
      <div className="flex flex-col items-start gap-2">
        <Link href="/admin/cms" className="text-sm font-semibold hover:underline">
          Go to content management
        </Link>
        <Link
          href="/admin/send-newsletter"
          className="text-sm font-semibold hover:underline"
        >
          Send newsletters
        </Link>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        className="text-sm font-semibold hover:underline"
      >
        Logout
      </button>
    </div>
  );
}
