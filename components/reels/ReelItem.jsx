"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";

/**
 * ReelItem — cookie-based auth bilan moslangan to'liq komponent
 * - uses credentials: "include" for all auth requests
 * - auto refresh on 401 via /auth/refresh (one retry)
 * - preserves optimistic like, comments sheet, follow/unfollow, etc.
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

  const API =
    typeof process !== "undefined" && process?.env?.NEXT_PUBLIC_API_URL
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
  const [likesCount, setLikesCount] = useState(
    Number(post.likesCount ?? post.likes ?? 0)
  );
  const [views, setViews] = useState(
    Number(post.viewsCount ?? post.views ?? 0)
  );

  // global defaults
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.__REELS_MUTED__ === undefined) window.__REELS_MUTED__ = false;
    if (window.__ACTIVE_REEL_VIDEO__ === undefined)
      window.__ACTIVE_REEL_VIDEO__ = null;
    setReelsMuted(Boolean(window.__REELS_MUTED__));
  }, []);

  // overscroll mitigation
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

  // ---------- Helper: apiFetch (credentials + refresh on 401) ----------
  const apiFetch = useCallback(
    async (endpoint, options = {}, retry = true) => {
      if (!API) throw new Error("API not configured");
      const url = `${API}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
      const merged = {
        credentials: "include",
        ...options,
        headers: {
          ...(options.headers || {}),
        },
      };

      let res;
      res = await fetch(url, merged);

      if (res.status === 401 && retry) {
        try {
          await fetch(`${API}/auth/refresh`, {
            method: "POST",
            credentials: "include",
          });
          return apiFetch(endpoint, options, false);
        } catch {
          return res;
        }
      }

      return res;
    },
    [API]
  );

  // fetch follow state
  useEffect(() => {
    if (!followTarget || !API || typeof window === "undefined") return;
    let mounted = true;
    (async () => {
      try {
        const idStr = encodeURIComponent(String(followTarget));
        const res = await apiFetch(`/follow/check/${idStr}`, { method: "GET" }, true);
        if (!mounted || !res || !res.ok) return;
        const data = await res.json().catch(() => ({}));
        if (typeof data?.isFollowing === "boolean")
          setIsFollowing(Boolean(data.isFollowing));
        else if (typeof data?.following === "boolean")
          setIsFollowing(Boolean(data.following));
        else if (typeof data?.is_following === "boolean")
          setIsFollowing(Boolean(data.is_following));
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, [followTarget, API, apiFetch]);

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
        const res = await apiFetch(
          `/posts/${encodeURIComponent(post.id)}/comments`,
          { method: "GET" },
          true
        );
        if (!mounted) return;
        if (!res.ok) {
          setComments([]);
          return;
        }
        const payload = await res.json().catch(() => ({}));
        const list = Array.isArray(payload.comments) ? payload.comments : [];
        if (mounted) {
          setComments(list);
          setTimeout(() => {
            try {
              if (commentsScrollRef.current) {
                commentsScrollRef.current.scrollTop =
                  commentsScrollRef.current.scrollHeight;
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
  }, [commentsOpen, post.id, API, apiFetch]);

  // Intersection observer autoplay
  useEffect(() => {
    const v = videoRef.current;
    const container = containerRef.current;
    if (!v || !container) return;

    const rootElement =
      typeof document !== "undefined"
        ? document.querySelector(".reels-feed")
        : null;

    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e) return;
        const ratio = e.intersectionRatio ?? 0;

        if (ratio < 0.6) {
          try {
            v.pause();
          } catch {}
          setIsPlaying(false);
          if (window.__ACTIVE_REEL_VIDEO__ === v)
            window.__ACTIVE_REEL_VIDEO__ = null;
          return;
        }

        if (window.__ACTIVE_REEL_VIDEO__ && window.__ACTIVE_REEL_VIDEO__ !== v) {
          try {
            window.__ACTIVE_REEL_VIDEO__.pause();
            window.__ACTIVE_REEL_VIDEO__.muted = true;
          } catch {}
        }

        window.__ACTIVE_REEL_VIDEO__ = v;
        v.muted = Boolean(window.__REELS_MUTED__ === true);
        v.play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      },
      { root: rootElement, threshold: [0.6] }
    );

    io.observe(container);
    return () => io.disconnect();
  }, [post.id]);

  // cleanup timers & pause video on unmount
  useEffect(() => {
    return () => {
      clearTimeout(pointerSingleTimerRef.current);
      try {
        const v = videoRef.current;
        if (v && !v.paused) v.pause();
      } catch {}
      try {
        if (
          typeof window !== "undefined" &&
          window.__ACTIVE_REEL_VIDEO__ === videoRef.current
        ) {
          window.__ACTIVE_REEL_VIDEO__ = null;
        }
      } catch {}
    };
  }, []);

  // Like toggle (optimistic) using apiFetch
  const toggleLike = useCallback(
    async (e) => {
      if (e && e.stopPropagation) e.stopPropagation();

      if (!API) {
        alert("Server manzili (NEXT_PUBLIC_API_URL) sozlanmagan.");
        return;
      }

      const prev = liked;
      setLiked(!prev);
      setLikesCount((c) => (prev ? Math.max(0, c - 1) : c + 1));

      try {
        const endpoint = prev
          ? `/posts/${encodeURIComponent(post.id)}/unlike`
          : `/posts/${encodeURIComponent(post.id)}/like`;
        const res = await apiFetch(endpoint, { method: "POST" }, true);
        if (!res.ok) {
          setLiked(prev);
          setLikesCount((c) => (prev ? c + 1 : Math.max(0, c - 1)));
          if (res.status === 401) alert("Iltimos, tizimga kiring.");
        }
      } catch {
        setLiked(prev);
        setLikesCount((c) => (prev ? c + 1 : Math.max(0, c - 1)));
        alert("Xatolik yuz berdi — internet yoki server bilan bog'lanmadi.");
      }
    },
    [API, liked, post.id, apiFetch]
  );

  // submit comment
  const submitReelComment = useCallback(async () => {
    if (!commentText.trim()) return;
    if (!API) {
      alert("Server manzili sozlanmagan.");
      return;
    }

    setCommentSubmitting(true);
    try {
      const res = await apiFetch(
        `/posts/${encodeURIComponent(post.id)}/comment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: commentText.trim() }),
        },
        true
      );

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        try {
          const fresh = await apiFetch(
            `/posts/${encodeURIComponent(post.id)}/comments`,
            { method: "GET" },
            true
          );
          if (fresh.ok) {
            const payload = await fresh.json().catch(() => ({}));
            const list = Array.isArray(payload.comments) ? payload.comments : [];
            setComments(list);
            setCommentText("");
            setTimeout(() => {
              try {
                if (commentsScrollRef.current) {
                  commentsScrollRef.current.scrollTop =
                    commentsScrollRef.current.scrollHeight;
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
        if (res.status === 401) alert("Iltimos, tizimga kiring.");
        else alert(data.msg || "Komment yuborilmadi");
      }
    } catch {
      alert("Serverga ulanishda xatolik");
    } finally {
      setCommentSubmitting(false);
    }
  }, [API, commentText, post.id, apiFetch]);

  // pointer up: single tap = play/pause, double tap = like
  const handlePointerUp = () => {
    const now = Date.now();
    const last = lastTapRef.current;
    const DOUBLE_DELAY = 300;

    if (now - last <= DOUBLE_DELAY) {
      lastTapRef.current = 0;
      clearTimeout(pointerSingleTimerRef.current);
      setOverlayHeart(true);
      setTimeout(() => setOverlayHeart(false), 650);
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
  const toggleFollow = useCallback(
    async (e) => {
      if (e && e.stopPropagation) e.stopPropagation();
      if (!followTarget) return;
      if (!API) {
        alert("Server manzili sozlanmagan.");
        return;
      }

      setFollowLoading(true);
      const prev = isFollowing;
      setIsFollowing(!prev);

      try {
        const idStr = encodeURIComponent(String(followTarget));
        const endpoint = prev ? `/unfollow/${idStr}` : `/follow/${idStr}`;
        const res = await apiFetch(endpoint, { method: "POST" }, true);
        if (!res.ok) {
          setIsFollowing(prev);
          if (res.status === 401) alert("Iltimos, tizimga kiring.");
        }
      } catch {
        setIsFollowing(prev);
        alert("Server bilan bog'lanib bo'lmadi.");
      } finally {
        setFollowLoading(false);
      }
    },
    [API, followTarget, isFollowing, apiFetch]
  );

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

      {overlayHeart && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 30,
          }}
        >
          <svg
            width="96"
            height="96"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 21s-7.5-4.873-10.5-8.25C-0.5 8.75 4 4 7.5 6.5 9 7.75 10 9.5 12 11c2-1.5 3-3.25 4.5-4.5C20 4 24.5 8.75 22.5 12.75 19.5 16.127 12 21 12 21z"
              fill="#ef4444"
            />
          </svg>
        </div>
      )}

      {/* RIGHT ACTIONS */}
      <div
        className="reel-actions-right"
        style={{
          position: "absolute",
          right: 12,
          bottom: "18%",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          zIndex: 20,
          alignItems: "center",
        }}
        aria-hidden
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleLike(e);
          }}
          aria-pressed={liked}
          aria-label={liked ? "Unlike" : "Like"}
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: "rgba(0,0,0,0.45)",
            border: "none",
            color: liked ? "#ef4444" : "#fff",
            fontSize: 20,
            cursor: "pointer",
          }}
        >
          {liked ? "❤️" : "🤍"}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setCommentsOpen(true);
          }}
          aria-label="Comments"
          style={{
            width: 52,
            height: 52,
            borderRadius: 12,
            background: "rgba(0,0,0,0.45)",
            border: "none",
            color: "#fff",
            fontSize: 18,
            cursor: "pointer",
          }}
        >
          💬
        </button>

        <div
          style={{
            color: "#fff",
            fontSize: 12,
            textAlign: "center",
            userSelect: "none",
            lineHeight: 1.1,
          }}
        >
          <div style={{ fontWeight: 700 }}>{likesCount}</div>
          <div style={{ opacity: 0.8, fontSize: 11 }}>{views} views</div>
        </div>
      </div>

      {/* CREATOR / META (IMPORTANT: className reel-ui-bottom) */}
      <div
        className="reel-ui-bottom"
        style={{
          position: "absolute",
          left: 12,
          bottom: 20,
          color: "#fff",
          zIndex: 40,
          maxWidth: "72%",
        }}
        aria-hidden
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link
            href={`/profile/${profilePath}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#fff",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            <div
              aria-hidden
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: "#333",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                color: "#fff",
              }}
            >
              {typeof usernameStr === "string" && usernameStr[0]
                ? usernameStr[0].toUpperCase()
                : "U"}
            </div>

            <div style={{ fontWeight: 700 }}>@{usernameStr || "user"}</div>
          </Link>

          {followTarget &&
            (!isFollowing ? (
              <button
                onClick={toggleFollow}
                aria-label="Follow"
                disabled={followLoading}
                style={{
                  marginLeft: 8,
                  background: "#1da1f2",
                  border: "none",
                  borderRadius: 8,
                  padding: "6px 10px",
                  color: "#fff",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {followLoading ? "..." : "Follow"}
              </button>
            ) : (
              <button
                onClick={toggleFollow}
                aria-label="Unfollow"
                disabled={followLoading}
                style={{
                  marginLeft: 8,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  padding: "6px 10px",
                  color: "#fff",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {followLoading ? "..." : "Following"}
              </button>
            ))}
        </div>

        {post.title && (
          <div
            style={{
              fontSize: 14,
              lineHeight: "1.15",
              opacity: 0.95,
              marginTop: 8,
            }}
          >
            {post.title}
          </div>
        )}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 8,
          left: "50%",
          transform: "translateX(-50%)",
          opacity: 0.8,
          fontSize: 12,
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          gap: 6,
          animation: "swipeAnim 1.6s ease-in-out infinite",
          color: "#fff",
          userSelect: "none",
        }}
        aria-hidden
      >
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
            alignItems: "flex-end",
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
            <div
              style={{
                width: 40,
                height: 4,
                background: "#444",
                margin: "0 auto 8px",
                borderRadius: 4,
              }}
            />

            <div
              ref={commentsScrollRef}
              style={{
                flex: 1,
                overflowY: "auto",
                color: "#fff",
                paddingRight: 8,
              }}
            >
              {commentsLoading ? (
                <div style={{ textAlign: "center", color: "#777" }}>
                  Yuklanmoqda...
                </div>
              ) : comments.length === 0 ? (
                <div style={{ textAlign: "center", color: "#777" }}>
                  Hozircha komment yo'q
                </div>
              ) : (
                comments.map((c) => {
                  const key =
                    c.id ||
                    `${typeof c.user === "string"
                      ? c.user
                      : c.user?.username || c.user?.name || String(c.user)
                    }-${c.createdAt || Math.random()}`;
                  return (
                    <div key={key} style={{ marginBottom: 12 }}>
                      <strong style={{ color: "#fff" }}>
                        {typeof c.user === "string"
                          ? c.user
                          : c.user?.username ||
                            c.user?.name ||
                            String(c.user) ||
                            "user"}
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
                style={{
                  flex: 1,
                  background: "#222",
                  border: "1px solid #333",
                  borderRadius: 8,
                  padding: 10,
                  color: "#fff",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!commentSubmitting) submitReelComment();
                  }
                }}
              />
              <button
                onClick={submitReelComment}
                disabled={commentSubmitting}
                style={{
                  background: "#1da1f2",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 14px",
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                {commentSubmitting ? "..." : "Yuborish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
