"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import "./instaSidebar.css";

const menu = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/search", label: "Search", icon: "⌕" },
  { href: "/reels", label: "Reels", icon: "▶" },
  { href: "/messages", label: "Messages", icon: "✉" },
  { href: "/upload", label: "Create", icon: "＋" },
  // ❌ /profile statik link yo‘q
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useContext(AuthContext);

  return (
    <aside className="insta-sidebar">
      {/* BRAND */}
      <div className="insta-brand">
        <span className="brand-inti">inti</span>
        <span className="brand-zom">ZOM</span>
      </div>

      {/* MENU */}
      <nav className="insta-menu">
        {menu.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`insta-item ${pathname === item.href ? "active" : ""}`}
          >
            <span className="insta-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}

        {/* DYNAMIC PROFILE LINK */}
        <Link
          href={user ? `/profile/${user.username}` : "/login"}
          className={`insta-item ${
            pathname === `/profile/${user?.username}` ? "active" : ""
          }`}
        >
          <span className="insta-icon">◉</span>
          <span>Profile</span>
        </Link>
      </nav>
    </aside>
  );
}
