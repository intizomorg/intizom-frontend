"use client";

import { createContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 🔁 SERVERDAN FOYDALANUVCHINI O‘QISH (TOKEN DAN EMAS)
  useEffect(() => {
    const loadMe = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          credentials: "include", // cookie bilan yuborish uchun
        });

        if (!res.ok) throw new Error("Foydalanuvchi topilmadi");

        const me = await res.json();
        setUser(me);
      } catch (err) {
        console.error("Load user error:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadMe();
  }, []);

  // 🚪 LOGOUT — serverga POST so‘rov yuboradi va foydalanuvchini chiqaradi
  const logout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include", // cookie bilan yuborish
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      router.push("/login");
    }
  };

  // ⏳ Loading paytida hech narsa ko‘rsatmaymiz
  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
