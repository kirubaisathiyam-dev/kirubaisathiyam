"use client";

import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
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
import { onAuthStateChanged, User } from "firebase/auth";

type RepliesProps = {
  articleId: string;
  commentId: string;
};

type ReplyItem = {
  id: string;
  text?: string;
  name?: string;
  uid?: string;
  photoURL?: string | null;
  photoUrl?: string | null;
  authorPhoto?: string | null;
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

export default function Replies({ articleId, commentId }: RepliesProps) {
  const [user, setUser] = useState<User | null>(null);
  const [replies, setReplies] = useState<ReplyItem[]>([]);
  const [text, setText] = useState("");
  const [replying, setReplying] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [replyStatus, setReplyStatus] = useState<"idle" | "posting">("idle");
  const [savingReplyId, setSavingReplyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const repliesRef = useMemo(
    () =>
      collection(db, "articles", articleId, "comments", commentId, "replies"),
    [articleId, commentId],
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const repliesQuery = query(repliesRef, orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      repliesQuery,
      (snapshot) => {
        setReplies(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as ReplyItem[],
        );
      },
      () => {
        setError("Unable to load replies right now.");
      },
    );

    return () => unsubscribe();
  }, [repliesRef]);

  const handleReply = async () => {
    const trimmed = text.trim();
    if (!trimmed || !user) {
      return;
    }

    setError(null);
    setReplyStatus("posting");
    try {
      const userName =
        user.displayName ?? user.providerData[0]?.displayName ?? "Anonymous";
      const userPhoto =
        user.photoURL ?? user.providerData[0]?.photoURL ?? null;

      await addDoc(repliesRef, {
        text: trimmed,
        name: userName,
        uid: user.uid,
        photoURL: userPhoto,
        createdAt: serverTimestamp(),
      });
      setText("");
      setReplying(false);
    } catch {
      setError("Unable to reply right now. Please try again.");
    } finally {
      setReplyStatus("idle");
    }
  };

  const handleDelete = async (replyId: string) => {
    setError(null);
    try {
      await deleteDoc(
        doc(db, "articles", articleId, "comments", commentId, "replies", replyId),
      );
    } catch {
      setError("Unable to delete right now. Please try again.");
    }
  };

  const handleEdit = (reply: ReplyItem) => {
    setEditingReplyId(reply.id);
    setEditingText(reply.text ?? "");
  };

  const handleEditSave = async (replyId: string) => {
    const trimmed = editingText.trim();
    if (!trimmed) {
      setError("Reply cannot be empty.");
      return;
    }

    setError(null);
    setSavingReplyId(replyId);
    try {
      await updateDoc(
        doc(db, "articles", articleId, "comments", commentId, "replies", replyId),
        { text: trimmed },
      );
      setEditingReplyId(null);
      setEditingText("");
    } catch {
      setError("Unable to update right now. Please try again.");
    } finally {
      setSavingReplyId(null);
    }
  };

  return (
    <div className="mt-3 space-y-3 border-l pl-4" style={{ borderColor: "var(--border-color)" }}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide">Replies</p>
        {user && (
          <button
            type="button"
            onClick={() => setReplying((prev) => !prev)}
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--muted-foreground)" }}
          >
            {replying ? "Cancel" : "Reply"}
          </button>
        )}
      </div>

      {replying && user && (
        <div className="space-y-2">
          <textarea
            rows={3}
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              borderColor: "var(--border-color)",
              backgroundColor: "var(--background)",
              color: "var(--foreground)",
            }}
            placeholder="Write a reply..."
          />
          <button
            type="button"
            onClick={handleReply}
            disabled={replyStatus === "posting" || !text.trim()}
            className="rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              borderColor: "var(--border-color)",
              backgroundColor: "var(--foreground-bible)",
              color: "var(--foreground-contrast)",
            }}
          >
            {replyStatus === "posting" ? "Posting..." : "Post reply"}
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      )}

      {replies.length > 0 && (
        <ul className="space-y-3">
          {replies.map((reply) => {
            const avatarUrl = resolveAvatarUrl(
              reply.photoURL,
              reply.photoUrl,
              reply.authorPhoto,
            );

            return (
            <li
              key={reply.id}
              className="rounded-lg border px-3 py-2"
              style={{ borderColor: "var(--border-color)" }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={reply.name ?? "Reply author"}
                      className="h-5 w-5 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border text-[10px]">
                      {reply.name?.charAt(0)?.toUpperCase() ?? "A"}
                    </span>
                  )}
                  <p className="text-xs font-semibold">
                    {reply.name ?? "Anonymous"}
                  </p>
                </div>
                <p
                  className="text-[10px]"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {formatTimestamp(reply.createdAt)}
                </p>
              </div>

              {editingReplyId === reply.id ? (
                <div className="mt-2 space-y-2">
                  <textarea
                    rows={2}
                    value={editingText}
                    onChange={(event) => setEditingText(event.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-offset-2"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: "var(--background)",
                      color: "var(--foreground)",
                    }}
                  />
                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide">
                    <button
                      type="button"
                      onClick={() => handleEditSave(reply.id)}
                      disabled={savingReplyId === reply.id}
                      className="rounded-full border px-3 py-1.5 transition hover:opacity-80"
                      style={{
                        borderColor: "var(--border-color)",
                        backgroundColor: "var(--foreground-bible)",
                        color: "var(--foreground-contrast)",
                      }}
                    >
                      {savingReplyId === reply.id ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingReplyId(null);
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
                <p className="mt-2 text-xs leading-relaxed">
                  {reply.text ?? ""}
                </p>
              )}

              {user && user.uid === reply.uid && (
                <div className="mt-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide">
                  <button
                    type="button"
                    onClick={() => handleEdit(reply)}
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
                    onClick={() => handleDelete(reply.id)}
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
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
