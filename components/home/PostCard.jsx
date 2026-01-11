"use client";

import React, { useContext, useState, useRef, useEffect, memo } from "react";
import Link from "next/link";
import { Heart, MessageCircle, MoreHorizontal } from "lucide-react";
import { AuthContext } from "@/context/AuthContext";

/**
 * PostCard — hardened and defensive version (with comments loading + optimistic append)
 * Modified: comments panel now opens as a right-side sliding drawer (overlay) instead of bottom inline area.
 */

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(typeof window !== "undefined" && window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
}

function inferTypeFromUrl(url = "") {
  try {
    const u = String(url).split("?")[0];
    if (u.match(/\.(mp4|webm|mov|mkv)$/i)) return "video";
    return "image";
  } catch {
    return "image";
  }
}

function safeText(val, fallback = "") {
  if (val === undefined || val === null) return fallback;
  return String(val);
}

function PostCard({ post, onDeleted }) {
  const isMobile = useIsMobile();
  const { user } = useContext(AuthContext);
  const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

  // Normalize post id and username
  const postId = post?.id ?? post?._id ?? "";
  const postUsername = post?.username ?? (typeof post?.user === "string" ? post.user : post?.user?.username ?? "");

  // Normalize media array (accept strings or objects)
  const normalizedMedia = Array.isArray(post?.media)
    ? post.media
        .map((m) => {
          if (!m) return null;
          if (typeof m === "string") return { url: m, type: inferTypeFromUrl(m) };
          return { url: m.url ?? m.path ?? "", type: m.type ?? inferTypeFromUrl(m.url ?? m.path ?? "") };
        })
        .filter(Boolean)
    : [];

  // Likes state
  const [liked, setLiked] = useState(Boolean(post?.liked ?? post?.isLiked ?? false));
  const [likesCount, setLikesCount] = useState(Number(post?.likesCount ?? post?.likes ?? 0));

  // Comments count (backend should provide commentsCount)
  const [commentsCount, setCommentsCount] = useState(Number(post?.commentsCount ?? post?.comments ?? 0));
  const [commentText, setCommentText] = useState("");

  // NEW: comments list + loading state
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const [loading, setLoading] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

  // Follow state
  const [isFollowing, setIsFollowing] = useState(Boolean(post?.isFollowing ?? post?.is_following ?? false));
  const [followLoading, setFollowLoading] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);

  const [showUnfollowModal, setShowUnfollowModal] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef(null);

  // Tap/double-tap handling
  const lastTapRef = useRef(0);
  const resetTapTimeoutRef = useRef(null);
  const [showHeart, setShowHeart] = useState(false);

  // Like request id to avoid race reverts
  const likeReqIdRef = useRef(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [postId, normalizedMedia.length]);

  useEffect(() => {
    setIsFollowing(Boolean(post?.isFollowing ?? post?.is_following ?? isFollowing));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, post?.isFollowing, post?.is_following]);

  useEffect(() => {
    function handleDocClick(e) {
      if (menuOpen) {
        const target = e.target;
        if (
          menuRef.current &&
          !menuRef.current.contains(target) &&
          menuButtonRef.current &&
          !menuButtonRef.current.contains(target)
        ) {
          setMenuOpen(false);
        }
      }
    }
    function handleKey(e) {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setShowUnfollowModal(false);
      }
    }
    document.addEventListener("mousedown", handleDocClick);
    document.addEventListener("touchstart", handleDocClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleDocClick);
      document.removeEventListener("touchstart", handleDocClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;

    try {
      v.muted = true;
    } catch {}

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          try {
            v.play().catch(() => {
              try {
                v.muted = true;
                v.play().catch(() => {});
              } catch {}
            });
          } catch {
            try {
              v.muted = true;
              v.play().catch(() => {});
            } catch {}
          }
        } else {
          try {
            v.pause();
          } catch {}
        }
      },
      { threshold: 0.6 }
    );

    observer.observe(v);
    const observed = v;
    return () => {
      try {
        observer.unobserve(observed);
      } catch {
        try {
          observer.disconnect();
        } catch {}
      }
    };
  }, [postId]);

  useEffect(() => {
    return () => {
      if (resetTapTimeoutRef.current) {
        clearTimeout(resetTapTimeoutRef.current);
        resetTapTimeoutRef.current = null;
      }
      try {
        const v = videoRef.current;
        if (v && !v.paused) v.pause();
      } catch {}
    };
  }, []);

  // NEW: load comments when commentsOpen becomes true
  useEffect(() => {
    if (!commentsOpen) return;
    if (!postId) return;

    let cancelled = false;

    const loadComments = async () => {
      setLoadingComments(true);
      try {
        const res = await fetch(`${API}/posts/${encodeURIComponent(postId)}/comments`, {
          credentials: "include",
        });

        const data = await res.json().catch(() => null);
        if (cancelled) return;

        if (res.ok && Array.isArray(data?.comments)) {
          setComments(data.comments);
        } else {
          setComments([]);
        }
      } catch {
        if (!cancelled) setComments([]);
      } finally {
        if (!cancelled) setLoadingComments(false);
      }
    };

    loadComments();

    return () => {
      cancelled = true;
    };
  }, [commentsOpen, postId, API]);

  // Prevent body scroll while comments drawer is open and close on Escape
  useEffect(() => {
    if (commentsOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const onKey = (e) => {
        if (e.key === "Escape") setCommentsOpen(false);
      };
      document.addEventListener("keydown", onKey);
      return () => {
        document.body.style.overflow = prev || "";
        document.removeEventListener("keydown", onKey);
      };
    }
    return undefined;
  }, [commentsOpen]);

  // --- LIKE logic (optimistic + request-id guard) ---
  const toggleLike = async () => {
    if (!user) {
      alert("Iltimos tizimga kiring");
      return;
    }

    const prevLiked = liked;
    const prevCount = likesCount;
    const nextLiked = !prevLiked;

    likeReqIdRef.current += 1;
    const reqId = likeReqIdRef.current;

    setLiked(nextLiked);
    setLikesCount((c) => (nextLiked ? c + 1 : Math.max(0, c - 1)));

    try {
      const url = nextLiked
        ? `${API}/posts/${encodeURIComponent(postId)}/like`
        : `${API}/posts/${encodeURIComponent(postId)}/unlike`;
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
      });

      if (reqId !== likeReqIdRef.current) return;

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setLiked(prevLiked);
        setLikesCount(prevCount);
      } else if (data?.likesCount !== undefined) {
        // update likesCount from server-provided value to avoid drift across tabs
        setLikesCount(Number(data.likesCount));
      }
    } catch {
      if (reqId === likeReqIdRef.current) {
        setLiked(prevLiked);
        setLikesCount(prevCount);
      }
    }
  };

  const triggerHeart = () => {
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 300);
    toggleLike().catch(() => {});
  };

  const DOUBLE_TAP_DELAY = 300;
  const handleTap = (e) => {
    const now = Date.now();
    const last = lastTapRef.current;

    if (now - last > 0 && now - last <= DOUBLE_TAP_DELAY) {
      lastTapRef.current = 0;
      if (resetTapTimeoutRef.current) {
        clearTimeout(resetTapTimeoutRef.current);
        resetTapTimeoutRef.current = null;
      }
      try {
        e.preventDefault();
        e.stopPropagation();
      } catch {}
      triggerHeart();
      return;
    }

    lastTapRef.current = now;
    if (resetTapTimeoutRef.current) {
      clearTimeout(resetTapTimeoutRef.current);
    }
    resetTapTimeoutRef.current = setTimeout(() => {
      lastTapRef.current = 0;
      resetTapTimeoutRef.current = null;
    }, DOUBLE_TAP_DELAY + 50);
  };

  const handleFollow = async () => {
    if (!user || !postUsername) return;
    setFollowLoading(true);
    setIsFollowing(true);

    try {
      const res = await fetch(`${API}/follow/${encodeURIComponent(postUsername)}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        setIsFollowing(false);
      }
    } catch {
      setIsFollowing(false);
    } finally {
      setFollowLoading(false);
      setMenuOpen(false);
    }
  };

  const openUnfollowModal = () => {
    setMenuOpen(false);
    setTimeout(() => setShowUnfollowModal(true), 50);
  };

  const handleUnfollow = async () => {
    if (!user || !postUsername) {
      setShowUnfollowModal(false);
      return;
    }
    try {
      const res = await fetch(`${API}/unfollow/${encodeURIComponent(postUsername)}`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setIsFollowing(false);
      }
    } catch {
      // ignore
    } finally {
      setShowUnfollowModal(false);
    }
  };

  // Submit comment — backend increments/persists; frontend increases counter optimistically AND appends to comments list
  const submitComment = async (e) => {
    e.preventDefault();
    const text = (commentText || "").trim();
    if (!text) return;
    if (!user) {
      alert("Iltimos tizimga kiring");
      return;
    }
    try {
      const res = await fetch(`${API}/posts/${encodeURIComponent(postId)}/comment`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        // optimistic append: use returned comment if present, otherwise construct one
        const returned = data?.comment ?? data;
        const newComment = {
          id: returned?.id ?? returned?._id ?? Date.now(),
          user: returned?.user?.username ?? user?.username ?? returned?.user ?? "You",
          text: returned?.text ?? text,
          createdAt: returned?.createdAt ?? returned?.created_at ?? new Date().toISOString(),
        };
        setComments((prev) => [...prev, newComment]);
        setCommentsCount((c) => c + 1);
        setCommentText("");
      } else {
        alert(data.msg || "Komment yuborilmadi");
      }
    } catch {
      alert("Tarmoq xatosi — komment yuborilmadi");
    }
  };

  const handleAdminDelete = async () => {
    if (!confirm("Postni o‘chirmoqchimisiz?")) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/posts/${encodeURIComponent(postId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        if (onDeleted) onDeleted(postId);
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.msg || "O'chirishda xatolik");
      }
    } catch {
      alert("Serverga ulanishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const timeAgo = (date) => {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "just now";
    const seconds = Math.floor((Date.now() - d) / 1000);
    const intervals = [
      { label: "year", seconds: 31536000 },
      { label: "month", seconds: 2592000 },
      { label: "day", seconds: 86400 },
      { label: "hour", seconds: 3600 },
      { label: "minute", seconds: 60 },
    ];
    for (const i of intervals) {
      const count = Math.floor(seconds / i.seconds);
      if (count >= 1) return `${count} ${i.label}${count > 1 ? "s" : ""} ago`;
    }
    return "just now";
  };

  const media = normalizedMedia[currentIndex];
  const hasCarousel = normalizedMedia.length > 1;

  const prevImage = (e) => {
    try {
      e?.stopPropagation();
      e?.preventDefault();
    } catch {}
    setCurrentIndex((i) => Math.max(0, i - 1));
  };

  const nextImage = (e) => {
    try {
      e?.stopPropagation();
      e?.preventDefault();
    } catch {}
    setCurrentIndex((i) => Math.min(i + 1, Math.max(0, normalizedMedia.length - 1)));
  };

  const avatarLetter = (postUsername || "").trim()[0]?.toUpperCase() || "U";

  // ------------------------
  // Overlay & drawer styles
  // ------------------------

  // 1️⃣ overlayStyle — replaced per your instruction
  const overlayStyle = {
    position: "fixed",
    inset: 0,
    zIndex: 90,
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    justifyContent: isMobile ? "flex-end" : "flex-end",
    alignItems: isMobile ? "stretch" : "stretch",
    pointerEvents: commentsOpen ? "auto" : "none",
    background: commentsOpen ? "rgba(0,0,0,0.55)" : "transparent",
    transition: "background 220ms ease",
  };

  // 2️⃣ backdropStyle removed entirely (per your instruction)

  // 3️⃣ drawerStyle — replaced per your instruction
  const drawerStyle = {
    width: isMobile ? "100%" : "92%",
    maxWidth: isMobile ? "100%" : 420,
    height: "100vh",
    background: "#0b0b0b",
    borderLeft: isMobile ? "none" : "1px solid rgba(255,255,255,0.03)",
    boxShadow: isMobile
      ? "0 -12px 28px rgba(0,0,0,0.75)"
      : "-8px 0 24px rgba(0,0,0,0.6)",
    display: "flex",
    flexDirection: "column",
    zIndex: 91,

    transform: commentsOpen
      ? "translate(0,0)"
      : isMobile
        ? "translateY(100%)"
        : "translateX(100%)",

    transition: "transform 300ms cubic-bezier(.22,.61,.36,1)",
  };

  // ------------------------

  return (
    <article className="post-card" onContextMenu={(e) => e.preventDefault()}>
      <header
        className="post-header"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        <div className="post-user" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            className="avatar"
            aria-hidden
            style={{
              width: 36,
              height: 36,
              borderRadius: 9999,
              background: "#ddd",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
            }}
          >
            {avatarLetter}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href={postUsername ? `/profile/${encodeURIComponent(postUsername)}` : "#"} className="username hover:underline font-semibold">
              {postUsername || "Unknown"}
            </Link>

            {user && user.username !== postUsername && !isFollowing && (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className="text-sm font-semibold"
                aria-label={`Follow ${postUsername}`}
                title={`Follow ${postUsername}`}
                style={{ color: "#8F00FF", marginLeft: 6 }}
              >
                {followLoading ? "..." : "Follow"}
              </button>
            )}

            {user && user.username !== postUsername && isFollowing && (
              <button disabled className="text-sm font-semibold" style={{ marginLeft: 6, color: "#9ca3af" }}>
                Following
              </button>
            )}

            <div className="text-xs text-gray-400" style={{ marginLeft: 8 }}>
              {timeAgo(post?.createdAt ?? post?.created_at ?? Date.now())}
            </div>
          </div>
        </div>

        {user && user.username !== postUsername && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              ref={menuButtonRef}
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="true"
              aria-expanded={menuOpen}
              className="icon-button"
              style={{ background: "transparent", border: "none", padding: 6 }}
            >
              <MoreHorizontal size={20} />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 mt-2 w-44 bg-black border border-[#1f2933] rounded-lg z-50"
                style={{ overflow: "hidden", minWidth: 140 }}
                role="menu"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (isFollowing) {
                      openUnfollowModal();
                    } else {
                      handleFollow();
                    }
                  }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-[#111]"
                  style={{ color: isFollowing ? "#ef4444" : "#8F00FF" }}
                  role="menuitem"
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-[#111]"
                  role="menuitem"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {user?.role === "admin" && (
          <button onClick={handleAdminDelete} disabled={loading} className="text-red-500 text-sm" aria-label="Delete post">
            {loading ? "Deleting..." : "Delete"}
          </button>
        )}
      </header>

      {/* MEDIA */}
      <div className={`post-media relative ${showHeart ? "heart-animated" : ""}`}>
        {hasCarousel ? (
          <div className="relative w-full" style={{ userSelect: "none" }}>
            <img
              src={normalizedMedia[currentIndex].url}
              alt=""
              className="w-full max-h-[520px] object-cover select-none"
              draggable={false}
              onPointerDown={handleTap}
              style={{ pointerEvents: "auto" }}
            />

            <button
              type="button"
              onClick={(e) => {
                try {
                  e.stopPropagation();
                  e.preventDefault();
                } catch {}
                prevImage(e);
              }}
              aria-label="Previous image"
              aria-disabled={currentIndex === 0}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 9999,
                width: 36,
                height: 36,
                borderRadius: 18,
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                cursor: currentIndex === 0 ? "default" : "pointer",
                opacity: currentIndex === 0 ? 0.32 : 1,
                pointerEvents: "auto",
              }}
            >
              ‹
            </button>

            <button
              type="button"
              onClick={(e) => {
                try {
                  e.stopPropagation();
                  e.preventDefault();
                } catch {}
                nextImage(e);
              }}
              aria-label="Next image"
              aria-disabled={currentIndex === normalizedMedia.length - 1}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 9999,
                width: 36,
                height: 36,
                borderRadius: 18,
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                cursor: currentIndex === normalizedMedia.length - 1 ? "default" : "pointer",
                opacity: currentIndex === normalizedMedia.length - 1 ? 0.32 : 1,
                pointerEvents: "auto",
              }}
            >
              ›
            </button>

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-20">
              {normalizedMedia.map((_, i) => (
                <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === currentIndex ? "bg-white" : "bg-white/40"}`} />
              ))}
            </div>
          </div>
        ) : media?.type === "video" ? (
          <video
            ref={videoRef}
            src={media.url}
            controls
            playsInline
            muted
            preload="metadata"
            className="w-full max-h-[600px]"
            onPointerDown={handleTap}
          />
        ) : media?.type === "image" ? (
          <img src={media.url} alt="post" className="w-full" onPointerDown={handleTap} />
        ) : null}

        <div className="heart-overlay" aria-hidden>
          <Heart size={72} className="overlay-heart" strokeWidth={1.2} />
        </div>
      </div>

      {/* ACTIONS */}
      <div
        className="post-actions"
        onContextMenu={(e) => e.preventDefault()}
        style={{ display: "flex", alignItems: "center", gap: 12, padding: 12 }}
      >
        <button
          onClick={() => toggleLike()}
          aria-label={liked ? "Unlike" : "Like"}
          className="icon-button"
          style={{ background: "transparent", border: "none", padding: 6 }}
        >
          <Heart size={22} className={`heart-icon ${liked ? "liked" : ""}`} strokeWidth={1.6} />
        </button>

        <button
          onClick={() => setCommentsOpen((v) => !v)}
          aria-label="Open comments"
          className="icon-button"
          style={{ background: "transparent", border: "none", padding: 6 }}
        >
          <MessageCircle size={22} />
        </button>

        <span className="text-sm text-gray-400" style={{ userSelect: "none", WebkitUserSelect: "none" }} aria-live="polite">
          {likesCount} likes
        </span>
      </div>

      {/* CONTENT */}
      <div className="post-content" style={{ padding: "0 12px 12px" }}>
        <strong>{postUsername || "Unknown"}</strong> {safeText(post?.title)}
        <p className="desc">{safeText(post?.description)}</p>
      </div>

      <div className="px-3 pb-3">
        {commentsCount > 0 && (
          <button onClick={() => setCommentsOpen(true)} className="text-sm text-gray-400" style={{ background: "transparent", border: "none", padding: 0 }}>
            View all {commentsCount} comments
          </button>
        )}
      </div>

      {/* ===== Updated: Right-side / bottom comments drawer (overlay) - ALWAYS MOUNTED for smooth animations ===== */}
      <div
        className="comments-overlay"
        role="dialog"
        aria-modal="true"
        style={overlayStyle}
        onClick={() => commentsOpen && setCommentsOpen(false)}
      >
        <aside
          className="comments-drawer"
          onClick={(e) => e.stopPropagation()}
          style={drawerStyle}
        >
          <div style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontWeight: 700 }}>{postUsername || "Комментарии"}</div>
            <button
              onClick={() => setCommentsOpen(false)}
              aria-label="Close comments"
              style={{ background: "transparent", border: "none", color: "#ddd", fontSize: 18, padding: 6 }}
            >
              ✕
            </button>
          </div>

          {/* Comments content area */}
          <div style={{ overflowY: "auto", padding: 12, flex: 1 }}>
            {/* loading indicator */}
            {loadingComments && (
              <div className="text-xs text-gray-400 mt-2" aria-live="polite">
                Yuklanmoqda...
              </div>
            )}

            {/* comments list */}
            <div>
              {comments.length === 0 && !loadingComments && (
                <div className="text-sm text-gray-400">Hozircha komment yo‘q.</div>
              )}

              {comments.map((c) => (
                <div key={c.id ?? `${c.user}-${c.createdAt}`} className="text-sm mt-3" style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <div style={{ minWidth: 36, textAlign: "center", color: "#ddd", fontWeight: 600 }}>
                    {String((c.user || "U").trim()[0] || "U").toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <strong style={{ marginRight: 6 }}>{c.user}</strong>
                      <span className="text-xs text-gray-400">{timeAgo(c.createdAt)}</span>
                    </div>
                    <div style={{ marginTop: 4 }}>{c.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comment composer (fixed to drawer bottom) */}
          <div style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,0.03)", background: "transparent" }}>
            <form onSubmit={submitComment} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Komment yozing..."
                className="w-full p-2 rounded"
                style={{
                  background: "#0b0b0b",
                  border: "1px solid rgba(255,255,255,0.04)",
                  color: "#fff",
                  outline: "none",
                }}
                aria-label="Komment"
              />
              <button type="submit" className="px-3 py-2 rounded font-semibold" style={{ background: "#8F00FF", color: "#fff" }}>
                Yuborish
              </button>
            </form>
          </div>
        </aside>
      </div>

      {showUnfollowModal && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60"
          onClick={() => setShowUnfollowModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md rounded-t-2xl bg-black border-t border-[#1f2933]"
            onClick={(e) => e.stopPropagation()}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "12px", textAlign: "center", color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{postUsername}</div>
              <div style={{ color: "#9ca3af", fontSize: 13 }}>Unfollow this account?</div>
            </div>

            <button
              onClick={handleUnfollow}
              className="w-full py-4 text-red-500 font-semibold"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", background: "transparent" }}
            >
              Unfollow
            </button>

            <button
              onClick={() => setShowUnfollowModal(false)}
              className="w-full py-4 text-center text-white"
              style={{ background: "transparent" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

export default memo(PostCard);
