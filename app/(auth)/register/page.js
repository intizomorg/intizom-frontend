"use client";
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
