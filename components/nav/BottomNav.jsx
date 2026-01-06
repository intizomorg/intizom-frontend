"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import {
  Home,
  Search,
  Film,
  MessageCircle,
  User
} from "lucide-react";

const menu = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/reels", label: "Reels", icon: Film },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "PROFILE", label: "Profile", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useContext(AuthContext);

  return (
    <nav className="bottom-nav md:hidden">
      {menu.map((item) => {
        const href =
          item.href === "PROFILE"
            ? user
              ? `/profile/${user.username}`
              : "/login"
            : item.href;

        const active =
          item.href === "PROFILE"
            ? pathname === `/profile/${user?.username}`
            : pathname === item.href;

        const Icon = item.icon;

        return (
          <Link
            key={item.label}
            href={href}
            className={`bottom-nav-item ${active ? "active" : ""}`}
          >
            <Icon className="bottom-nav-icon" />
          </Link>
        );
      })}
    </nav>
  );
}
