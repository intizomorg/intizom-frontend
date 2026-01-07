"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { usePathname } from "next/navigation";

export default function MobileTopbar() {
  const pathname = usePathname();

  // login va register sahifalarida chiqmasin
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register")
  ) return null;

  return (
    <div className="mobile-topbar">
      <div className="mobile-brand text-lg font-semibold tracking-wide">
        {/* INTI — oq */}
        <span className="text-gray-900 dark:text-white">Inti</span>
        {/* ZOM — binafsha */}
        <span className="text-intizom">ZOM</span>
      </div>

      <Link
        href="/upload"
        className="mobile-upload-btn"
        aria-label="Upload"
      >
        <Plus className="mobile-upload-icon" />
      </Link>
    </div>
  );
}
