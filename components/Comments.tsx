"use client";

import { useEffect, useMemo, useState } from "react";
import { auth, db, provider } from "@/lib/firebase";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from "firebase/auth";

type CommentsProps = {
  articleId: string;
};

type CommentItem = {
  id: string;
  text: string;
  createdAt?: Timestamp | null;
  authorName?: string | null;
  authorPhoto?: string | null;
};

function formatTimestamp(timestamp?: Timestamp | null) {
  if (!timestamp) {
    return "Just now";
  }

  return timestamp.toDate().toLocaleString();
}

export default function Comments({ articleId }: CommentsProps) {
  const [user, setUser] = useState<User | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "posting">("idle");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const commentsRef = useMemo(
    () => collection(db, "articles", articleId, "comments"),
    [articleId],
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const commentsQuery = query(commentsRef, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      commentsQuery,
      (snapshot) => {
        const nextComments = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            text: typeof data.text === "string" ? data.text : "",
            createdAt: (data.createdAt as Timestamp | null) ?? null,
            authorName:
              typeof data.authorName === "string" ? data.authorName : "Anonymous",
            authorPhoto:
              typeof data.authorPhoto === "string" ? data.authorPhoto : null,
          };
        });
        setComments(nextComments);
        setLoading(false);
      },
      () => {
        setError("Unable to load comments right now.");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [commentsRef]);

  const handleLogin = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, provider);
    } catch {
      setError("Google sign-in failed. Please try again.");
    }
  };

  const handleLogout = async () => {
    setError(null);
    try {
      await signOut(auth);
    } catch {
      setError("Sign out failed. Please try again.");
    }
  };

  const handlePost = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    if (!user) {
      setError("Please sign in to post a comment.");
      return;
    }

    setStatus("posting");
    setError(null);

    try {
      await addDoc(commentsRef, {
        text: trimmed,
        createdAt: serverTimestamp(),
        authorName: user.displayName ?? "Anonymous",
        authorPhoto: user.photoURL ?? null,
        authorId: user.uid,
      });
      setText("");
    } catch {
      setError("Unable to post right now. Please try again.");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Comments</h2>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Share your thoughts below.
        </p>
      </div>

      {!user ? (
        <button
          type="button"
          onClick={handleLogin}
          className="inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition hover:opacity-80"
          style={{
            borderColor: "var(--border-color)",
            backgroundColor: "var(--foreground-bible)",
            color: "var(--foreground-contrast)",
          }}
        >
          Continue with Google
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              {user.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photoURL}
                  alt={user.displayName ?? "User avatar"}
                  className="h-7 w-7 rounded-full"
                />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full border text-xs">
                  {user.displayName?.charAt(0)?.toUpperCase() ?? "U"}
                </span>
              )}
              <span className="font-medium">
                {user.displayName ?? user.email ?? "Signed in user"}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--muted-foreground)" }}
            >
              Sign out
            </button>
          </div>

          <div className="space-y-2">
            <label className="sr-only" htmlFor={`comment-${articleId}`}>
              Write a comment
            </label>
            <textarea
              id={`comment-${articleId}`}
              rows={4}
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-offset-2"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--background)",
                color: "var(--foreground)",
              }}
              placeholder="Write your comment..."
            />
            <div className="flex items-center justify-between">
              <p
                className="text-xs"
                style={{ color: "var(--muted-foreground)" }}
              >
                Be respectful and kind.
              </p>
              <button
                type="button"
                onClick={handlePost}
                disabled={status === "posting" || !text.trim()}
                className="rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--foreground-bible)",
                  color: "var(--foreground-contrast)",
                }}
              >
                {status === "posting" ? "Posting..." : "Post comment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="space-y-3">
        {loading ? (
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Loading comments...
          </p>
        ) : comments.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            No comments yet. Be the first to share.
          </p>
        ) : (
          <ul className="space-y-3">
            {comments.map((comment) => (
              <li
                key={comment.id}
                className="rounded-lg border px-4 py-3"
                style={{ borderColor: "var(--border-color)" }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {comment.authorPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={comment.authorPhoto}
                        alt={comment.authorName ?? "Comment author"}
                        className="h-6 w-6 rounded-full"
                      />
                    ) : (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full border text-[10px]">
                        {comment.authorName?.charAt(0)?.toUpperCase() ?? "A"}
                      </span>
                    )}
                    <p className="text-sm font-semibold">
                      {comment.authorName ?? "Anonymous"}
                    </p>
                  </div>
                  <p
                    className="text-xs"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {formatTimestamp(comment.createdAt)}
                  </p>
                </div>
                <p className="mt-2 text-sm leading-relaxed">{comment.text}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
