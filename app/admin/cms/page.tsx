"use client";

import { useEffect } from "react";

const tinaSource =
  process.env.NODE_ENV === "development"
    ? "http://localhost:4001/#/"
    : "/tina-admin/index.html#/";

export default function AdminCmsPage() {
  useEffect(() => {
    window.location.replace(tinaSource);
  }, []);

  return (
    <div className="min-h-screen px-4 py-8 text-sm">
      Opening TinaCMS...
    </div>
  );
}
