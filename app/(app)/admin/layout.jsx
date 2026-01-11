"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default function AdminLayout({ children }) {
  const router = useRouter();

  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
          { credentials: "include" }   // 🔐 cookie orqali
        );

        if (!res.ok) {
          router.replace("/");
          return;
        }

        const user = await res.json();
        if (!user || user.role !== "admin") {
          router.replace("/");
        }
      } catch {
        router.replace("/");
      }
    }

    checkAdmin();
  }, [router]);

  return children;
}
