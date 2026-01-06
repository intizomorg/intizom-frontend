"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Home, Search, Film, MessageCircle, PlusSquare, User
} from "lucide-react";
import "./instaSidebar.css";

const menu = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/reels", label: "Reels", icon: Film },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/upload", label: "Create", icon: PlusSquare },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="insta-sidebar">
      <div className="insta-brand">
        <span className="brand-inti">inti</span>
        <span className="brand-zom">ZOM</span>
      </div>

      <nav className="insta-menu">
        {menu.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link key={item.href} href={item.href} className={`insta-item ${isActive ? "active" : ""}`}>
              <span className="insta-icon"><Icon size={22} strokeWidth={1.6} /></span>
              <span>{item.label}</span>
            </Link>
          );
        })}

        <Link
          href={user?.username ? `/profile/${user.username}` : "/login"}
          className={`insta-item ${pathname === `/profile/${user?.username}` ? "active" : ""}`}
        >
          <span className="insta-icon"><User size={22} strokeWidth={1.6} /></span>
          <span>Profile</span>
        </Link>
      </nav>
    </aside>
  );
}
