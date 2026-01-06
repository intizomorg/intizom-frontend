"use client";
import AuthProvider from "@/context/AuthContext";

export default function AuthLayout({ children }) {
  return (
    <AuthProvider>
      <main className="min-h-screen flex items-center justify-center bg-black">
        {children}
      </main>
    </AuthProvider>
  );
}
