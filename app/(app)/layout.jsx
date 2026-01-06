"use client";

import AuthProvider from "@/context/AuthContext";
import Sidebar from "@/components/nav/Sidebar";

export default function AppLayout({ children }) {
  return (
    <AuthProvider>
      <div className="flex bg-black text-white min-h-screen">
        <Sidebar />

        {/* 🔥 FAQAT SHU YER SCROLL BO‘LADI */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
