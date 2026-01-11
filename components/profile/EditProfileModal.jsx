"use client";
import { useState, useRef, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function EditProfileModal({ profile, onClose, onSaved }) {
  const [bio, setBio] = useState(profile.bio || "");
  const [website, setWebsite] = useState(profile.website || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar || null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    setBio(profile.bio || "");
    setWebsite(profile.website || "");
    setAvatarPreview(profile.avatar || null);
  }, [profile]);

  useEffect(() => {
    if (!avatarFile) return;
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) return alert("Faqat rasm tanlang");
    setAvatarFile(f);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      let avatar = profile.avatar;

      if (avatarFile) {
        const fd = new FormData();
        fd.append("avatar", avatarFile);

        const r = await fetch(`${API}/upload/avatar`, {
          method: "POST",
          credentials: "include",
          body: fd
        });

        if (!r.ok) throw new Error("Avatar yuklashda xatolik");
        const d = await r.json();
        avatar = d.avatar;
      }

      const res = await fetch(`${API}/profile`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: bio || "",
          website: website || ""
        })
      });

      if (!res.ok) throw new Error("Profilni saqlashda xatolik");

      await onSaved({ avatar });
      onClose();
    } catch (e) {
      alert(e.message || "Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={styles.modal}>
        <h3>Edit profile</h3>

        <input type="file" ref={fileRef} hidden accept="image/*"
          onChange={handleFileChange} />

        <button onClick={() => fileRef.current.click()}>
          Upload avatar
        </button>

        <textarea value={bio} onChange={e => setBio(e.target.value)} />
        <input value={website} onChange={e => setWebsite(e.target.value)} />

        <button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}


/* --------------------------
   STYLES (inline objects)
   -------------------------- */
const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: 20,
  },
  modal: {
    width: 760,
    maxWidth: "100%",
    backgroundColor: "#0f0f10",
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.03)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: 0.2,
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "#bbb",
    fontSize: 26,
    lineHeight: "18px",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: 6,
  },
  content: {
    display: "flex",
    gap: 20,
    alignItems: "flex-start",
  },
  left: {
    width: 220,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  avatarWrapper: {
    width: 160,
    height: 160,
    borderRadius: "50%",
    overflow: "hidden",
    background:
      "linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "50%",
    display: "block",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    backgroundColor: "#111",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 56,
    fontWeight: 700,
    color: "#fff",
  },
  fileLabel: {
    display: "block",
    width: "100%",
  },
  right: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  label: {
    display: "block",
    color: "#ccc",
    fontSize: 13,
    marginBottom: 8,
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    backgroundColor: "#0b0b0b",
    border: "1px solid #222",
    borderRadius: 8,
    color: "#fff",
    outline: "none",
    fontSize: 14,
  },
  textarea: {
    width: "100%",
    padding: "10px 12px",
    backgroundColor: "#0b0b0b",
    border: "1px solid #222",
    borderRadius: 8,
    color: "#fff",
    outline: "none",
    resize: "vertical",
    fontSize: 14,
  },
  hint: {
    marginTop: 6,
    color: "#8a8a8a",
    fontSize: 12,
  },
  charCounter: {
    marginTop: 6,
    textAlign: "right",
    color: "#8a8a8a",
    fontSize: 12,
  },
  actions: {
    marginTop: 16,
    display: "flex",
    gap: 10,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#1da1f2",
    border: "none",
    color: "#fff",
    padding: "10px 12px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  },
  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1da1f2",
    border: "none",
    color: "#071022",
    padding: "10px 14px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
  },
  ghostBtn: {
    backgroundColor: "transparent",
    border: "1px solid #2a2a2a",
    color: "#ddd",
    padding: "10px 12px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
  },
  spinner: {
    width: 16,
    height: 16,
    borderRadius: "50%",
    border: "2px solid rgba(0,0,0,0.15)",
    borderTopColor: "#fff",
    animation: "spin 1s linear infinite",
    display: "inline-block",
  },

  // add keyframes via injected style tag if necessary
};

/* Minimal keyframes injection (so spinner works without external CSS) */
;(function injectKeyframes() {
  if (typeof document === "undefined") return;
  const id = "epm-keyframes";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.innerHTML = `
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    /* hover / focus effects */
    button:hover { filter: brightness(1.02); }
    input:focus, textarea:focus { box-shadow: 0 0 0 3px rgba(29,161,242,0.06); border-color: rgba(29,161,242,0.18); outline: none; }
  `;
  document.head.appendChild(style);
})();
