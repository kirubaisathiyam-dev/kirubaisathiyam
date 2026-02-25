"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, increment, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type LikeButtonProps = {
  articleId: string;
};

export default function LikeButton({ articleId }: LikeButtonProps) {
  const [likeCount, setLikeCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasServerSnapshot, setHasServerSnapshot] = useState(false);

  const articleRef = useMemo(
    () => doc(db, "articles", articleId),
    [articleId],
  );

  useEffect(() => {
    setLoading(true);
    setHasServerSnapshot(false);
    const unsubscribe = onSnapshot(
      articleRef,
      (snapshot) => {
        if (snapshot.metadata.fromCache && !hasServerSnapshot) {
          return;
        }

        setHasServerSnapshot(true);

        if (!snapshot.exists()) {
          setLikeCount(0);
        } else {
          const data = snapshot.data();
          const value =
            typeof data.likeCount === "number" ? data.likeCount : 0;
          setLikeCount(value);
        }

        setLoading(false);
      },
      () => {
        setError("Unable to load likes.");
        setLoading(false);
      },
      { includeMetadataChanges: true },
    );

    return () => unsubscribe();
  }, [articleRef, hasServerSnapshot]);

  const handleLike = async () => {
    setError(null);
    try {
      await setDoc(
        articleRef,
        {
          likeCount: increment(1),
        },
        { merge: true },
      );
    } catch {
      setError("Unable to like right now.");
    }
  };

  return (
    <div className="inline-flex flex-col gap-2">
      <button
        type="button"
        onClick={handleLike}
        className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition hover:opacity-80 shadow-sm"
        style={{
          borderColor: "var(--border-color)",
          backgroundColor: "var(--background)",
          color: "var(--foreground)",
        }}
        aria-label="Like this article"
      >
        <span aria-hidden="true" className="text-base" >
          <i className="fa-solid fa-heart text-[color:var(--foreground-bible)]" ></i>
        </span>
        <span>{loading ? "..." : likeCount ?? 0}</span>
      </button>
      {error && (
        <p className="text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
