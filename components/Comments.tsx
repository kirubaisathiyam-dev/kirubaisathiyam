"use client";

import { LoadingIcon } from "@/components/Icons";
import { CommentsSkeleton } from "@/components/PageSkeletons";
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
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [authAction, setAuthAction] = useState<"idle" | "login" | "logout">(
    "idle",
  );
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
    setAuthAction("login");
    try {
      await signInWithPopup(auth, provider);
    } catch {
      setError("Google sign-in failed. Please try again.");
    } finally {
      setAuthAction("idle");
    }
  };

  const handleLogout = async () => {
    setError(null);
    setAuthAction("logout");
    try {
      await signOut(auth);
    } catch {
      setError("Sign out failed. Please try again.");
    } finally {
      setAuthAction("idle");
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
      const userPhoto = user.photoURL ?? user.providerData[0]?.photoURL ?? null;

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
    setDeletingCommentId(commentId);
    try {
      await deleteDoc(doc(db, "articles", articleId, "comments", commentId));
    } catch {
      setError("Unable to delete right now. Please try again.");
    } finally {
      setDeletingCommentId(null);
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
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Comments</h2>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Share your thoughts below.
          </p>
        </div>
        {!user && (
          <button
            type="button"
            onClick={handleLogin}
            disabled={authAction === "login"}
            className="inline-flex items-center justify-center gap-2 border px-4 py-2 text-sm font-semibold transition hover:opacity-80 disabled:cursor-wait disabled:opacity-80"
            style={{
              borderColor: "var(--theme-border-color)",
              backgroundColor: "var(--theme-foreground-bible)",
              color: "var(--theme-foreground-contrast)",
            }}
          >
            {authAction === "login" && (
              <LoadingIcon style={{ width: 16, height: 16 }} />
            )}
            <span>
              {authAction === "login" ? "Opening Google..." : "Continue with Google"}
            </span>
          </button>
        )}
      </div>

      {user && (
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
              disabled={authAction === "logout"}
              className="inline-flex items-center gap-1 text-xs font-semibold underline tracking-wide disabled:cursor-wait disabled:opacity-70"
              style={{ color: "var(--muted-foreground)" }}
            >
              {authAction === "logout" && (
                <LoadingIcon style={{ width: 14, height: 14 }} />
              )}
              <span>{authAction === "logout" ? "Signing out..." : "Sign out"}</span>
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
              className="w-full border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[color:var(--foreground-bible)]/50"
              style={{
                borderColor: "var(--theme-border-color)",
                backgroundColor: "var(--theme-background)",
                color: "var(--theme-foreground)",
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
                className="inline-flex items-center justify-center gap-2 border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  borderColor: "var(--theme-border-color)",
                  backgroundColor: "var(--theme-foreground-bible)",
                  color: "var(--theme-foreground-contrast)",
                }}
              >
                {status === "posting" && (
                  <LoadingIcon style={{ width: 14, height: 14 }} />
                )}
                <span>{status === "posting" ? "Posting..." : "Post comment"}</span>
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
          <CommentsSkeleton />
        ) : comments.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            No comments yet. Be the first to share.
          </p>
        ) : (
          <ul className="space-y-3 py-6">
            {comments.map((comment) => {
              const displayName =
                comment.name ?? comment.authorName ?? "Anonymous";
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
                  className="border px-4 py-3"
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
                    <div className="mt-3">
                      <textarea
                        rows={3}
                        value={editingText}
                        onChange={(event) => setEditingText(event.target.value)}
                        className="w-full border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[color:var(--foreground-bible)]/50"
                        style={{
                          borderColor: "var(--theme-border-color)",
                          backgroundColor: "var(--theme-background)",
                          color: "var(--theme-foreground)",
                        }}
                      />
                      <div className="flex items-center justify-end gap-2 text-[10px] font-semibold uppercase tracking-wide">
                        <button
                          type="button"
                          onClick={() => handleEditSave(comment.id)}
                          disabled={savingCommentId === comment.id}
                          className="inline-flex items-center justify-center gap-1 border px-3 py-1 transition hover:opacity-80 disabled:cursor-wait disabled:opacity-70"
                          style={{
                            borderColor: "var(--theme-border-color)",
                            backgroundColor: "var(--theme-foreground-bible)",
                            color: "var(--theme-foreground-contrast)",
                          }}
                        >
                          {savingCommentId === comment.id && (
                            <LoadingIcon style={{ width: 12, height: 12 }} />
                          )}
                          <span>
                            {savingCommentId === comment.id ? "Saving..." : "Save"}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditingText("");
                          }}
                          className="border px-3 py-1 transition hover:opacity-80"
                          style={{
                            borderColor: "var(--theme-border-color)",
                            backgroundColor: "var(--theme-background)",
                            color: "var(--theme-foreground)",
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

                  {isOwner && editingCommentId !== comment.id &&(
                    <div className="flex items-center justify-end gap-2 text-[11px] tracking-wide">
                      <button
                        type="button"
                        onClick={() => handleEdit(comment)}
                        className="transition opacity-50 hover:opacity-100 "
                        style={{
                          color: "var(--theme-foreground)",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(comment.id)}
                        disabled={deletingCommentId === comment.id}
                        className="inline-flex items-center gap-1 transition opacity-50 hover:opacity-100 disabled:cursor-wait disabled:opacity-70"
                        style={{
                          color: "var(--theme-foreground)",
                        }}
                      >
                        {deletingCommentId === comment.id && (
                          <LoadingIcon style={{ width: 12, height: 12 }} />
                        )}
                        <span>
                          {deletingCommentId === comment.id ? "Deleting..." : "Delete"}
                        </span>
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
