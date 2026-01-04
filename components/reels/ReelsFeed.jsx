"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import ReelItem from "./ReelItem";

/**
 * ReelsFeed — production-ready infinite reels feed
 * Fixes applied:
 *  - NEXT_PUBLIC_API_URL is required (no silent localhost fallback)
 *  - Pagination state reset on mount
 *  - Robust backend-shape normalization (posts | array)
 *  - hasMore race-condition fixed with hasMoreRef
 *  - IntersectionObserver tuned with rootMargin to avoid spammy triggers
 *  - Stop fetching when backend returns empty page (avoid infinite loop)
 */

export default function ReelsFeed() {
  // --- API must be explicitly provided in environment ---
  const API = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!API) {
    // Fail fast in production/dev so frontend doesn't silently call localhost
    throw new Error("NEXT_PUBLIC_API_URL is not set. Please set it in your environment.");
  }

  const [reels, setReels] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  // refs to avoid closure-related race conditions inside fetch/observer
  const fetchingRef = useRef(false);
  const hasMoreRef = useRef(true);

  // keep hasMoreRef synced with hasMore state
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  /**
   * fetchReels(pageNum)
   * - uses fetchingRef and hasMoreRef to avoid races
   * - normalizes backend shapes (data.posts | data)
   * - maps _id -> id and filters only valid video posts
   * - stops and sets hasMore=false when backend returns empty page
   */
  const fetchReels = useCallback(
    async (pageNum) => {
      // protect against concurrent fetches and if no more pages
      if (fetchingRef.current || !hasMoreRef.current) return;

      fetchingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch(`${API}/posts/reels?page=${pageNum}&limit=5`, { headers });

        if (!res.ok) {
          throw new Error("HTTP " + res.status);
        }

        const data = await res.json();

        // --- Robust normalization for different backend shapes (per request) ---
        const rawList = Array.isArray(data.posts)
          ? data.posts
          : Array.isArray(data)
          ? data
          : [];

        // Map ids and include explicit normalized fields (liked, likesCount, views)
        // IMPORTANT: prefer `username` from backend when available to avoid "user" fallback.
        const onlyVideos = rawList
          .map((p) => ({
            ...p,
            id: String(p._id || p.id),
            user: p.username || p.user, // 🔥 MUHIM: prefer username field when present
            liked: Boolean(p.liked),
            likesCount: Number(p.likesCount || 0),
            views: Number(p.views || 0),
          }))
          .filter(
            (p) =>
              p.id &&
              p.type === "video" &&
              Array.isArray(p.media) &&
              p.media[0]?.url
          );

        // If backend returned no items on this page -> stop further fetching
        if (onlyVideos.length === 0) {
          // ensure both state and ref updated
          setHasMore(false);
          hasMoreRef.current = false;
          // if this was the first page, also clear reels (already done on mount but keep safe)
          if (pageNum === 1) {
            setReels([]);
          }
          return;
        }

        // Merge with existing reels while avoiding duplicates (preserve existing comments etc.)
        setReels((prev) => {
          const map = new Map(prev.map((p) => [p.id, p]));
          // Append new items at the end in the order received
          onlyVideos.forEach((p) => {
            if (map.has(p.id)) {
              const old = map.get(p.id);
              map.set(p.id, {
                ...old,
                ...p,
                // keep old comments if they exist
                comments: old.comments ?? p.comments ?? [],
              });
            } else {
              map.set(p.id, p);
            }
          });
          return Array.from(map.values());
        });

        // Respect backend hasMore but keep defensive about empty pages
        const backendHasMore = Boolean(data.hasMore);
        const newHasMore = backendHasMore && onlyVideos.length > 0;
        setHasMore(newHasMore);
        hasMoreRef.current = newHasMore;

        // advance page for next fetch
        setPage(pageNum + 1);
      } catch (e) {
        console.error("REELS FETCH ERROR:", e);
        setError("Reels yuklanmadi. Internet yoki serverni tekshiring.");
      } finally {
        fetchingRef.current = false;
        setLoading(false);
      }
    },
    [API]
  );

  // Reset pagination & load first page on mount (important to avoid stale state)
  useEffect(() => {
    // reset before first load
    setReels([]);
    setPage(1);
    setHasMore(true);
    hasMoreRef.current = true;
    setError(null);

    fetchReels(1);
    // fetchReels is stable via useCallback (depends only on API)
  }, [fetchReels]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;

    // disconnect previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e) return;

        // don't call fetch if already fetching or no more pages
        if (!e.isIntersecting) return;
        if (fetchingRef.current) return;
        if (!hasMoreRef.current) return;

        // fetch current page
        fetchReels(page);
      },
      // Use large rootMargin to reduce mobile spamming of fetch calls
      { root: null, rootMargin: "300px", threshold: 0 }
    );

    observerRef.current.observe(el);

    return () => observerRef.current?.disconnect();
    // note: we intentionally don't include 'page' in deps to avoid reconnect churn; fetchReels reads page param we pass in
  }, [fetchReels, /* loadMoreRef wiring is stable */]);

  if (error) {
    return (
      <div style={{ color: "#f87171", textAlign: "center", marginTop: 40 }}>
        {error}
      </div>
    );
  }

  return (
    <div
      className="reels-feed"
      style={{
        height: "100vh",
        overflowY: "scroll",
        scrollSnapType: "y mandatory",
        backgroundColor: "#000",
      }}
    >
      {reels.length === 0 && !loading ? (
        <div style={{ color: "#777", textAlign: "center", marginTop: 40 }}>
          Hozircha hech qanday reel yo'q.
        </div>
      ) : (
        reels.map((post) => (
          <div
            key={post.id}
            style={{
              scrollSnapAlign: "start",
              height: "100vh",
            }}
          >
            <ReelItem post={post} />
          </div>
        ))
      )}

      {/* sentinel element observed by IntersectionObserver */}
      <div
        ref={loadMoreRef}
        style={{
          height: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#777",
        }}
      >
        {loading ? "Loading more reels…" : hasMore ? "" : "No more reels"}
      </div>
    </div>
  );
}
