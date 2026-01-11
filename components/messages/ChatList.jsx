"use client";

import { useEffect, useState } from "react";
import ChatItem from "./ChatItem";

export default function ChatList({ onSelect, activeChat, targetUser }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChats() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/chats`,
          { credentials: "include" }   // 🔐 COOKIE AUTH
        );

        if (!res.ok) {
          setChats([]);
          setLoading(false);
          return;
        }

        const data = await res.json();
        setChats(data || []);
        setLoading(false);
      } catch (e) {
        console.error("LOAD CHATS ERROR:", e);
        setLoading(false);
      }
    }

    loadChats();
  }, []);

  useEffect(() => {
    if (!targetUser) return;
    setChats(prev => {
      if (prev.find(c => c.username === targetUser.username)) return prev;
      return [{ username: targetUser.username, lastMessage: "" }, ...prev];
    });
  }, [targetUser]);

  if (loading) {
    return (
      <aside className="chat-list">
        <p className="text-sm text-gray-400">Yuklanmoqda...</p>
      </aside>
    );
  }

  return (
    <aside className="chat-list">
      <h2>Chats</h2>
      {chats.map(chat => (
        <ChatItem
          key={chat.username}
          chat={chat}
          active={activeChat?.username === chat.username}
          onClick={() => onSelect(chat)}
        />
      ))}
    </aside>
  );
}
