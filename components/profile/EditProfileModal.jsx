"use client";
import { useState, useRef, useEffect } from "react";

// Use NEXT_PUBLIC_API_URL from environment (must be set in your .env)
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

  const token = localStorage.getItem("token");
  const BIO_MAX = 160;

  // create / revoke preview URL for selected avatar file
  useEffect(() => {
    if (!avatarFile) return;
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [avatarFile]);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    // optional: basic size/type check (UI-only)
    if (!f.type.startsWith("image/")) {
      alert("Iltimos, rasm faylini tanlang");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      // 5MB limit for UX (doesn't change upload logic)
      if (!confirm("Fayl juda katta (5MB dan katta). Davom etilsinmi?")) return;
    }
    setAvatarFile(f);
  };

  const removeAvatarSelection = () => {
    setAvatarFile(null);
    setAvatarPreview(profile.avatar || null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSave = async () => {
    if (!token) return;

    try {
      setSaving(true);

      let avatar = profile.avatar;

      // 1️⃣ AVATAR UPLOAD (uses NEXT_PUBLIC_API_URL)
      if (avatarFile) {
        const fd = new FormData();
        fd.append("avatar", avatarFile);

        const r = await fetch(`${API}/upload/avatar`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });

        if (!r.ok) throw new Error("Avatar upload failed");

        const d = await r.json();
        avatar = d.avatar;
      }

      // 2️⃣ BIO + WEBSITE → BACKEND (uses NEXT_PUBLIC_API_URL)
      const res = await fetch(`${API}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
  bio: bio ?? "",
  website: (website || "").trim(),
}),

      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.msg || "Profile update failed");
      }

      // 3️⃣ OTA-ONA PROFILNI QAYTA O‘QISIN
      await onSaved({ avatar });

      onClose();
    } catch (e) {
      alert(e.message || "Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Edit profile"
      onClick={onClose}
      style={styles.overlay}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={styles.modal}
      >
        {/* Header */}
        <div style={styles.header}>
          <h3 style={styles.title}>Edit profile</h3>
          <button
            aria-label="Close"
            onClick={onClose}
            style={styles.closeBtn}
            title="Close"
          >
            ×
          </button>
        </div>

        <div style={styles.content}>
          {/* LEFT: Avatar preview & controls */}
          <div style={styles.left}>
            <div style={styles.avatarWrapper}>
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="avatar preview"
                  style={styles.avatarImg}
                />
              ) : (
                <div style={styles.avatarPlaceholder}>
                  {profile.username?.[0]?.toUpperCase() || "U"}
                </div>
              )}
            </div>

            <div style={{ marginTop: 12, width: "100%" }}>
              <label style={styles.fileLabel}>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current && fileRef.current.click()}
                  style={{ ...styles.button, width: "100%", marginBottom: 8 }}
                >
                  Upload avatar
                </button>
              </label>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={removeAvatarSelection}
                  style={{ ...styles.ghostBtn, flex: 1 }}
                >
                  Reset
                </button>
                <div style={{ flex: 2, textAlign: "right", color: "#999", fontSize: 12 }}>
                  {avatarFile ? avatarFile.name : profile.avatar ? "Current avatar" : "No avatar"}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Inputs */}
          <div style={styles.right}>
            <div style={{ marginBottom: 12 }}>
              <label style={styles.label}>Bio</label>
              <textarea
                maxLength={BIO_MAX}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell the world about yourself"
                style={styles.textarea}
                rows={4}
                aria-label="Bio"
              />
              <div style={styles.charCounter}>
                {bio.length}/{BIO_MAX}
              </div>
            </div>

            <div style={{ marginBottom: 6 }}>
              <label style={styles.label}>Website</label>
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://your-site.com"
                style={styles.input}
                aria-label="Website"
              />
              <div style={styles.hint}>Include https:// for external links</div>
            </div>

            {/* Actions */}
            <div style={styles.actions}>
              <button
                onClick={onClose}
                style={{ ...styles.ghostBtn, minWidth: 110 }}
                aria-label="Cancel"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  ...styles.primaryBtn,
                  minWidth: 110,
                  opacity: saving ? 0.85 : 1,
                  cursor: saving ? "wait" : "pointer",
                }}
                aria-label="Save"
              >
                {saving ? (
                  <span style={styles.spinner} aria-hidden />
                ) : null}
                <span style={{ marginLeft: saving ? 8 : 0 }}>
                  {saving ? "Saving..." : "Save"}
                </span>
              </button>
            </div>
          </div>
        </div>
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
