"use client";

export default function AvatarViewerModal({ src, onClose }) {
  if (!src) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 3000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "90vw",
          maxHeight: "90vh",
        }}
      >
        <img
  src={src}
  alt="avatar"
  style={{
    maxWidth: 360,
    maxHeight: 360,
    width: "100%",
    height: "auto",
    objectFit: "contain",
    borderRadius: 12,
  }}
/>

      </div>

      {/* CLOSE */}
      <button
        onClick={onClose}
        style={{
          position: "fixed",
          top: 20,
          right: 24,
          fontSize: 28,
          color: "#fff",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
}
