"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, increment, onSnapshot, setDoc } from "firebase/firestore";
import { HeartIcon } from "@/components/Icons";
import { db } from "@/lib/firebase";

type LikeButtonProps = {
  articleId: string;
};

export default function LikeButton({ articleId }: LikeButtonProps) {
  const [state, setState] = useState<{
    articleId: string;
    likeCount: number | null;
    hasServerSnapshot: boolean;
  }>({
    articleId,
    likeCount: null,
    hasServerSnapshot: false,
  });
  const [error, setError] = useState<string | null>(null);

  const articleRef = useMemo(
    () => doc(db, "articles", articleId),
    [articleId],
  );

  useEffect(() => {
    let hasServerSnapshot = false;
    const unsubscribe = onSnapshot(
      articleRef,
      { includeMetadataChanges: true },
      (snapshot) => {
        if (snapshot.metadata.fromCache && !hasServerSnapshot) {
          return;
        }

        if (!snapshot.metadata.fromCache) {
          hasServerSnapshot = true;
        }

        if (!snapshot.exists()) {
          setState({
            articleId,
            likeCount: 0,
            hasServerSnapshot,
          });
        } else {
          const data = snapshot.data();
          const value =
            typeof data.likeCount === "number" ? data.likeCount : 0;
          setState({
            articleId,
            likeCount: value,
            hasServerSnapshot,
          });
        }
      },
      () => {
        setError("Unable to load likes.");
      },
    );

    return () => unsubscribe();
  }, [articleRef, articleId]);

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
      {(() => {
        const isLoading =
          state.articleId !== articleId || !state.hasServerSnapshot;
        const displayCount = state.likeCount ?? 0;

        return (
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
            <span aria-hidden="true" className="text-base">
              <HeartIcon style={{ width: 20, height: 20 }} className="text-[color:var(--foreground-bible)]" />
            </span>
            <span>{isLoading ? "..." : displayCount}</span>
          </button>
        );
      })()}
      {error && (
        <p className="text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
