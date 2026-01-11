"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/lib/api";
import { AuthContext } from "@/context/AuthContext";
import "./login.css";

export default function LoginPage(){
  const router = useRouter();
  const ctx = useContext(AuthContext);
  if (!ctx) return null;
  const { setUser } = ctx;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState("");

  const [userFocused, setUserFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  // --- NEW: loading state for "Kirilmoqda..." animation ---
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const inti = document.querySelector(".logo-inti");
    if (inti) inti.style.color = "#111111";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setIsLoading(true); // start loading state

    try {
      const res = await loginUser({ username, password });

      if (res.msg !== "Login muvaffaqiyatli") {
        setMsg(res.msg || "Login xatosi");
        setIsLoading(false); // stop loading on error
        return;
      }

      // cookie yozilganini tekshiramiz
      const me = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        credentials: "include"
      });

      if (!me.ok) {
        setMsg("Sessiya yaratilmagan. Sahifani yangilang.");
        setIsLoading(false); // stop loading on error
        return;
      }

      setUser(await me.json());
      router.push("/"); // navigation — no need to setIsLoading(false) since page will change
    } catch (err) {
      console.error(err);
      setMsg("Tarmoq xatosi yoki server javobi yo'q.");
      setIsLoading(false);
    }
  }

  // inline styles for disabled state so we don't touch external CSS files
  const disabledStyle = isLoading ? { opacity: 0.7, cursor: "not-allowed" } : {};
  const toggleBtnDisabledStyle = {
    background: "none",
    border: "none",
    cursor: isLoading ? "not-allowed" : "pointer",
    fontSize: "14px",
    color: "#555",
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
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setUserFocused(true)}
                onBlur={() => setUserFocused(false)}
                placeholder={userFocused ? "" : "username kiriting"}
                required
                disabled={isLoading}
                style={disabledStyle}
              />

              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                  placeholder={passFocused ? "" : "Parol"}
                  required
                  disabled={isLoading}
                  style={disabledStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={toggleBtnDisabledStyle}
                  disabled={isLoading}
                  aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
                >
                  {showPassword ? "🙂" : "☺️"}
                </button>
              </div>

              <button
                className="login-btn"
                type="submit"
                disabled={isLoading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  ...disabledStyle
                }}
                aria-busy={isLoading ? "true" : "false"}
              >
                {isLoading ? (
                  <>
                    {/* SVG spinner using animateTransform so no external CSS keyframes required */}
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 50 50"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <circle cx="25" cy="25" r="20" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeDasharray="31.4 31.4" />
                      <g transform="translate(25,25)">
                        <animateTransform
                          attributeName="transform"
                          type="rotate"
                          from="0"
                          to="360"
                          dur="1s"
                          repeatCount="indefinite"
                        />
                      </g>
                    </svg>

                    <span>Kirilmoqda...</span>
                  </>
                ) : (
                  "Kirish"
                )}
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
