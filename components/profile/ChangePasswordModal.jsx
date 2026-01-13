"use client";

import { useState } from "react";

export default function ChangePasswordModal({ open, onClose }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!current || !next || !confirm)
      return setError("Barcha maydonlarni to‘ldiring");

    if (next.length < 6)
      return setError("Yangi parol kamida 6 belgidan iborat bo‘lishi kerak");

    if (next !== confirm)
      return setError("Yangi parollar mos emas");

    try {
      setLoading(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/change-password`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPassword: current,
            newPassword: next,
          }),
        }
      );

      const data = await res.json();

      // ✅ TO‘G‘RI YECHIM (sen bergan kod)
      if (!res.ok) {
        setError(data.msg || "Xatolik yuz berdi");
        return;
      }

      // 🔐 Session tozalangan — majburiy chiqish
      setCurrent("");
      setNext("");
      setConfirm("");

      onClose();

      // cookie o‘chganini kutib keyin redirect
      setTimeout(() => {
        window.location.replace("/login");
      }, 300);

    } catch {
      setError("Server bilan bog‘lanib bo‘lmadi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={title}>Change password</h3>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Current password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            style={input}
          />

          <input
            type="password"
            placeholder="New password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            style={input}
          />

          <input
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            style={input}
          />

          {error && <div style={errorText}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{ ...saveBtn, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </form>

        <button style={cancelBtn} onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 3000,
};

const modal = {
  width: 340,
  backgroundColor: "#111",
  borderRadius: 12,
  padding: 20,
  color: "#fff",
};

const title = {
  marginBottom: 16,
  fontSize: 18,
  fontWeight: "bold",
  textAlign: "center",
};

const input = {
  width: "100%",
  padding: "10px 12px",
  marginBottom: 10,
  background: "#0b0b0b",
  border: "1px solid #222",
  borderRadius: 8,
  color: "#fff",
  fontSize: 14,
};

const errorText = {
  color: "#ef4444",
  fontSize: 13,
  marginBottom: 10,
  textAlign: "center",
};

const saveBtn = {
  width: "100%",
  padding: "12px",
  background: "#1da1f2",
  border: "none",
  borderRadius: 8,
  color: "#071022",
  fontWeight: "bold",
  cursor: "pointer",
  marginTop: 4,
};

const cancelBtn = {
  width: "100%",
  padding: "12px",
  background: "transparent",
  border: "none",
  borderTop: "1px solid #222",
  color: "#fff",
  marginTop: 12,
  cursor: "pointer",
};
