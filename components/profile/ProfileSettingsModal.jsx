"use client";

import { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/context/AuthContext";
import ChangePasswordModal from "@/components/profile/ChangePasswordModal";

export default function ProfileSettingsModal({ open, onClose }) {
  const { logout } = useContext(AuthContext);
  const [changeOpen, setChangeOpen] = useState(false);

  // 🔴 ENG MUHIM QISM:
  // Settings yopilsa → ChangePassword ham yopiladi
  useEffect(() => {
    if (!open) {
      setChangeOpen(false);
    }
  }, [open]);

  if (!open) return null;

  const handleLogout = () => {
    logout(); // token o‘chadi
    onClose();
  };

  return (
    <>
      {/* SETTINGS MODAL */}
      <div style={overlay} onClick={onClose}>
        <div style={modal} onClick={(e) => e.stopPropagation()}>
          <h3 style={title}>Settings</h3>

          {/* CHANGE PASSWORD */}
          <div style={section}>
            <button
              style={normalBtn}
              onClick={() => setChangeOpen(true)}
            >
              Change password
            </button>
          </div>

          {/* LOG OUT */}
          <div style={section}>
            <button
              style={dangerBtn}
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>

          {/* CANCEL */}
          <button
            style={cancelBtn}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* CHANGE PASSWORD MODAL */}
      <ChangePasswordModal
        open={changeOpen}
        onClose={() => setChangeOpen(false)}
      />
    </>
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
  zIndex: 2000,
};

const modal = {
  width: 320,
  backgroundColor: "#111",
  borderRadius: 12,
  padding: 20,
  textAlign: "center",
  color: "#fff",
};

const title = {
  marginBottom: 20,
  fontSize: 18,
  fontWeight: "bold",
};

const section = {
  marginBottom: 16,
};

const normalBtn = {
  width: "100%",
  padding: "12px",
  background: "transparent",
  border: "none",
  color: "#fff",
  fontSize: 16,
  cursor: "pointer",
};

const dangerBtn = {
  width: "100%",
  padding: "12px",
  background: "transparent",
  border: "none",
  color: "#ed4956",
  fontSize: 16,
  fontWeight: "bold",
  cursor: "pointer",
};

const cancelBtn = {
  width: "100%",
  padding: "12px",
  background: "transparent",
  borderTop: "1px solid #222",
  color: "#aaa",
  fontSize: 16,
  cursor: "pointer",
};
