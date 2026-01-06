"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContext, memo } from "react";
import { AuthContext } from "@/context/AuthContext";

/**
 * MENU CONFIG
 * - tashqarida turadi (re-render bo‘lmasin)
 */
const menu = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/search", label: "Search", icon: "🔍" },
  { href: "/reels", label: "Reels", icon: "🎬" },
  { href: "/messages", label: "Messages", icon: "B" },
  { href: "/notifications", label: "Notifications", icon: "❤️" },
  { href: "/upload", label: "Create", icon: "Ba" },
];

function LeftNav() {
  const pathname = usePathname();
  const { user } = useContext(AuthContext);

  return (
    <aside
      className="
        hidden sm:flex
        flex-col
        fixed left-0 top-0
        h-full w-[250px]
        border-r border-zinc-800
        bg-black p-6
        z-50
      "
    >
      {/* LOGO */}
      <h1 className="text-2xl font-bold mb-10 select-none">
        intiZOM
      </h1>

      {/* NAV */}
      <nav className="flex flex-col gap-2">
        {menu.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}   // 🔴 MUHIM: ortiqcha preload yo‘q
              className={`flex items-center gap-4 text-lg px-3 py-2 rounded-xl transition-colors duration-150 ${
                active
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-900"
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* PROFILE (dynamic) */}
        <Link
          href={user ? `/profile/${user.username}` : "/login"}
          prefetch={false}   // 🔴 MUHIM
          className={`flex items-center gap-4 text-lg px-3 py-2 rounded-xl transition-colors duration-150 ${
            pathname === `/profile/${user?.username}`
              ? "bg-zinc-800 text-white"
              : "text-zinc-400 hover:bg-zinc-900"
          }`}
        >
          <span className="text-2xl">👤</span>
          <span>Profile</span>
        </Link>
      </nav>
    </aside>
  );
}

/**
 * 🔐 memo
 * - pathname o‘zgarmasa
 * - user o‘zgarmasa
 * → qayta render bo‘lmaydi
 */
export default memo(LeftNav);
