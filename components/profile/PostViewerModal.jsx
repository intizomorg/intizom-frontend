"use client";

import { useEffect, useState, useRef } from "react";
import PostCard from "@/components/home/PostCard";

export default function PostViewerModal({ posts = [], startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const containerRef = useRef(null);

  useEffect(() => {
    setIndex(startIndex);
  }, [startIndex]);

  // ESC bilan yopish
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index]);

  const prev = () => {
    setIndex((i) => Math.max(0, i - 1));
  };

  const next = () => {
    setIndex((i) => Math.min(posts.length - 1, i + 1));
  };

  if (!posts[index]) return null;

  return (
    <div
      ref={containerRef}
      onClick={onClose}
      style={overlay}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={modal}
      >
        {/* CLOSE */}
        <button onClick={onClose} style={closeBtn}>
          ×
        </button>

        {/* NAV */}
        {index > 0 && (
          <button onClick={prev} style={{ ...navBtn, left: -56 }}>
            ‹
          </button>
        )}
        {index < posts.length - 1 && (
          <button onClick={next} style={{ ...navBtn, right: -56 }}>
            ›
          </button>
        )}

        {/* POST */}
        <PostCard post={posts[index]} />
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.85)",
  zIndex: 5000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
};

const modal = {
  position: "relative",
  width: "100%",
  maxWidth: 560,
  maxHeight: "100%",
  overflowY: "auto",
};

const closeBtn = {
  position: "fixed",
  top: 20,
  right: 24,
  background: "none",
  border: "none",
  color: "#fff",
  fontSize: 32,
  cursor: "pointer",
  zIndex: 5100,
};

const navBtn = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  background: "rgba(0,0,0,0.6)",
  border: "none",
  color: "#fff",
  fontSize: 36,
  width: 44,
  height: 44,
  borderRadius: "50%",
  cursor: "pointer",
  zIndex: 5100,
};
