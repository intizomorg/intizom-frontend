"use client";

import Link from "next/link";
import { useRef, useEffect, useState } from "react";

/**
 * ReelItem (fixed + layout adjustments)
 * - API constant from NEXT_PUBLIC_API_URL (no trailing slash)
 * - Like state uses post.liked
 * - Single optimistic toggleLike with proper rollback
 * - Comments use backend format { comments: [...] }
 * - Follow endpoints use post.userId || post.user
 * - Various guards when API or token missing
 * - Layout tweaks per request (wrapper, action buttons, full-screen comments)
 * - UX: overscrollBehavior fix
 */

export default function ReelItem({ post }) {
  if (
    !post ||
    post.type !== "video" ||
    !Array.isArray(post.media) ||
    !post.media[0]?.url
  ) {
    return null;
  }

  // --- API (client-side) ---
  const API = (typeof process !== "undefined" && process?.env?.NEXT_PUBLIC_API_URL)
    ? String(process.env.NEXT_PUBLIC_API_URL).replace(/\/$/, "")
    : "";

  const videoUrl = post.media?.[0]?.url;

  // --- USERNAME / profile path ---
  const rawUser = post.user;
  const usernameStr =
    (typeof rawUser === "string" && rawUser) ||
    rawUser?.username ||
    rawUser?.name ||
    (rawUser?.id ? String(rawUser.id) : null) ||
    "user";

  const profilePath = encodeURIComponent(String(usernameStr));

  // follow target (use post.userId if available, otherwise post.user)
  const followTarget = post.userId ?? post.user;

  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const commentsScrollRef = useRef(null);

  const doubleTapTimerRef = useRef(null);
  const lastTapRef = useRef(0);
  const pointerSingleTimerRef = useRef(null);

  // COMMENTS panel state
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // FOLLOW state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // mute / play state
  const [reelsMuted, setReelsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [overlayHeart, setOverlayHeart] = useState(false);

  // likes/views optimistic state
  // <-- CHANGE: use only post.liked (not post.isLiked || post.liked)
  const [liked, setLiked] = useState(Boolean(post.liked));
  const [likesCount, setLikesCount] = useState(Number(post.likesCount ?? post.likes ?? 0));
  const [views, setViews] = useState(Number(post.viewsCount ?? post.views ?? 0));

  // --- GLOBAL FLAGS: do NOT overwrite existing global flags on every mount ---
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.__REELS_MUTED__ === undefined) {
      window.__REELS_MUTED__ = false; // default ovoz yoqilgan bo‘lsin
    }

    if (window.__ACTIVE_REEL_VIDEO__ === undefined) {
      window.__ACTIVE_REEL_VIDEO__ = null;
    }

    setReelsMuted(Boolean(window.__REELS_MUTED__));
  }, []);

  // --- UX bonus: overscroll glitch fix (iOS/Android) ---
  useEffect(() => {
    try {
      if (typeof document !== "undefined" && document?.body) {
        const prev = document.body.style.overscrollBehavior;
        document.body.style.overscrollBehavior = "contain";
        return () => {
          document.body.style.overscrollBehavior = prev || "";
        };
      }
    } catch {
      // ignore
    }
  }, []);

  // fetch follow state if token exists (guard when API missing)
  useEffect(() => {
    if (!followTarget || typeof window === "undefined" || !API) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    let mounted = true;
    (async () => {
      try {
        const idStr = encodeURIComponent(String(followTarget));
        const res = await fetch(`${API}/follow/check/${idStr}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!mounted) return;
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data?.isFollowing === "boolean") {
          setIsFollowing(Boolean(data.isFollowing));
        } else if (typeof data?.following === "boolean") {
          setIsFollowing(Boolean(data.following));
        } else if (typeof data?.is_following === "boolean") {
          setIsFollowing(Boolean(data.is_following));
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, [followTarget, API]);

  // --- COMMENTS: load when modal opens ---
  useEffect(() => {
    if (!commentsOpen) return;
    if (!API) {
      // no API configured — show empty list
      setComments([]);
      return;
    }

    let mounted = true;
    setCommentsLoading(true);

    (async () => {
      try {
        const res = await fetch(`${API}/posts/${encodeURIComponent(post.id)}/comments`);
        if (!mounted) return;
        if (!res.ok) {
          setComments([]);
          return;
        }
        const payload = await res.json().catch(() => ({}));
        // <-- CHANGE: backend returns { comments: [...] }
        const list = Array.isArray(payload.comments) ? payload.comments : [];
        if (mounted) {
          setComments(list);
          // scroll to bottom after a tick
          setTimeout(() => {
            try {
              if (commentsScrollRef.current) {
                commentsScrollRef.current.scrollTop = commentsScrollRef.current.scrollHeight;
              }
            } catch {}
          }, 50);
        }
      } catch {
        if (mounted) setComments([]);
      } finally {
        if (mounted) setCommentsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [commentsOpen, post.id, API]);

  // ----------------- VIEW / PLAY logic (IntersectionObserver) -----------------
  const SEEN_KEY = "seen_reels";
  function getSeenSet() {
    try {
      const raw = (typeof window !== "undefined" && sessionStorage.getItem(SEEN_KEY)) || null;
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  }
  function markSeen(id) {
    const set = getSeenSet();
    set.add(id);
    try {
      sessionStorage.setItem(SEEN_KEY, JSON.stringify([...set]));
    } catch {}
  }

  useEffect(() => {
    const videoEl = videoRef.current;
    const containerEl = containerRef.current;
    if (!videoEl || !containerEl) return;

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e.isIntersecting) {
          try {
            videoEl.pause();
          } catch {}
          setIsPlaying(false);
          if (window.__ACTIVE_REEL_VIDEO__ === videoEl) {
            window.__ACTIVE_REEL_VIDEO__ = null;
          }
          return;
        }

        // pause old reel
        if (window.__ACTIVE_REEL_VIDEO__ && window.__ACTIVE_REEL_VIDEO__ !== videoEl) {
          try {
            window.__ACTIVE_REEL_VIDEO__.pause();
            window.__ACTIVE_REEL_VIDEO__.muted = true;
          } catch {}
        }

        window.__ACTIVE_REEL_VIDEO__ = videoEl;

        // autoplay only muted
        videoEl.muted = window.__REELS_MUTED__ === true;
        videoEl.play().then(() => setIsPlaying(true)).catch(() => {});

        videoEl
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            // autoplay blocked — ignore
          });

        const seenSet = getSeenSet();
        if (!seenSet.has(post.id)) {
          markSeen(post.id);
          setViews((v) => v + 1);

          // only try to notify server if API is present
          if (API) {
            (async () => {
              try {
                const token = localStorage.getItem("token");
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                await fetch(`${API}/posts/${encodeURIComponent(post.id)}/view`, {
                  method: "POST",
                  headers,
                });
              } catch {}
            })();
          }
        }
      },
      { threshold: 0.7 }
    );

    io.observe(containerEl);
    return () => io.disconnect();
  }, [post.id, API]);

  // cleanup
  useEffect(() => {
    return () => {
      clearTimeout(doubleTapTimerRef.current);
      clearTimeout(pointerSingleTimerRef.current);
      try {
        const v = videoRef.current;
        if (v && !v.paused) v.pause();
      } catch {}
      try {
        if (typeof window !== "undefined" && window.__ACTIVE_REEL_VIDEO__ === videoRef.current) {
          window.__ACTIVE_REEL_VIDEO__ = null;
        }
      } catch {}
    };
  }, []);

  // ----------------- LIKE / UNLIKE (single optimistic toggle + rollback) -----------------
  const toggleLike = async (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      alert("Iltimos, tizimga kiring.");
      return;
    }

    const prev = liked;
    // optimistic
    setLiked(!prev);
    setLikesCount((c) => (prev ? Math.max(0, c - 1) : c + 1));

    if (!API) {
      // cannot reach server: rollback (guarded)
      setLiked(prev);
      setLikesCount((c) => (prev ? c + 1 : Math.max(0, c - 1)));
      return;
    }

    try {
      const endpoint = prev
        ? `${API}/posts/${encodeURIComponent(post.id)}/unlike`
        : `${API}/posts/${encodeURIComponent(post.id)}/like`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        // rollback on failure
        setLiked(prev);
        setLikesCount((c) => (prev ? c + 1 : Math.max(0, c - 1)));
      }
    } catch {
      // network error -> rollback
      setLiked(prev);
      setLikesCount((c) => (prev ? c + 1 : Math.max(0, c - 1)));
    }
  };

  // ----------------- COMMENTS: submit and re-fetch (server single source) -----------------
  const submitReelComment = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      alert("Iltimos, tizimga kiring.");
      return;
    }
    if (!commentText.trim()) return;

    setCommentSubmitting(true);
    try {
      if (!API) throw new Error("API not configured");

      const res = await fetch(`${API}/posts/${encodeURIComponent(post.id)}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: commentText.trim() }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        // After successful post, re-fetch the comments from server (single source of truth)
        try {
          const fresh = await fetch(`${API}/posts/${encodeURIComponent(post.id)}/comments`);
          if (fresh.ok) {
            const payload = await fresh.json().catch(() => ({}));
            // <-- CHANGE: backend returns { comments: [...] }
            const list = Array.isArray(payload.comments) ? payload.comments : [];
            setComments(list);
            setCommentText("");
            setTimeout(() => {
              try {
                if (commentsScrollRef.current) {
                  commentsScrollRef.current.scrollTop = commentsScrollRef.current.scrollHeight;
                }
              } catch {}
            }, 50);
          } else {
            // fallback: if server returned the created comment in initial response, append it
            if (data?.comment) {
              setComments((prev) => [...prev, data.comment]);
              setCommentText("");
            } else {
              alert(data.msg || "Komment yuborilmadi");
            }
          }
        } catch {
          if (data?.comment) {
            setComments((prev) => [...prev, data.comment]);
            setCommentText("");
          } else {
            alert(data.msg || "Komment yuborilmadi");
          }
        }
      } else {
        alert(data.msg || "Komment yuborilmadi");
      }
    } catch (err) {
      alert("Serverga ulanishda xatolik");
    } finally {
      setCommentSubmitting(false);
    }
  };

  // ----------------- POINTER / DOUBLE-TAP / PLAY handlers -----------------
  const handlePointerUp = (e) => {
    const now = Date.now();
    const last = lastTapRef.current;
    const DOUBLE_DELAY = 300;

    if (now - last <= DOUBLE_DELAY) {
      lastTapRef.current = 0;
      clearTimeout(pointerSingleTimerRef.current);

      setOverlayHeart(true);
      setTimeout(() => setOverlayHeart(false), 650);

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        alert("Iltimos, tizimga kiring.");
        return;
      }
      // <-- CHANGE: call unified toggleLike (handles both like/unlike & rollback)
      toggleLike();
      return;
    }

    lastTapRef.current = now;

    pointerSingleTimerRef.current = setTimeout(() => {
      const v = videoRef.current;
      if (!v) return;

      if (v.paused) {
        v.play().catch(() => {});
        setIsPlaying(true);
      } else {
        v.pause();
        setIsPlaying(false);
      }

      lastTapRef.current = 0;
    }, 280);
  };

  const handleKeyDown = (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handlePointerUp();
    }
  };

  const toggleGlobalMute = (e) => {
    e.stopPropagation();
    try {
      const newVal = !(window.__REELS_MUTED__ === true);
      window.__REELS_MUTED__ = newVal;
      setReelsMuted(!!newVal);
      if (videoRef.current) {
        videoRef.current.muted = !!newVal;
      }
    } catch {}
  };

  // ----------------- FOLLOW (fixed: use post.userId || post.user) -----------------
  const toggleFollow = async (e) => {
    e.stopPropagation();
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      alert("Iltimos, tizimga kiring.");
      return;
    }
    if (!followTarget) return;

    setFollowLoading(true);

    const prev = isFollowing;
    setIsFollowing(!prev);

    if (!API) {
      // rollback because we cannot call server
      setIsFollowing(prev);
      setFollowLoading(false);
      return;
    }

    try {
      const idStr = encodeURIComponent(String(followTarget));
      const endpoint = prev
        ? `${API}/unfollow/${idStr}`
        : `${API}/follow/${idStr}`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        // rollback on failure
        setIsFollowing(prev);
      }
    } catch {
      setIsFollowing(prev);
    } finally {
      setFollowLoading(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="reel-item"
      onPointerUp={handlePointerUp}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="article"
      aria-label={`Reel by ${usernameStr || "user"}: ${post.title || ""}`}
      style={{
        position: "relative",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000",
        overflow: "hidden",
        outline: "none",
        width: "100%",
      }}
    >
      <style>{`
        @keyframes swipeAnim {
          0% { transform: translateY(0); opacity: 0.8; }
          50% { transform: translateY(-6px); opacity: 1; }
          100% { transform: translateY(0); opacity: 0.8; }
        }
      `}</style>

      {/* Updated wrapper per request */}
      <div style={{ position: "relative", width: "100%", height: "100%", maxWidth: "100%", overflow: "hidden" }}>
        <video
          ref={videoRef}
          src={videoUrl}
          loop
          muted
          playsInline
          preload="metadata"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", backgroundColor: "#000" }}
          aria-hidden="false"
        />

        <button
          onClick={toggleGlobalMute}
          aria-label={reelsMuted ? "Unmute reels" : "Mute reels"}
          style={{ position: "absolute", top: 16, right: 16, zIndex: 50, background: "rgba(0,0,0,0.5)", border: "none", borderRadius: 20, padding: "8px 12px", color: "#fff", cursor: "pointer", fontSize: 16 }}
        >
          {typeof window !== "undefined" && window.__REELS_MUTED__ ? "🔇" : "🔊"}
        </button>

        {overlayHeart && (
          <div aria-hidden style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 30 }}>
            <svg width="96" height="96" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 21s-7.5-4.873-10.5-8.25C-0.5 8.75 4 4 7.5 6.5
                   9 7.75 10 9.5 12 11c2-1.5 3-3.25 4.5-4.5
                   C20 4 24.5 8.75 22.5 12.75 19.5 16.127 12 21 12 21z" fill="#ef4444" />
            </svg>
          </div>
        )}

        {/* Action buttons moved lower for phones (per request) */}
        <div className="reel-actions" style={{ position: "absolute", right: 12, bottom: 120, display: "flex", flexDirection: "column", gap: 16, zIndex: 20 }} aria-hidden>
          <button
            onClick={(e) => { e.stopPropagation(); toggleLike(e); }}
            aria-pressed={liked}
            aria-label={liked ? "Unlike" : "Like"}
            style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(0,0,0,0.5)", border: "none", color: liked ? "#ef4444" : "#fff", fontSize: 20, cursor: "pointer" }}
          >
            {liked ? "❤️" : "🤍"}
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); setCommentsOpen(true); }}
            aria-label="Comments"
            style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", fontSize: 18, cursor: "pointer" }}
          >
            💬
          </button>

          <div style={{ color: "#fff", fontSize: 12, textAlign: "center", userSelect: "none", lineHeight: 1.1 }}>
            <div>{likesCount}</div>
            <div style={{ opacity: 0.8, fontSize: 11 }}>{views} views</div>
          </div>
        </div>

        <div className="reel-info" style={{ position: "absolute", left: 12, bottom: 16, color: "#fff", zIndex: 40, maxWidth: "75%" }} aria-hidden>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href={`/profile/${profilePath}`} onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 8, color: "#fff", textDecoration: "none", fontWeight: 600 }}>
              <div aria-hidden style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "#333", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "#fff" }}>
                {(typeof usernameStr === "string" && usernameStr[0]) ? usernameStr[0].toUpperCase() : "U"}
              </div>

              <div style={{ fontWeight: 700 }}>@{usernameStr || "user"}</div>
            </Link>

            {!isFollowing ? (
              <button onClick={toggleFollow} aria-label="Follow" disabled={followLoading} style={{ marginLeft: 8, background: "#1da1f2", border: "none", borderRadius: 6, padding: "4px 8px", color: "#fff", fontSize: 12, cursor: "pointer" }}>
                {followLoading ? "..." : "Follow"}
              </button>
            ) : (
              <button onClick={toggleFollow} aria-label="Unfollow" disabled={followLoading} style={{ marginLeft: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "4px 8px", color: "#fff", fontSize: 12, cursor: "pointer" }}>
                {followLoading ? "..." : "Following"}
              </button>
            )}
          </div>

          {post.title && (
            <div style={{ fontSize: 14, lineHeight: "1.15", opacity: 0.95, marginTop: 6 }}>
              {post.title}
            </div>
          )}
        </div>

        <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", opacity: 0.8, fontSize: 12, zIndex: 30, display: "flex", alignItems: "center", gap: 6, animation: "swipeAnim 1.6s ease-in-out infinite", color: "#fff", userSelect: "none" }} aria-hidden>
          <span style={{ fontSize: 14 }}>↑</span>
          <span>swipe</span>
        </div>
      </div>

      {commentsOpen && (
        <div
          onClick={() => setCommentsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 100,
            display: "flex",
            alignItems: "stretch", // updated per request
            justifyContent: "center"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 720,
              height: "100vh", // full-screen per request
              background: "#111",
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              padding: 16,
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch" // ensure inner elements stretch
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 8 }}>
              <div style={{ width: 40, height: 4, background: "#444", margin: "0 auto", borderRadius: 4 }} />
            </div>

            <div ref={commentsScrollRef} style={{ flex: 1, overflowY: "auto", color: "#fff" }}>
              {commentsLoading ? (
                <div style={{ textAlign: "center", color: "#777" }}>Yuklanmoqda...</div>
              ) : comments.length === 0 ? (
                <div style={{ textAlign: "center", color: "#777" }}>Hozircha komment yo\u2018q</div>
              ) : (
                comments.map((c) => (
                  <div key={c.id || `${typeof c.user === "string" ? c.user : (c.user?.username || c.user?.name || String(c.user))}-${c.createdAt || Math.random()}`} style={{ marginBottom: 10 }}>
                    <strong style={{ color: "#fff" }}>
                      {typeof c.user === "string" ? c.user : (c.user?.username || c.user?.name || String(c.user) || "user")}
                    </strong>{" "}
                    <span style={{ color: "#ddd" }}>{c.text}</span>
                    <div style={{ color: "#777", fontSize: 12 }}>
                      {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Komment yozing..."
                style={{ flex: 1, background: "#222", border: "1px solid #333", borderRadius: 6, padding: 8, color: "#fff" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!commentSubmitting) submitReelComment();
                  }
                }}
              />
              <button onClick={submitReelComment} disabled={commentSubmitting} style={{ background: "#1da1f2", border: "none", borderRadius: 6, padding: "8px 14px", color: "#fff", fontWeight: 600 }}>
                {commentSubmitting ? "..." : "Yuborish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
