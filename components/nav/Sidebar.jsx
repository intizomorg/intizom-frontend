"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import {
  Home,
  Search,
  PlaySquare,
  Mail,
  PlusSquare,
  UserCircle
} from "lucide-react";
import "./instaSidebar.css";

const menu = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/reels", label: "Reels", icon: PlaySquare },
  { href: "/messages", label: "Messages", icon: Mail },
  { href: "/upload", label: "Create", icon: PlusSquare },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useContext(AuthContext);

  return (
    <aside className="insta-sidebar">
      <div className="insta-brand">
        <span className="brand-inti">inti</span>
        <span className="brand-zom">ZOM</span>
      </div>

      <nav className="insta-menu">
        {menu.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`insta-item ${pathname === item.href ? "active" : ""}`}
            >
              <Icon className="insta-icon" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <Link
          href={user ? `/profile/${user.username}` : "/login"}
          className={`insta-item ${
            pathname === `/profile/${user?.username}` ? "active" : ""
          }`}
        >
          <UserCircle className="insta-icon" />
          <span>Profile</span>
        </Link>
      </nav>
    </aside>
  );
}
