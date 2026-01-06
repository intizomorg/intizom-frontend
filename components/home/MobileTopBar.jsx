"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

export default function MobileTopBar() {
  return (
    <header className="mobile-topbar md:hidden">
      <div className="mobile-brand">
        <span className="brand-inti">inti</span>
        <span className="brand-zom">ZOM</span>
      </div>

      <Link href="/upload" className="mobile-upload-btn" aria-label="Create">
        <Plus className="mobile-upload-icon" />
      </Link>
    </header>
  );
}
