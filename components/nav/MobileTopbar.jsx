"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { usePathname } from "next/navigation";

export default function MobileTopbar() {
  const pathname = usePathname();

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register")
  ) return null;

  return (
    <div className="mobile-topbar">
      <div className="mobile-brand">
        <span className="inti">inti</span>
        <span className="zom">ZOM</span>
      </div>

      <Link href="/upload" className="mobile-upload-btn" aria-label="Upload">
        <Plus className="mobile-upload-icon" />
      </Link>
    </div>
  );
}
