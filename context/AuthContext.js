// context/AuthContext.jsx (replace relevant parts)
"use client";

import { createContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      // if no token in localStorage, try to read token from cookie
      let token = null;
      if (typeof window !== "undefined") {
        token = localStorage.getItem("token");
        if (!token) {
          // look for cookie token
          const m = document.cookie.match(/(?:^|; )token=([^;]+)/);
          if (m && m[1]) token = decodeURIComponent(m[1]);
          if (token) localStorage.setItem("token", token);
        }
      }

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      // JWT payload decode
      const payload = JSON.parse(atob(token.split(".")[1]));

      setUser({
        id: payload.id,
        username: payload.username,
        role: payload.role,
      });
    } catch (err) {
      console.error("Auth parse error:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout: clear both storage and cookie
  const logout = () => {
    try {
      localStorage.removeItem("token");
      document.cookie = "token=; Max-Age=0; path=/; domain=" + (location.hostname || "");
    } catch (e) { /* ignore */ }
    setUser(null);
    router.push("/login");
  };

  // IMPORTANT: do not return null while loading; allow children to render
  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        logout,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
