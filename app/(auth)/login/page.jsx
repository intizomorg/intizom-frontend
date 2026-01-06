"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const metadata = {
  title: "Better Call Odil – Kirish",
  description: "Better Call Odil platformasiga kirish sahifasi",
};

import { useState, useContext } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/lib/api";
import { AuthContext } from "@/context/AuthContext";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();
  const ctx = useContext(AuthContext);
  if (!ctx) return null;
  const { setUser } = ctx;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await loginUser({ username, password });

    if (res.token) {
      localStorage.setItem("token", res.token);
      document.cookie = `token=${res.token}; path=/; secure; samesite=strict`;

      let payload;
      try {
        payload = JSON.parse(atob(res.token.split(".")[1]));
      } catch {
        setMsg("Login token yaroqsiz");
        return;
      }

      setUser({
        id: payload.id,
        username: payload.username,
        role: payload.role,
      });

      router.push("/");
    } else {
      setMsg(res.msg);
    }
  };

  return (
    <div className="page">
      <div className="login-box">
        <h1 className="logo">Better Call Odil</h1>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Telefon, username yoki email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Parol"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">Kirish</button>
        </form>

        {msg && <p>{msg}</p>}
      </div>
    </div>
  );
}
