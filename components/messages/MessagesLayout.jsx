"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";

export default function MessagesLayout() {
  const [activeChat, setActiveChat] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  const searchParams = useSearchParams();
  const targetUsername = searchParams.get("user");

  useEffect(() => {
    const setHeight = () => {
      document.documentElement.style.setProperty(
        "--app-height",
        `${window.innerHeight}px`
      );
    };
    setHeight();
    window.addEventListener("resize", setHeight);
    return () => window.removeEventListener("resize", setHeight);
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (targetUsername) setActiveChat({ username: targetUsername });
  }, [targetUsername]);

  return (
    <div className="messages-layout">
      <div
        style={{
          display: isMobile && activeChat ? "none" : "block",
          height: "100%",
        }}
      >
        <ChatList
          activeChat={activeChat}
          onSelect={setActiveChat}
          targetUser={targetUsername ? { username: targetUsername } : null}
        />
      </div>

      <div
        style={{
          display: isMobile && !activeChat ? "none" : "flex",
          height: "100%",
        }}
      >
        <ChatWindow
          chat={activeChat}
          onBack={() => setActiveChat(null)}
          isMobile={isMobile}
        />
      </div>
    </div>
  );
}
