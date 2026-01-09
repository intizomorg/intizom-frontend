"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";

function MessagesInner() {
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
    if (!targetUsername) return;
    setActiveChat({ username: targetUsername });
  }, [targetUsername]);

  return (
    <div className="messages-layout">
      {(!isMobile || !activeChat) && (
        <ChatList
          activeChat={activeChat}
          onSelect={setActiveChat}
          targetUser={targetUsername ? { username: targetUsername } : null}
        />
      )}

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

export default function MessagesPage() {
  return (
    <Suspense fallback={<div>Yuklanmoqda...</div>}>
      <MessagesInner />
    </Suspense>
  );
}
