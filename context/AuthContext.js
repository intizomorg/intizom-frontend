// frontend/context/AuthContext.js
"use client";

import { createContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { loginUser as apiLoginUser, logoutUser as apiLogoutUser, getPosts as apiGetPosts } from "@/lib/api";

export const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // load current user on mount if accessToken exists
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        if (!token) {
          if (mounted) setLoading(false);
          return;
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          method: "GET",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) {
          // token invalid -> clear and exit
          localStorage.removeItem("accessToken");
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        const u = await res.json();
        // capture csrf header if present
        const csrf = res.headers.get("x-csrf-token");
        if (csrf && typeof window !== "undefined") localStorage.setItem("csrf", csrf);

        if (mounted) setUser(u);
      } catch (e) {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    init();

    return () => { mounted = false; };
  }, []);

  // login wrapper: calls lib/api.loginUser which stores token + fetches /auth/me
  const login = useCallback(async (username, password) => {
    setLoading(true);
    try {
      const { accessToken, user: u } = await apiLoginUser({ username, password });
      setUser(u);
      router.push("/");
      return u;
    } finally {
      setLoading(false);
    }
  }, [router]);

  // logout wrapper
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await apiLogoutUser();
    } finally {
      setUser(null);
      setLoading(false);
      router.push("/login");
    }
  }, [router]);

  // convenience: refresh current user info
  const refreshUser = useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (!token) return null;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        method: "GET",
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return null;
      const u = await res.json();
      const csrf = res.headers.get("x-csrf-token");
      if (csrf && typeof window !== "undefined") localStorage.setItem("csrf", csrf);
      setUser(u);
      return u;
    } catch {
      return null;
    }
  }, []);

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
