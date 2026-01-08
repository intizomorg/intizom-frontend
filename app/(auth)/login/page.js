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
    const res = await loginUser({ username, password });

    if (res.token) {
      localStorage.setItem("token", res.token);
      document.cookie = `token=${res.token}; path=/; max-age=604800; secure; samesite=lax`;

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
}      "use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "@/lib/api";
import "./register.css";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("Yuborilmoqda...");

    try {
      const res = await registerUser({ username, password });

      if (res.user || res.msg === "Ro‘yxatdan o‘tildi") {
        setMsg("Muvaffaqiyatli ro‘yxatdan o‘tildi! Login sahifasiga yo‘naltirilmoqda...");
        setTimeout(() => router.push("/login"), 800);
      } else {
        setMsg(res.msg || "Xatolik");
      }
    } catch (err) {
      setMsg("Server bilan bog‘lanishda xatolik");
    }
  };

  return (
    <div className="reg-page">

      {/* Motivatsion fon rasmi */}
      <img
        className="bg-img"
        src="https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?auto=format&fit=crop&w=1200&q=80"
        alt="motivation"
      />

      {/* Card */}
      <div className="reg-card">

        <h1 className="reg-logo">
          <span className="logo-inti">inti</span>
          <span className="logo-zom">ZOM</span>
        </h1>

        <h2 className="reg-title">Ro‘yxatdan o‘tish</h2>
        <p className="reg-subtitle">Platformaga qo‘shiling va intizom bilan o‘rganishni boshlang</p>

        <form onSubmit={handleSubmit} className="reg-form">

          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="reg-input"
            required
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Parol"
            type="password"
            className="reg-input"
            required
          />

          <button className="reg-btn">Ro‘yxatdan o‘tish</button>
        </form>

        {msg && <p className="reg-msg">{msg}</p>}

        <p className="reg-login-text">
          Allaqachon akkaunt bormi?{" "}
          <span
            className="reg-login-link"
            onClick={() => router.push("/login")}
          >
            Kirish
          </span>
        </p>
      </div>
    </div>
  );
}
