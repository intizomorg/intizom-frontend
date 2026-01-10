"use client";

import { useEffect, useRef, useState, useContext } from "react";
import Link from "next/link";
import { AuthContext } from "@/context/AuthContext";

export default function ChatWindow({ chat, onBack, isMobile }) {
  const { user } = useContext(AuthContext);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  /* =======================
     LOAD MESSAGES
  ======================= */
  useEffect(() => {
    if (!chat?.username || !user) return;

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/messages/${encodeURIComponent(
        chat.username
      )}`,
      {
        credentials: "include",
      }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch messages");
        return res.json();
      })
      .then((data) => setMessages(data || []))
      .catch(console.error);
  }, [chat?.username, user]);

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
    if (!text.trim() || !chat?.username || !user) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: chat.username,
          text: text.trim(),
        }),
      });

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
      <header className="chat-header">
        {isMobile && (
          <button onClick={onBack} className="back-btn">
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

      <div className="chat-messages">
        {messages.map((m) => (
          <div
            key={m._id || `${m.from}-${m.createdAt}`}
            className={`msg ${
              m.from === user?.username ? "outgoing" : "incoming"
            }`}
          >
            {m.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input" onSubmit={sendMessage}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message..."
        />
        <button type="submit" className="send-btn">
          ➤
        </button>
      </form>
    </div>
  );
}
