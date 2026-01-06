"use client";

import Sidebar from "@/components/nav/Sidebar";
import BottomNav from "@/components/nav/BottomNav";
import { usePathname } from "next/navigation";
import AuthProvider from "@/context/AuthContext";

export default function AppLayout({ children }) {
  const pathname = usePathname();

  const hideNav =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  return (
    <AuthProvider>
      {!hideNav && <Sidebar />}
      {!hideNav && <BottomNav />}
      <main className="app-main">{children}</main>
    </AuthProvider>
  );
}
