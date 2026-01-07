"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReelItem from "./ReelItem";

/**
 * ReelsFeed — production-ready feed
 * - Expects NEXT_PUBLIC_API_URL to be set (renders friendly message if not)
 * - Uses scroll-snap + 100svh for consistent fullscreen
 * - Robust pagination with refs to avoid races
 * - Sentinel observed with IntersectionObserver using the feed DOM node as root
 */

export default function ReelsFeed() {
  // add page-level body class while this component is mounted
  useEffect(() => {
    document.body.classList.add("page--reels");
    return () => {
      document.body.classList.remove("page--reels");
    };
  }, []);

  // --- API must be explicitly provided ---
  const API =
    typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL
      ? String(process.env.NEXT_PUBLIC_API_URL).replace(/\/$/, "")
      : "";

  if (!API) {
    // Friendly fallback UI instead of throwing (throws crash the client)
    return (
      <div style={{ padding: 24, color: "#f87171", textAlign: "center" }}>
        Konfiguratsiya xatosi: NEXT_PUBLIC_API_URL sozlanmagan.
        Iltimos, muhit o‘zgaruvchilarini tekshiring.
      </div>
    );
  }

  const [reels, setReels] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  // mutable refs to avoid closure races
  const fetchingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const pageRef = useRef(1);

  // sentinel + observer refs
  const loadMoreRef = useRef(null);
  const observerRef = useRef(null);
  const feedRef = useRef(null);

  // keep refs in sync with state
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);
  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  /**
   * fetchReels(pageNum)
   * - prevents concurrent fetches with fetchingRef
   * - normalizes backend shapes (posts | array)
   * - maps _id -> id and filters only valid video posts
   * - stops when backend returns empty page
   */
  const fetchReels = useCallback(
    async (pageNum = 1) => {
      if (fetchingRef.current || !hasMoreRef.current) return;

      fetchingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch(
          `${API}/posts/reels?page=${pageNum}&limit=6`,
          { headers }
        );

        if (!res.ok) {
          throw new Error("HTTP " + res.status);
        }

        const data = await res.json().catch(() => ({}));

        const rawList = Array.isArray(data.posts)
          ? data.posts
          : Array.isArray(data)
          ? data
          : [];

        const onlyVideos = rawList
          .map((p) => ({
            ...p,
            id: String(p._id ?? p.id ?? ""),
            user: p.username ?? p.user,
            liked: Boolean(p.liked),
            likesCount: Number(p.likesCount ?? p.likes ?? 0),
            viewsCount: Number(p.viewsCount ?? p.views ?? 0),
          }))
          .filter(
            (p) => p.id && p.type === "video" && Array.isArray(p.media) && p.media[0]?.url
          );

        // If no items returned -> stop further fetching
        if (onlyVideos.length === 0) {
          setHasMore(false);
          hasMoreRef.current = false;
          if (pageNum === 1) setReels([]);
          return;
        }

        // merge while preserving existing entries (avoid duplicates)
        setReels((prev) => {
          const map = new Map(prev.map((r) => [r.id, r]));
          onlyVideos.forEach((p) => {
            if (map.has(p.id)) {
              const old = map.get(p.id);
              map.set(p.id, { ...old, ...p, comments: old.comments ?? p.comments ?? [] });
            } else {
              map.set(p.id, p);
            }
          });
          return Array.from(map.values());
        });

        // backend provided hint about more pages
        const backendHasMore = Boolean(data.hasMore);
        const newHasMore = backendHasMore && onlyVideos.length > 0;
        setHasMore(newHasMore);
        hasMoreRef.current = newHasMore;

        // advance page
        const next = pageNum + 1;
        setPage(next);
        pageRef.current = next;
      } catch (err) {
        console.error("Reels fetch error:", err);
        setError("Reels yuklanmadi. Internet yoki serverni tekshiring.");
      } finally {
        fetchingRef.current = false;
        setLoading(false);
      }
    },
    [API]
  );

  // Reset pagination & load first page on mount
  useEffect(() => {
    setReels([]);
    setPage(1);
    pageRef.current = 1;
    setHasMore(true);
    hasMoreRef.current = true;
    setError(null);

    // initial load
    fetchReels(1);
    // fetchReels is stable via useCallback (depends only on API)
  }, [fetchReels]);

  // IntersectionObserver: observe sentinel (loadMoreRef) to fetch next page
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;

    // disconnect previous
    observerRef.current?.disconnect();

    // Use the feed DOM node as the intersection root (so sentinel triggers when feed scrolls)
    const rootEl = feedRef.current || null;
    if (!rootEl) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e) return;
        if (!e.isIntersecting) return;
        if (fetchingRef.current) return;
        if (!hasMoreRef.current) return;

        fetchReels(pageRef.current);
      },
      {
        root: rootEl,
        rootMargin: "600px",
        threshold: 0,
      }
    );

    observerRef.current.observe(el);

    return () => observerRef.current?.disconnect();
  }, [fetchReels]);

  // Optional: keyboard navigation for accessibility (ArrowDown / ArrowUp)
  const handleKeyDown = (e) => {
    if (!feedRef.current) return;

    if (e.key === "ArrowDown" || e.key === "PageDown") {
      e.preventDefault();
      feedRef.current.scrollBy({ top: window.innerHeight, behavior: "smooth" });
    } else if (e.key === "ArrowUp" || e.key === "PageUp") {
      e.preventDefault();
      feedRef.current.scrollBy({ top: -window.innerHeight, behavior: "smooth" });
    } else if (e.key === "Home") {
      e.preventDefault();
      feedRef.current.scrollTo({ top: 0, behavior: "smooth" });
    } else if (e.key === "End") {
      e.preventDefault();
      feedRef.current.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
    }
  };

  return (
    <>
      {error ? (
        <div style={{ color: "#f87171", textAlign: "center", marginTop: 40 }}>
          {error}
        </div>
      ) : (
        <div className="reels-viewport">
          <div
            ref={feedRef}
            className="reels-feed"
            onKeyDown={handleKeyDown}
            tabIndex={0}
            aria-label="Reels feed"
          >
            {reels.length === 0 && !loading ? (
              <div style={{ color: "#777", textAlign: "center", marginTop: 40 }}>
                Hozircha hech qanday reel yo'q.
              </div>
            ) : (
              reels.map((post) => (
                <div key={post.id} className="reel-panel" aria-hidden={false}>
                  <ReelItem post={post} />
                </div>
              ))
            )}

            {/* sentinel element observed by IntersectionObserver */}
            <div
              ref={loadMoreRef}
              style={{
                height: 120,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#777",
              }}
            >
              {loading ? "Loading more reels…" : hasMore ? "" : "No more reels"}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
