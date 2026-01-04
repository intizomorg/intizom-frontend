// frontend/app/(app)/layout.jsx
"use client";

import Sidebar from "@/components/nav/Sidebar";
import BottomNav from "@/components/nav/BottomNav";
import { usePathname } from "next/navigation";

export default function AppLayout({ children }) {
  const pathname = usePathname();

  // Login/register sahifalarida sidebar/ bottomni yashirish
  const hideNav =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  if (hideNav) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <BottomNav />
      <main className="app-main">{children}</main>
    </>
  );
}
