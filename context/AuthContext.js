"use client";

import { createContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 🔁 TOKEN DAN USER O‘QISH
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");

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

  // 🚪 LOGOUT
  const logout = () => {
  localStorage.removeItem("token");
  document.cookie = "token=; Max-Age=0; path=/";
  setUser(null);
  router.push("/login");
};


  // ⏳ Loading paytida hech narsa ko‘rsatmaymiz
  if (loading) return null;

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
