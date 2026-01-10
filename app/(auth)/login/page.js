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

  // ---------------- STATE'LAR ----------------
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState("");

  const [userFocused, setUserFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  // ---------------- EFFECT ----------------
  useEffect(() => {
    const inti = document.querySelector(".logo-inti");
    if (inti) {
      inti.style.color = "#111111";
    }
  }, []);

  // ---------------- SUBMIT (YANGI) ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      const res = await loginUser({ username, password });

      if (res.msg === "Login muvaffaqiyatli") {
        const me = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
          {
            credentials: "include",
          }
        );

        if (!me.ok) {
          setMsg("User maʼlumotini olishda xatolik");
          return;
        }

        const user = await me.json();
        setUser(user);
        router.push("/");
      } else {
        setMsg(res.msg || "Login xatosi");
      }
    } catch (err) {
      console.error(err);
      setMsg("Server bilan bog‘lanib bo‘lmadi");
    }
  };

  // ---------------- UI ----------------
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
              {/* USERNAME */}
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setUserFocused(true)}
                onBlur={() => setUserFocused(false)}
                placeholder={userFocused ? "" : "username kiriting"}
                required
              />

              {/* PASSWORD */}
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                  placeholder={passFocused ? "" : "Parol"}
                  required
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
