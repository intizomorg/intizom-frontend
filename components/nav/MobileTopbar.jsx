"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { usePathname } from "next/navigation";

export default function MobileTopbar() {
  const pathname = usePathname();

  // reels, login, register sahifalarida chiqmasin
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register")
  ) return null;

  return (
    <div className="mobile-topbar">
      <div className="mobile-brand">
        <span style={{ color: "#8F00FF" }}>Inti</span>
        <span>ZOM</span>
      </div>

      <Link href="/upload" className="mobile-upload-btn" aria-label="Upload">
        <Plus className="mobile-upload-icon" />
      </Link>
    </div>
  );
}
