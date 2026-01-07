"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReelItem from "./ReelItem";

export default function ReelsFeed() {
  useEffect(() => {
    document.body.classList.add("page--reels");
    return () => {
      document.body.classList.remove("page--reels");
    };
  }, []);

  const API =
    typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL
      ? String(process.env.NEXT_PUBLIC_API_URL).replace(/\/$/, "")
      : "";

  if (!API) {
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

  const fetchingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const pageRef = useRef(1);
  const loadMoreRef = useRef(null);
  const observerRef = useRef(null);
  const feedRef = useRef(null);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);
  useEffect(() => {
    pageRef.current = page;
  }, [page]);

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

        if (onlyVideos.length === 0) {
          setHasMore(false);
          hasMoreRef.current = false;
          if (pageNum === 1) setReels([]);
          return;
        }

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

        const backendHasMore = Boolean(data.hasMore);
        const newHasMore = backendHasMore && onlyVideos.length > 0;
        setHasMore(newHasMore);
        hasMoreRef.current = newHasMore;

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

  useEffect(() => {
    setReels([]);
    setPage(1);
    pageRef.current = 1;
    setHasMore(true);
    hasMoreRef.current = true;
    setError(null);

    fetchReels(1);
  }, [fetchReels]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;

    observerRef.current?.disconnect();
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
        threshold: 0.92,
      }
    );

    observerRef.current.observe(el);

    return () => observerRef.current?.disconnect();
  }, [fetchReels]);

  // Keyboard navigation remains but scrollBy removed
  const handleKeyDown = (e) => {
    if (!feedRef.current) return;

    if (e.key === "Home") {
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
      )}
    </>
  );
}
