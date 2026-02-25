"use client";

import { useEffect, useMemo, useState } from "react";
import { auth, db, provider } from "@/lib/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from "firebase/auth";
import Replies from "@/components/Replies";

type CommentsProps = {
  articleId: string;
};

type CommentItem = {
  id: string;
  text?: string;
  name?: string;
  uid?: string;
  authorName?: string;
  authorId?: string;
  photoURL?: string | null;
  authorPhoto?: string | null;
  photoUrl?: string | null;
  createdAt?: Timestamp | null;
};

function formatTimestamp(timestamp?: Timestamp | null) {
  if (!timestamp) {
    return "Just now";
  }

  return timestamp.toDate().toLocaleString();
}

function resolveAvatarUrl(...candidates: Array<unknown>) {
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
  }
  return null;
}

export default function Comments({ articleId }: CommentsProps) {
  const [user, setUser] = useState<User | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [text, setText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [savingCommentId, setSavingCommentId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "posting">("idle");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const commentsRef = useMemo(
    () => collection(db, "articles", articleId, "comments"),
    [articleId],
  );

  const headerName =
    user?.displayName ??
    user?.providerData[0]?.displayName ??
    user?.email ??
    "Signed in user";
  const headerPhoto = user?.photoURL ?? user?.providerData[0]?.photoURL ?? null;

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
        setComments(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as CommentItem[],
        );
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
      const userName =
        user.displayName ?? user.providerData[0]?.displayName ?? "Anonymous";
      const userPhoto =
        user.photoURL ?? user.providerData[0]?.photoURL ?? null;

      await addDoc(commentsRef, {
        text: trimmed,
        createdAt: serverTimestamp(),
        name: userName,
        uid: user.uid,
        photoURL: userPhoto,
      });
      setText("");
    } catch {
      setError("Unable to post right now. Please try again.");
    } finally {
      setStatus("idle");
    }
  };

  const handleDelete = async (commentId: string) => {
    setError(null);
    try {
      await deleteDoc(doc(db, "articles", articleId, "comments", commentId));
    } catch {
      setError("Unable to delete right now. Please try again.");
    }
  };

  const handleEdit = (comment: CommentItem) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.text ?? "");
  };

  const handleEditSave = async (commentId: string) => {
    const trimmed = editingText.trim();
    if (!trimmed) {
      setError("Comment cannot be empty.");
      return;
    }

    setError(null);
    setSavingCommentId(commentId);
    try {
      await updateDoc(doc(db, "articles", articleId, "comments", commentId), {
        text: trimmed,
      });
      setEditingCommentId(null);
      setEditingText("");
    } catch {
      setError("Unable to update right now. Please try again.");
    } finally {
      setSavingCommentId(null);
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
              {headerPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={headerPhoto}
                  alt={headerName}
                  className="h-7 w-7 rounded-full"
                />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full border text-xs">
                  {headerName.charAt(0)?.toUpperCase() ?? "U"}
                </span>
              )}
              <span className="font-medium">{headerName}</span>
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
            {comments.map((comment) => {
              const displayName = comment.name ?? comment.authorName ?? "Anonymous";
              const isOwner =
                !!user &&
                (user.uid === comment.uid || user.uid === comment.authorId);
              const avatarUrl = resolveAvatarUrl(
                comment.photoURL,
                comment.photoUrl,
                comment.authorPhoto,
              );

              return (
                <li
                  key={comment.id}
                  className="rounded-lg border px-4 py-3"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarUrl}
                          alt={displayName}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full border text-[10px]">
                          {displayName.charAt(0)?.toUpperCase() ?? "A"}
                        </span>
                      )}
                      <p className="text-sm font-semibold">{displayName}</p>
                    </div>
                    <p
                      className="text-xs"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {formatTimestamp(comment.createdAt)}
                    </p>
                  </div>
                  {editingCommentId === comment.id ? (
                    <div className="mt-3 space-y-2">
                      <textarea
                        rows={3}
                        value={editingText}
                        onChange={(event) => setEditingText(event.target.value)}
                        className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-offset-2"
                        style={{
                          borderColor: "var(--border-color)",
                          backgroundColor: "var(--background)",
                          color: "var(--foreground)",
                        }}
                      />
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                        <button
                          type="button"
                          onClick={() => handleEditSave(comment.id)}
                          disabled={savingCommentId === comment.id}
                          className="rounded-full border px-3 py-1.5 transition hover:opacity-80"
                          style={{
                            borderColor: "var(--border-color)",
                            backgroundColor: "var(--foreground-bible)",
                            color: "var(--foreground-contrast)",
                          }}
                        >
                          {savingCommentId === comment.id ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditingText("");
                          }}
                          className="rounded-full border px-3 py-1.5 transition hover:opacity-80"
                          style={{
                            borderColor: "var(--border-color)",
                            backgroundColor: "var(--background)",
                            color: "var(--foreground)",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm leading-relaxed">
                      {comment.text ?? ""}
                    </p>
                  )}

                  {isOwner && (
                    <div className="mt-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                      <button
                        type="button"
                        onClick={() => handleEdit(comment)}
                        className="rounded-full border px-3 py-1.5 transition hover:opacity-80"
                        style={{
                          borderColor: "var(--border-color)",
                          backgroundColor: "var(--background)",
                          color: "var(--foreground)",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(comment.id)}
                        className="rounded-full border px-3 py-1.5 transition hover:opacity-80"
                        style={{
                          borderColor: "var(--border-color)",
                          backgroundColor: "var(--background)",
                          color: "var(--foreground)",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}

                  <Replies articleId={articleId} commentId={comment.id} />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
