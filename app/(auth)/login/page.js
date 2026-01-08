"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
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

  useEffect(() => {
    const inti = document.querySelector(".logo-inti");
    if (inti) {
      inti.style.color = "#111111";
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Foydalanuvchi login ma'lumotlarini yuboramiz
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include", // Cookie orqali session olish uchun
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.msg || "Login muvaffaqiyatsiz");
        return;
      }

      // Foydalanuvchi ma'lumotini olish
      const me = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        credentials: "include",
      }).then((r) => r.json());

      setUser(me);
      router.push("/");
    } catch (error) {
      console.error(error);
      setMsg("Xatolik yuz berdi, qayta urinib ko‘ring");
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
