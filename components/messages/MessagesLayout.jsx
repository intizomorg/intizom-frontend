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

  /* =======================
     🔧 HEIGHT PATCH
     Mobile viewport fix
  ======================= */
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

  /* =======================
     MOBILE CHECK
  ======================= */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /* =======================
     🔧 IMPORTANT PATCH
     URL orqali kelsa chatni
     avtomatik ochish
  ======================= */
  useEffect(() => {
    if (!targetUsername) return;

    setActiveChat({ username: targetUsername });
  }, [targetUsername]);

  return (
    <div className="messages-layout">
      {/* CHAT LIST */}
      {(!isMobile || !activeChat) && (
        <ChatList
          activeChat={activeChat}
          onSelect={setActiveChat}
          targetUser={targetUsername ? { username: targetUsername } : null}
        />
      )}

      {/* CHAT WINDOW */}
      {(!isMobile || activeChat) && (
        <ChatWindow
          chat={activeChat}
          onBack={() => setActiveChat(null)}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}
