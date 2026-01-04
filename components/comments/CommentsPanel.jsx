"use client";

import { useContext, useState } from "react";
import { AuthContext } from "@/context/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL;

function getToken() {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|; )token=([^;]*)/);
  return m ? m[1] : null;
}

export default function CommentsPanel({
  open,
  onClose,
  postId,
  comments,
  setComments,
}) {
  const { user } = useContext(AuthContext);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  if (!open) return null;

  const submitComment = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const token = getToken();
    if (!token) return;

    setSending(true);

    try {
      const res = await fetch(`${API}/posts/${postId}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (res.ok && data?.comment) {
        const c = data.comment;

        setComments((prev) => [
          ...prev,
          {
            id: c.id || c._id,
            user: c.user,
            text: c.text,
            createdAt: c.createdAt,
          },
        ]);

        setText("");
      }
    } catch (err) {
      console.error("Comment yuborishda xato:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="comments-overlay" onClick={onClose} />

      <aside className="comments-panel">
        <header className="comments-header">
          <span>Comments</span>
          <button onClick={onClose}>✕</button>
        </header>

        <div className="comments-list">
          {comments.map((c) => (
            <div key={c.id} className="comment-item">
              <strong>{c.user}</strong> {c.text}
            </div>
          ))}
        </div>

        {user && (
          <form className="comments-input" onSubmit={submitComment}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a comment..."
              disabled={sending}
            />
          </form>
        )}
      </aside>
    </>
  );
}
