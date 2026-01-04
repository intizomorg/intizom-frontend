"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/nav/Sidebar";

export default function ClientLayout({ children }) {
  const pathname = usePathname();

  const isAuth =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  if (isAuth) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Sidebar fixed, layoutdan tashqarida */}
      <Sidebar />

      {/* Main content */}
      <main
        className="
          min-h-screen
          bg-black
          px-6
          pt-6
          pb-[88px]
          lg:pl-[260px]
        "
      >
        {children}
      </main>
    </div>
  );
}
