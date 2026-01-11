"use client";

import { createContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export const AuthContext = createContext(null);

const API = process.env.NEXT_PUBLIC_API_URL;

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      try {
        let res = await fetch(`${API}/auth/me`, {
          credentials: "include",
        });

        // agar accessToken muddati o‘tgan bo‘lsa → refresh qilamiz
        if (res.status === 401) {
          const refresh = await fetch(`${API}/auth/refresh`, {
            method: "POST",
            credentials: "include",
          });

          if (refresh.ok) {
            res = await fetch(`${API}/auth/me`, {
              credentials: "include",
            });
          }
        }

        if (!cancelled && res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadUser();
    return () => { cancelled = true; };
  }, []);

  const logout = async () => {
    try {
      await fetch(`${API}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {}
    setUser(null);
    router.replace("/login");
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
