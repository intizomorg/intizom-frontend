"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";

/**
 * ReelItem — final, production-ready
 * - Uses "100svh" / "100vw" for consistent fullscreen on mobile/desktop
 * - Autoplay for the active visible reel (threshold 0.6)
 * - Optimistic like toggle with rollback
 * - Comments loaded when sheet opens; sheet slides from bottom (85svh)
 * - Guards when API or token missing
 * - Prefer post.user / post.userId for follow endpoints
 */

export default function ReelItem({ post }) {
  if (
    !post ||
    post.type !== "video" ||
    !Array.isArray(post.media) ||
    !post.media?.[0]?.url
  ) {
    return null;
  }

  // API base (must be set in environment)
  const API = typeof process !== "undefined" && process?.env?.NEXT_PUBLIC_API_URL
    ? String(process.env.NEXT_PUBLIC_API_URL).replace(/\/$/, "")
    : "";

  const videoUrl = post.media[0].url;
  const rawUser = post.user;
  const usernameStr =
    (typeof rawUser === "string" && rawUser) ||
    rawUser?.username ||
    rawUser?.name ||
    (rawUser?.id ? String(rawUser.id) : null) ||
    "user";
  const profilePath = encodeURIComponent(String(usernameStr));

  const followTarget = post.userId ?? post.user;

  // refs
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const commentsScrollRef = useRef(null);
  const lastTapRef = useRef(0);
  const pointerSingleTimerRef = useRef(null);

  // state
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [reelsMuted, setReelsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [overlayHeart, setOverlayHeart] = useState(false);

  const [liked, setLiked] = useState(Boolean(post.liked));
  const [likesCount, setLikesCount] = useState(Number(post.likesCount ?? post.likes ?? 0));
  const [views, setViews] = useState(Number(post.viewsCount ?? post.views ?? 0));

  // global defaults (do not overwrite on each mount)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.__REELS_MUTED__ === undefined) window.__REELS_MUTED__ = false;
    if (window.__ACTIVE_REEL_VIDEO__ === undefined) window.__ACTIVE_REEL_VIDEO__ = null;
    setReelsMuted(Boolean(window.__REELS_MUTED__));
  }, []);

  // iOS/Android overscroll mitigation (safe attempt)
  useEffect(() => {
    try {
      if (typeof document !== "undefined" && document.body) {
        const prev = document.body.style.overscrollBehavior;
        document.body.style.overscrollBehavior = "contain";
        return () => {
          document.body.style.overscrollBehavior = prev || "";
        };
      }
    } catch {}
  }, []);

  // fetch follow state if API + token exist
  useEffect(() => {
    if (!followTarget || !API || typeof window === "undefined") return;
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
        if (!mounted || !res.ok) return;
        const data = await res.json().catch(() => ({}));
        if (typeof data?.isFollowing === "boolean") setIsFollowing(Boolean(data.isFollowing));
        else if (typeof data?.following === "boolean") setIsFollowing(Boolean(data.following));
        else if (typeof data?.is_following === "boolean") setIsFollowing(Boolean(data.is_following));
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, [followTarget, API]);

  // comments: load when open
  useEffect(() => {
    if (!commentsOpen) return;
    if (!API) {
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
        const list = Array.isArray(payload.comments) ? payload.comments : [];
        if (mounted) {
          setComments(list);
          // scroll to bottom on next tick
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

  // Seen tracking & intersection observer autoplay
  const SEEN_KEY = "seen_reels_v1";
  const getSeenSet = useCallback(() => {
    try {
      const raw = (typeof window !== "undefined" && sessionStorage.getItem(SEEN_KEY)) || null;
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  }, []);

  const markSeen = useCallback((id) => {
    try {
      const set = getSeenSet();
      set.add(id);
      sessionStorage.setItem(SEEN_KEY, JSON.stringify([...set]));
    } catch {}
  }, [getSeenSet]);

  useEffect(() => {
    const v = videoRef.current;
    const container = containerRef.current;
    if (!v || !container) return;

    // root is strictly the .reels-feed container
    const rootElement = typeof document !== "undefined" ? document.querySelector(".reels-feed") : null;

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e) return;

        const ratio = e.intersectionRatio ?? 0;

        // If the panel is less than 60% visible — pause it and bail out.
        if (ratio < 0.6) {
          try { v.pause(); } catch {}
          setIsPlaying(false);
          if (window.__ACTIVE_REEL_VIDEO__ === v) window.__ACTIVE_REEL_VIDEO__ = null;
          return;
        }

        // Only when >= 0.6 do we activate this reel.
        if (window.__ACTIVE_REEL_VIDEO__ && window.__ACTIVE_REEL_VIDEO__ !== v) {
          try {
            window.__ACTIVE_REEL_VIDEO__.pause();
            window.__ACTIVE_REEL_VIDEO__.muted = true;
          } catch {}
        }

        window.__ACTIVE_REEL_VIDEO__ = v;
        v.muted = Boolean(window.__REELS_MUTED__ === true);
        v.play().then(() => setIsPlaying(true)).catch(() => { /* autoplay blocked */ });

        // mark seen...
      },
      { root: rootElement, threshold: [0.6] }  /* use array to ensure intersectionRatio is reported reliably */
    );

    io.observe(container);
    return () => io.disconnect();
  }, [post.id, API, getSeenSet, markSeen]);

  // cleanup timers & pause video on unmount
  useEffect(() => {
    return () => {
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

  // Like toggle (single optimistic flow with rollback)
  const toggleLike = useCallback(
    async (e) => {
      if (e && e.stopPropagation) e.stopPropagation();
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        alert("Iltimos, tizimga kiring.");
        return;
      }

      const prev = liked;
      setLiked(!prev);
      setLikesCount((c) => (prev ? Math.max(0, c - 1) : c + 1));

      if (!API) {
        // rollback if no API
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
        setLiked(prev);
        setLikesCount((c) => (prev ? c + 1 : Math.max(0, c - 1)));
      }
    },
    [API, liked, post.id]
  );

  // submit comment (server single source)
  const submitReelComment = useCallback(async () => {
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
        // re-fetch comments as single source of truth
        try {
          const fresh = await fetch(`${API}/posts/${encodeURIComponent(post.id)}/comments`);
          if (fresh.ok) {
            const payload = await fresh.json().catch(() => ({}));
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
            if (data?.comment) {
              setComments((p) => [...p, data.comment]);
              setCommentText("");
            } else {
              alert(data.msg || "Komment yuborilmadi");
            }
          }
        } catch {
          if (data?.comment) {
            setComments((p) => [...p, data.comment]);
            setCommentText("");
          } else {
            alert(data.msg || "Komment yuborilmadi");
          }
        }
      } else {
        alert(data.msg || "Komment yuborilmadi");
      }
    } catch {
      alert("Serverga ulanishda xatolik");
    } finally {
      setCommentSubmitting(false);
    }
  }, [API, commentText, post.id]);

  // pointer up: single tap = play/pause, double tap = like
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
    if (e && e.stopPropagation) e.stopPropagation();
    try {
      const newVal = !(window.__REELS_MUTED__ === true);
      window.__REELS_MUTED__ = newVal;
      setReelsMuted(!!newVal);
      if (videoRef.current) videoRef.current.muted = !!newVal;
    } catch {}
  };

  // follow/unfollow
  const toggleFollow = useCallback(async (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
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
      // rollback
      setIsFollowing(prev);
      setFollowLoading(false);
      return;
    }

    try {
      const idStr = encodeURIComponent(String(followTarget));
      const endpoint = prev ? `${API}/unfollow/${idStr}` : `${API}/follow/${idStr}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) setIsFollowing(prev);
    } catch {
      setIsFollowing(prev);
    } finally {
      setFollowLoading(false);
    }
  }, [API, followTarget, isFollowing]);

  return (
    <div
      ref={containerRef}
      className="reel-item"
      onPointerUp={handlePointerUp}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="article"
      aria-label={`Reel by ${usernameStr || "user"}: ${post.title || ""}`}
    >
      <style>{`
        @keyframes swipeAnim {
          0% { transform: translateY(0); opacity: 0.85; }
          50% { transform: translateY(-6px); opacity: 1; }
          100% { transform: translateY(0); opacity: 0.85; }
        }
      `}</style>

      <div className="reel-video-wrap">
        <video
          ref={videoRef}
          src={videoUrl}
          className="reel-video"
          playsInline
          loop
          muted={reelsMuted}
        />
      </div>

      {/* mute/unmute */}
      <button
        onClick={toggleGlobalMute}
        aria-label={reelsMuted ? "Unmute reels" : "Mute reels"}
        style={{
          position: "absolute",
          top: 14,
          right: 14,
          zIndex: 50,
          background: "rgba(0,0,0,0.5)",
          border: "none",
          borderRadius: 20,
          padding: "8px 10px",
          color: "#fff",
          cursor: "pointer",
          fontSize: 14,
        }}
      >
        {reelsMuted ? "Unmute" : "Mute"}
      </button>

      {/* overlay heart */}
      {overlayHeart && (
        <div aria-hidden style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 30 }}>
          <svg width="96" height="96" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21s-7.5-4.873-10.5-8.25C-0.5 8.75 4 4 7.5 6.5 9 7.75 10 9.5 12 11c2-1.5 3-3.25 4.5-4.5C20 4 24.5 8.75 22.5 12.75 19.5 16.127 12 21 12 21z" fill="#ef4444" />
          </svg>
        </div>
      )}

      {/* right-side actions */}
      <div style={{ position: "absolute", right: 12, bottom: "18%", display: "flex", flexDirection: "column", gap: 18, zIndex: 20, alignItems: "center" }} aria-hidden>
        <button
          onClick={(e) => { e.stopPropagation(); toggleLike(e); }}
          aria-pressed={liked}
          aria-label={liked ? "Unlike" : "Like"}
          style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(0,0,0,0.45)", border: "none", color: liked ? "#ef4444" : "#fff", fontSize: 20, cursor: "pointer" }}
        >
          {liked ? "❤️" : "🤍"}
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); setCommentsOpen(true); }}
          aria-label="Comments"
          style={{ width: 52, height: 52, borderRadius: 12, background: "rgba(0,0,0,0.45)", border: "none", color: "#fff", fontSize: 18, cursor: "pointer" }}
        >
          💬
        </button>

        <div style={{ color: "#fff", fontSize: 12, textAlign: "center", userSelect: "none", lineHeight: 1.1 }}>
          <div style={{ fontWeight: 700 }}>{likesCount}</div>
          <div style={{ opacity: 0.8, fontSize: 11 }}>{views} views</div>
        </div>
      </div>

      {/* left-bottom info */}
      <div style={{ position: "absolute", left: 12, bottom: 20, color: "#fff", zIndex: 40, maxWidth: "72%" }} aria-hidden>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href={`/profile/${profilePath}`} onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 8, color: "#fff", textDecoration: "none", fontWeight: 600 }}>
            <div aria-hidden style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: "#333", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", color: "#fff" }}>
              {(typeof usernameStr === "string" && usernameStr[0]) ? usernameStr[0].toUpperCase() : "U"}
            </div>

            <div style={{ fontWeight: 700 }}>@{usernameStr || "user"}</div>
          </Link>

          {followTarget && (
            !isFollowing ? (
              <button onClick={toggleFollow} aria-label="Follow" disabled={followLoading} style={{ marginLeft: 8, background: "#1da1f2", border: "none", borderRadius: 8, padding: "6px 10px", color: "#fff", fontSize: 13, cursor: "pointer" }}>
                {followLoading ? "..." : "Follow"}
              </button>
            ) : (
              <button onClick={toggleFollow} aria-label="Unfollow" disabled={followLoading} style={{ marginLeft: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 10px", color: "#fff", fontSize: 13, cursor: "pointer" }}>
                {followLoading ? "..." : "Following"}
              </button>
            )
          )}
        </div>

        {post.title && (
          <div style={{ fontSize: 14, lineHeight: "1.15", opacity: 0.95, marginTop: 8 }}>
            {post.title}
          </div>
        )}
      </div>

      <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", opacity: 0.8, fontSize: 12, zIndex: 30, display: "flex", alignItems: "center", gap: 6, animation: "swipeAnim 1.6s ease-in-out infinite", color: "#fff", userSelect: "none" }} aria-hidden>
        <span style={{ fontSize: 14 }}>↑</span>
        <span>swipe</span>
      </div>

      {/* Comments sheet (bottom-up) */}
      {commentsOpen && (
        <div
          onClick={() => setCommentsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 100,
            display: "flex",
            alignItems: "flex-end", // sheet from bottom
            justifyContent: "center",
            padding: 0,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 720,
              height: "85svh",
              background: "#111",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 16,
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch",
              overflow: "hidden",
            }}
          >
            <div style={{ width: 40, height: 4, background: "#444", margin: "0 auto 8px", borderRadius: 4 }} />

            <div ref={commentsScrollRef} style={{ flex: 1, overflowY: "auto", color: "#fff", paddingRight: 8 }}>
              {commentsLoading ? (
                <div style={{ textAlign: "center", color: "#777" }}>Yuklanmoqda...</div>
              ) : comments.length === 0 ? (
                <div style={{ textAlign: "center", color: "#777" }}>Hozircha komment yo'q</div>
              ) : (
                comments.map((c) => {
                  const key = c.id || `${typeof c.user === "string" ? c.user : (c.user?.username || c.user?.name || String(c.user))}-${c.createdAt || Math.random()}`;
                  return (
                    <div key={key} style={{ marginBottom: 12 }}>
                      <strong style={{ color: "#fff" }}>
                        {typeof c.user === "string" ? c.user : (c.user?.username || c.user?.name || String(c.user) || "user")}
                      </strong>
                      <div style={{ color: "#ddd", marginTop: 4 }}>{c.text}</div>
                      <div style={{ color: "#777", fontSize: 12, marginTop: 6 }}>
                        {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Komment yozing..."
                style={{ flex: 1, background: "#222", border: "1px solid #333", borderRadius: 8, padding: 10, color: "#fff" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!commentSubmitting) submitReelComment();
                  }
                }}
              />
              <button onClick={submitReelComment} disabled={commentSubmitting} style={{ background: "#1da1f2", border: "none", borderRadius: 8, padding: "10px 14px", color: "#fff", fontWeight: 700 }}>
                {commentSubmitting ? "..." : "Yuborish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
