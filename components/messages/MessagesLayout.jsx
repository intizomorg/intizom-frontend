"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";

export default function MessagesLayout() {
  const [activeChat, setActiveChat] = useState(null);

  const searchParams = useSearchParams();
  // ❌ old: const targetUserId = searchParams.get("user");
  // ✅ new: treat "user" param as username
  const targetUsername = searchParams.get("user");

  return (
    <div className="messages-layout">
      <ChatList
        activeChat={activeChat}
        onSelect={setActiveChat}
        targetUser={
          targetUsername
            ? { username: targetUsername } // ✅ only username
            : null
        }
      />

      <ChatWindow chat={activeChat} />
    </div>
  );
}
