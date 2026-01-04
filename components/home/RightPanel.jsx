"use client";

import { useState, useEffect } from "react";

export default function RightPanel() {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Pane'lni ekran kichrayganda yashirish (breakpoint: 1024px)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = (e) => setIsVisible(e.matches);

    // initial
    setIsVisible(mq.matches);

    if (mq.addEventListener) {
      mq.addEventListener("change", handler);
    } else {
      // older browsers
      mq.addListener(handler);
    }

    return () => {
      if (mq.removeEventListener) {
        mq.removeEventListener("change", handler);
      } else {
        mq.removeListener(handler);
      }
    };
  }, []);

  // Lock body scroll när modal och ESC-to-close (accessibility + UX)
  useEffect(() => {
    if (!rulesOpen) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape" || e.key === "Esc") {
        setRulesOpen(false);
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev || "";
      document.removeEventListener("keydown", onKey);
    };
  }, [rulesOpen]);

  // Kichik ekranlarda butunlay render qilinmasligi uchun null qaytaramiz
  if (!isVisible) return null;

  return (
    <aside className="right-panel" style={asideStyle}>
      {/* GODZILLA HERO */}
      <div style={godzillaWrap}>
        <video
          src="/godzilla.mp4"
          autoPlay
          muted
          loop
          playsInline
          disablePictureInPicture
          preload="metadata"
          style={videoStyle}
        />
        <div style={videoShadow} />
      </div>

      {/* RULES BUTTON */}
      <div style={controls}>
        <button style={rulesBtn} onClick={() => setRulesOpen(true)}>
          Foydalanish qoidalari
        </button>
      </div>

      {/* RULES MODAL */}
      {rulesOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={overlay}
          onClick={() => setRulesOpen(false)}
        >
          <div
            role="document"
            style={modal}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={modalTitle}>Foydalanish qoidalari</h3>

            <div style={modalBody}>
              <ol style={rulesList}>
                <li>Hurmat bilan muloqot qiling — haqorat va tazyiqdan saqlaning.</li>
                <li>Notoʻgʻri yoki zararli kontent joylamang.</li>
                <li>Shaxsiy ma'lumotlarni himoya qiling — ulashmang.</li>
                <li>Spam va yolgʻon reklamadan saqlaning.</li>
                <li>Platforma qoidalariga rioya qiling — admin qarorlari yakuniy.</li>
              </ol>

              <p style={{ marginTop: 12, color: "#9ca3af", fontSize: 13 }}>
                Bu qoidalar namunaviy va loyihangizga mos ravishda kengaytirilishi mumkin.
              </p>
            </div>

            <div style={modalFooter}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 13, color: "#cfcfcf" }}>
                  Founder: <strong>Unknown</strong>
                </div>
                <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 6 }}>
                  30.12.2025
                </div>
              </div>

              <button style={closeBtn} onClick={() => setRulesOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

/* ===== Inline styles ===== */

const asideStyle = {
  width: 300,
  position: "fixed",
  right: 24,
  top: 90,
  background: "transparent",
  color: "#fff",
  display: "block",
  zIndex: 40,
  padding: "8px",
  boxSizing: "border-box",
};

const godzillaWrap = {
  position: "relative",
  width: "100%",
  borderRadius: 12,
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.04)",
  background: "#000",
  boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
};

const videoStyle = {
  width: "100%",
  height: 180,
  objectFit: "cover",
  display: "block",
  background: "#000",
};

const videoShadow = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  height: 40,
  background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 100%)",
  pointerEvents: "none",
};

const controls = {
  marginTop: 12,
  display: "flex",
  justifyContent: "center",
};

const rulesBtn = {
  width: "100%",
  padding: "10px 12px",
  background: "#111827",
  border: "1px solid rgba(255,255,255,0.04)",
  color: "#fff",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 600,
};

/* Modal */
const overlay = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.65)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 2000,
  padding: 20,
};

const modal = {
  width: 420,
  maxWidth: "100%",
  background: "#0b0b0b",
  color: "#fff",
  borderRadius: 12,
  boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
  border: "1px solid rgba(255,255,255,0.03)",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

const modalTitle = {
  margin: 0,
  padding: "18px 20px 0 20px",
  fontSize: 18,
  fontWeight: 700,
};

const modalBody = {
  padding: "12px 20px",
  maxHeight: "50vh",
  overflowY: "auto",
  color: "#d1d5db",
  fontSize: 14,
  lineHeight: 1.5,
};

const rulesList = {
  paddingLeft: 18,
  margin: 0,
};

const modalFooter = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "12px 16px",
  borderTop: "1px solid rgba(255,255,255,0.03)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.01), rgba(0,0,0,0))",
};

const closeBtn = {
  padding: "8px 12px",
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "#fff",
  borderRadius: 8,
  cursor: "pointer",
};
