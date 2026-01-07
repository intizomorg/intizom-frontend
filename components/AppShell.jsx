"use client";

import Sidebar from "@/components/nav/Sidebar";
import BottomNav from "@/components/nav/BottomNav";
import MobileTopbar from "@/components/nav/MobileTopbar";
import { usePathname } from "next/navigation";
import AuthProvider from "@/context/AuthContext";

export default function AppShell({ children }) {
  const pathname = usePathname();

  const hideNav =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register");

  return (
    <AuthProvider>
      {!hideNav && <MobileTopbar />}
      {!hideNav && <Sidebar />}
      {!hideNav && <BottomNav />}
      <main className="app-main">{children}</main>
    </AuthProvider>
  );
}
