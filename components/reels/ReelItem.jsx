"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";

/**
 * ReelItem — final, production-ready (inline styles removed)
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

    // try to find the nearest scroll container for reliable intersection detection
    const rootElement =
      (container && container.closest && container.closest(".reels-feed")) ||
      document.querySelector(".reels-feed") ||
      null;

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
        className="reel-toggle-mute"
      >
        {reelsMuted ? "Unmute" : "Mute"}
      </button>

      {/* overlay heart */}
      {overlayHeart && (
        <div aria-hidden className="reel-overlay-heart">
          <svg width="96" height="96" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21s-7.5-4.873-10.5-8.25C-0.5 8.75 4 4 7.5 6.5 9 7.75 10 9.5 12 11c2-1.5 3-3.25 4.5-4.5C20 4 24.5 8.75 22.5 12.75 19.5 16.127 12 21 12 21z" fill="#ef4444" />
          </svg>
        </div>
      )}

      {/* right-side actions */}
      <div className="reel-actions" aria-hidden>
        <button
          onClick={(e) => { e.stopPropagation(); toggleLike(e); }}
          aria-pressed={liked}
          aria-label={liked ? "Unlike" : "Like"}
          className={`reel-action-btn reel-like-btn ${liked ? "liked" : ""}`}
        >
          {liked ? "❤️" : "🤍"}
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); setCommentsOpen(true); }}
          aria-label="Comments"
          className="reel-action-btn reel-comment-btn"
        >
          💬
        </button>

        <div className="reel-stats" aria-hidden>
          <div className="reel-stats-likes">{likesCount}</div>
          <div className="reel-stats-views">{views} views</div>
        </div>
      </div>

      {/* left-bottom info */}
      <div className="reel-info" aria-hidden>
        <div className="reel-info-row">
          <Link href={`/profile/${profilePath}`} onClick={(e) => e.stopPropagation()} className="reel-profile-link">
            <div aria-hidden className="reel-avatar">
              {(typeof usernameStr === "string" && usernameStr[0]) ? usernameStr[0].toUpperCase() : "U"}
            </div>

            <div className="reel-username">@{usernameStr || "user"}</div>
          </Link>

          {followTarget && (
            !isFollowing ? (
              <button onClick={toggleFollow} aria-label="Follow" disabled={followLoading} className="reel-follow-btn">
                {followLoading ? "..." : "Follow"}
              </button>
            ) : (
              <button onClick={toggleFollow} aria-label="Unfollow" disabled={followLoading} className="reel-follow-btn following">
                {followLoading ? "..." : "Following"}
              </button>
            )
          )}
        </div>

        {post.title && (
          <div className="reel-caption">
            {post.title}
          </div>
        )}
      </div>

      <div className="reel-swipe-hint" aria-hidden>
        <span className="reel-swipe-arrow">↑</span>
        <span>swipe</span>
      </div>

      {/* Comments sheet (bottom-up) */}
      {commentsOpen && (
        <div
          onClick={() => setCommentsOpen(false)}
          className="comments-overlay"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="comments-sheet"
          >
            <div className="comments-handle" />

            <div ref={commentsScrollRef} className="comments-scroll">
              {commentsLoading ? (
                <div className="comments-empty">Yuklanmoqda...</div>
              ) : comments.length === 0 ? (
                <div className="comments-empty">Hozircha komment yo'q</div>
              ) : (
                comments.map((c) => {
                  const key = c.id || `${typeof c.user === "string" ? c.user : (c.user?.username || c.user?.name || String(c.user))}-${c.createdAt || Math.random()}`;
                  return (
                    <div key={key} className="comment-item">
                      <strong className="comment-author">
                        {typeof c.user === "string" ? c.user : (c.user?.username || c.user?.name || String(c.user) || "user")}
                      </strong>
                      <div className="comment-text">{c.text}</div>
                      <div className="comment-meta">
                        {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="comments-form">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Komment yozing..."
                className="comment-input"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!commentSubmitting) submitReelComment();
                  }
                }}
              />
              <button onClick={submitReelComment} disabled={commentSubmitting} className="comment-submit-btn">
                {commentSubmitting ? "..." : "Yuborish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
