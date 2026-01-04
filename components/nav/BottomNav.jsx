"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { Home, Search, Film, MessageCircle, Upload } from "lucide-react";

const menu = [
  { href: "/", label: "Home", icon: <Home size={24} /> },
  { href: "/search", label: "Search", icon: <Search size={24} /> },
  { href: "/reels", label: "Reels", icon: <Film size={24} /> },
  { href: "/messages", label: "Messages", icon: <MessageCircle size={24} /> },
  { href: "/upload", label: "Upload", icon: <Upload size={24} /> },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useContext(AuthContext);

  return (
    <nav
      className="
        bottom-nav
        fixed bottom-0 left-0 right-0
        flex justify-around items-center
        h-14
        bg-black border-t border-zinc-800
        md:hidden
        z-50
      "
    >
      {menu.map((item) => {
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`text-2xl ${active ? "text-white" : "text-zinc-400"}`}
          >
            {item.icon}
          </Link>
        );
      })}

      {/* DYNAMIC PROFILE LINK */}
      <Link
        href={user ? `/profile/${user.username}` : "/login"}
        className={`text-2xl ${
          pathname === `/profile/${user?.username}` ? "text-white" : "text-zinc-400"
        }`}
      >
        👤
      </Link>
    </nav>
  );
}
