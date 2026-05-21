"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, increment, onSnapshot, setDoc } from "firebase/firestore";
import { HeartIcon, LoadingIcon } from "@/components/Icons";
import { db } from "@/lib/firebase";

type DailyVerseLikeButtonProps = {
  verseId: string;
  day: number;
  reference: string;
  rawReference: string;
  className?: string;
  buttonStyle?: React.CSSProperties;
};

type BurstHeart = {
  id: string;
  left: string;
  delay: string;
  drift: string;
  rotate: string;
  duration: string;
  size: string;
};

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function createBurstHearts() {
  const count = Math.floor(randomBetween(5, 8));
  return Array.from({ length: count }, (_, index) => ({
    id: `${Date.now()}-${index}-${Math.round(randomBetween(0, 10000))}`,
    left: `${randomBetween(18, 82).toFixed(1)}%`,
    delay: `${Math.round(randomBetween(0, 180))}ms`,
    drift: `${randomBetween(-26, 26).toFixed(0)}px`,
    rotate: `${randomBetween(-24, 24).toFixed(0)}deg`,
    duration: `${Math.round(randomBetween(820, 1280))}ms`,
    size: `${randomBetween(14, 24).toFixed(0)}px`,
  })) satisfies BurstHeart[];
}

export default function DailyVerseLikeButton({
  verseId,
  day,
  reference,
  rawReference,
  className,
  buttonStyle,
}: DailyVerseLikeButtonProps) {
  const [state, setState] = useState<{
    verseId: string;
    likeCount: number | null;
    hasServerSnapshot: boolean;
  }>({
    verseId,
    likeCount: null,
    hasServerSnapshot: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isLiking, setIsLiking] = useState(false);
  const [burstHearts, setBurstHearts] = useState<BurstHeart[]>([]);

  const verseRef = useMemo(() => doc(db, "dailyVerses", verseId), [verseId]);

  useEffect(() => {
    let hasServerSnapshot = false;
    const unsubscribe = onSnapshot(
      verseRef,
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
            verseId,
            likeCount: 0,
            hasServerSnapshot,
          });
          return;
        }

        const data = snapshot.data();
        const value = typeof data.likeCount === "number" ? data.likeCount : 0;
        setState({
          verseId,
          likeCount: value,
          hasServerSnapshot,
        });
      },
      () => {
        setError("Unable to load likes.");
      },
    );

    return () => unsubscribe();
  }, [verseId, verseRef]);

  const handleLike = async () => {
    if (isLiking) {
      return;
    }

    setError(null);
    setIsLiking(true);
    setBurstHearts(createBurstHearts());

    try {
      await setDoc(
        verseRef,
        {
          date: verseId,
          day,
          reference,
          rawReference,
          likeCount: increment(1),
        },
        { merge: true },
      );
    } catch {
      setError("Unable to like right now.");
    } finally {
      setIsLiking(false);
    }
  };

  const isLoading = state.verseId !== verseId || !state.hasServerSnapshot;
  const displayCount = state.likeCount ?? 0;

  return (
    <div className="inline-flex flex-col gap-2">
      <button
        type="button"
        onClick={handleLike}
        disabled={isLoading || isLiking}
        className={`relative inline-flex h-11 items-center gap-2 overflow-visible rounded-full border px-4 text-sm font-semibold shadow-sm transition hover:opacity-80 disabled:cursor-wait disabled:opacity-80 ${
          className ?? ""
        }`}
        style={{
          borderColor: "var(--border-color)",
          backgroundColor: "var(--background)",
          color: "var(--foreground)",
          ...buttonStyle,
        }}
        aria-label="Like this verse"
        aria-busy={isLoading || isLiking}
      >
        <span className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden="true">
          {burstHearts.map((heart) => (
            <span
              key={heart.id}
              className="daily-verse-like-burst"
              style={
                {
                  left: heart.left,
                  animationDelay: heart.delay,
                  animationDuration: heart.duration,
                  fontSize: heart.size,
                  "--burst-drift": heart.drift,
                  "--burst-rotate": heart.rotate,
                } as React.CSSProperties
              }
            >
              ♥
            </span>
          ))}
        </span>
        <span aria-hidden="true" className="relative z-10 text-base">
          {isLoading || isLiking ? (
            <LoadingIcon
              style={{ width: 20, height: 20 }}
              className="text-[color:var(--theme-foreground-bible)]"
            />
          ) : (
            <HeartIcon
              style={{ width: 20, height: 20 }}
              className="text-[color:var(--theme-foreground-bible)]"
            />
          )}
        </span>
        <span className="relative z-10">{displayCount}</span>
      </button>
      {error ? (
        <p className="text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <style jsx>{`
        .daily-verse-like-burst {
          position: absolute;
          bottom: 14px;
          color: var(--theme-foreground-bible);
          line-height: 1;
          opacity: 0;
          transform: translate3d(-50%, 0, 0) scale(0.7) rotate(0deg);
          animation-name: daily-verse-like-burst;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
        }

        @keyframes daily-verse-like-burst {
          0% {
            opacity: 0;
            transform: translate3d(-50%, 0, 0) scale(0.7) rotate(0deg);
          }

          12% {
            opacity: 1;
          }

          100% {
            opacity: 0;
            transform: translate3d(calc(-50% + var(--burst-drift)), -72px, 0)
              scale(1.2) rotate(var(--burst-rotate));
          }
        }
      `}</style>
    </div>
  );
}
