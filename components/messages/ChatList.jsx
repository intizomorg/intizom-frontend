"use client";

import { useEffect, useState } from "react";
import ChatItem from "./ChatItem";

export default function ChatList({ onSelect, activeChat, targetUser }) {
  const [chats, setChats] = useState([]);
  
  const [loading, setLoading] = useState(true);
 
 useEffect(() => {
  async function loadChats() {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/chats`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch chats");
    }

    const data = await res.json();
    setChats(data || []);
    setLoading(false);
  }

  loadChats();
}, []);


  // 🔥 TEMP CHATNI CHAT LISTGA QO‘SHAMIZ
  useEffect(() => {
    if (!targetUser) return;

    setChats((prev) => {
      const exists = prev.find(c => c.username === targetUser.username);

      if (exists) return prev;

      return [
  {
    username: targetUser.username,
    lastMessage: "",
    online: false,
    isTemp: true,
  },
  ...prev,
];

    });
  }, [targetUser]);
  useEffect(() => {
  function handler(e) {
    const username = e.detail.username;
    setChats(prev => {
      if (prev.find(c => c.username === username)) return prev;
      return [{ username, lastMessage: "", online: false }, ...prev];
    });
  }
  window.addEventListener("new-chat", handler);
  return () => window.removeEventListener("new-chat", handler);
}, []);

  // 🔥 ACTIVE CHATNI MAJBURAN O‘RNATAMIZ
  useEffect(() => {
    if (!targetUser) return;
const found = chats.find(c => c.username === targetUser.username);



    if (found) {
      onSelect(found);
    }
  }, [targetUser, chats, onSelect]);

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

      {chats.map((chat) => (
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
