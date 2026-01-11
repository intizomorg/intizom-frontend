"use client";

import { createContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      try {
        let res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          credentials: "include"
        });

        if (res.status === 401) {
          const refreshed = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
            { method: "POST", credentials: "include" }
          );

          if (refreshed.ok) {
            res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
              credentials: "include"
            });
          }
        }

        if (res.ok) setUser(await res.json());
        else setUser(null);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const logout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setUser(null);
      router.push("/login");
    }
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
