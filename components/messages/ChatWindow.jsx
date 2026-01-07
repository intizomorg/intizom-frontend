"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* =======================
   JWT PARSER (SAFE)
======================= */
function parseJwt(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export default function ChatWindow({ chat, onBack, isMobile }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  // A. myUsername token ichidan olinadi (FIXED)
  const payload = token ? parseJwt(token) : null;
  const myUsername = payload?.username || null;

  /* =======================
     LOAD MESSAGES
  ======================= */
  useEffect(() => {
    if (!chat?.username || !token) return;

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/messages/${encodeURIComponent(
        chat.username
      )}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch messages");
        return res.json();
      })
      .then((data) => setMessages(data || []))
      .catch(console.error);
  }, [chat?.username, token]);

  /* =======================
     AUTO SCROLL
  ======================= */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!chat) {
    return (
      <div className="chat-window empty">
        <p>Suhbatni tanlang</p>
      </div>
    );
  }

  /* =======================
     SEND MESSAGE
  ======================= */
  const sendMessage = async (e) => {
    e.preventDefault();

    if (!text.trim()) return;
    if (!chat?.username) return;
    if (!token) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            to: chat.username,
            text: text.trim(),
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to send message");

      const data = await res.json();

      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
        setText("");
      }
    } catch (err) {
      console.error("SEND MESSAGE ERROR:", err);
    }
  };

  return (
    <div className="chat-window">
      {/* HEADER */}
      <header className="chat-header">
        {isMobile && (
          <button
            type="button"
            onClick={onBack}
            className="back-btn"
            aria-label="Back"
          >
            ←
          </button>
        )}

        <Link
          href={`/profile/${encodeURIComponent(chat.username)}`}
          className="chat-header-user"
        >
          {chat.username}
        </Link>
      </header>

      {/* MESSAGES */}
      <div className="chat-messages">
        {messages.map((m) => (
          <div
            key={m._id || `${m.from}-${m.createdAt}`}
            className={`msg ${
              m.from === myUsername ? "outgoing" : "incoming"
            }`}
          >
            {m.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <form className="chat-input" onSubmit={sendMessage}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message..."
        />
        <button type="submit" className="send-btn" aria-label="Send message">
          ➤
        </button>
      </form>
    </div>
  );
}
