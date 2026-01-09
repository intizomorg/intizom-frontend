"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/lib/api";
import { AuthContext } from "@/context/AuthContext";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();
  const ctx = useContext(AuthContext);
  const setUser = ctx?.setUser; // defensive: ctx bo'lmasa undefined bo'ladi

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const inti = document.querySelector(".logo-inti");
    if (inti) {
      inti.style.color = "#111111";
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    let res;
    try {
      // Pass credentials: 'include' so server can set HttpOnly cookie via Set-Cookie
      res = await loginUser({ username, password }, { credentials: "include" });
    } catch (err) {
      console.error("Login error:", err);
      setMsg("Tarmoq xatosi. Iltimos keyinroq urinib ko‘ring.");
      return;
    }

    if (res && res.token) {
      // store token client-side for fast client reads (not a replacement for HttpOnly cookie)
      try {
        localStorage.setItem("token", res.token);
      } catch (e) {
        // ignore localStorage failures (e.g., private mode)
      }

      // optional: non-HttpOnly cookie (server should ideally set HttpOnly cookie)
      try {
        document.cookie = `token=${res.token}; path=/; max-age=604800; secure; samesite=lax`;
      } catch (e) {
        // ignore cookie set errors in restrictive environments
      }

      let payload;
      try {
        payload = JSON.parse(atob(res.token.split(".")[1]));
      } catch {
        setMsg("Login token yaroqsiz");
        return;
      }

      // Defensive: only call setUser if available
      setUser?.({
        id: payload.id,
        username: payload.username,
        role: payload.role,
      });

      router.push("/");
    } else {
      setMsg(res?.msg || "Login xatosi");
    }
  };

  return (
    <div className="page">
      <div className="container">
        <div className="left">
          <div className="phone-frame">
            <img
              src="https://images.unsplash.com/photo-1581091870675-e1bb327b32b8?auto=format&fit=crop&w=700&q=80"
              className="phone-bg"
              alt="motivatsiya"
            />
            <img
              src="https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=700&q=80"
              className="screen"
              alt="intizom"
            />
          </div>
        </div>

        <div className="right">
          <div className="login-box">
            <div className="logo">
              <span className="logo-inti">inti</span>
              <span className="logo-zom">ZOM</span>
            </div>

            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Telefon, username yoki email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />

              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Parol"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    color: "#555",
                  }}
                >
                  {showPassword ? "🙂" : "☺️"}
                </button>
              </div>

              <button className="login-btn" type="submit">
                Kirish
              </button>
            </form>

            {msg && <p className="error-msg">{msg}</p>}

            <div className="divider">
              <span></span>
              <p>YOKI</p>
              <span></span>
            </div>

            <p className="forgot" onClick={() => router.push("/register")}>
              Parolni unutdingizmi?
            </p>
          </div>

          <div className="signup-box">
            <p className="signup-text">Akkauntingiz yo‘qmi?</p>
            <p className="signup" onClick={() => router.push("/register")}>
              Ro‘yxatdan o‘tish
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
