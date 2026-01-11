"use client";

import { useEffect, useState, useContext, useCallback } from "react";
import { useParams } from "next/navigation";
import { AuthContext } from "@/context/AuthContext";
import EditProfileModal from "@/components/profile/EditProfileModal";
import ProfileSettingsModal from "@/components/profile/ProfileSettingsModal";
import FollowModal from "@/components/profile/FollowListModal";
import PostViewerModal from "@/components/profile/PostViewerModal";
import AvatarViewerModal from "@/components/profile/AvatarViewerModal";

/**
 * ProfilePage — corrected & hardened (avatar cache busting)
 */

// useIsMobile hook
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
}

const btnStyle = {
  background: "linear-gradient(135deg,#fd1d1d,#fcb045)",
  border: "none",
  color: "#fff",
  padding: "8px 26px",
  borderRadius: 20,
  fontWeight: 600,
  fontSize: 14,
  boxShadow: "0 4px 12px rgba(253,29,29,0.35)",
};

export default function ProfilePage() {
  const isMobile = useIsMobile();

  const { username: raw } = useParams();
  const username = decodeURIComponent(raw || "");
  const { user } = useContext(AuthContext);

  if (!process.env.NEXT_PUBLIC_API_URL) {
    console.warn("NEXT_PUBLIC_API_URL not set");
  }
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [followersOpen, setFollowersOpen] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [avatarOpen, setAvatarOpen] = useState(false);

  const [tab, setTab] = useState("images");

  const loadProfile = useCallback(async () => {
    if (!API) {
      console.error("API base URL is not configured (NEXT_PUBLIC_API_URL).");
      setProfile(null);
      return null;
    }
    try {
      const res = await fetch(`${API}/profile/${encodeURIComponent(username)}`);
      if (!res.ok) {
        throw new Error("Failed to fetch profile");
      }
      const data = await res.json();
      setProfile(data);
      return data;
    } catch (err) {
      console.error("loadProfile error:", err);
      setProfile(null);
      return null;
    }
  }, [API, username]);

  const loadPosts = useCallback(async () => {
    if (!API) {
      console.error("API base URL is not configured (NEXT_PUBLIC_API_URL).");
      setPosts([]);
      return [];
    }
    try {
      const res = await fetch(`${API}/posts/user/${encodeURIComponent(username)}`);
      if (!res.ok) {
        throw new Error("Failed to fetch user posts");
      }
      const json = await res.json();
      const arr = Array.isArray(json?.posts) ? json.posts : [];
      const normalized = (arr || []).map((p) => ({
        ...p,
        id: p._id ? String(p._id) : p.id,
        user: p.user || p.username,
        username: p.username || p.user,
        likesCount: p.likesCount || 0,
        viewsCount: p.views || 0,
      }));

      setPosts(normalized);
      return normalized;
    } catch (err) {
      console.error("loadPosts error:", err);
      setPosts([]);
      return [];
    }
  }, [API, username]);

  // --- IMPORTANT FIXES: use credentials: 'include' (server uses httpOnly cookies) ---
  const checkFollow = useCallback(async () => {
    if (!API) {
      console.error("API base URL is not configured (NEXT_PUBLIC_API_URL).");
      setIsFollowing(false);
      return false;
    }
    if (!user || user.username === username) {
      setIsFollowing(false);
      return false;
    }

    // Server expects cookie; send credentials to include cookies.
    try {
      const res = await fetch(`${API}/follow/check/${encodeURIComponent(username)}`, {
        credentials: "include",
      });
      if (!res.ok) {
        // if 401 or other, treat as not following
        setIsFollowing(false);
        return false;
      }
      const d = await res.json().catch(() => ({}));
      setIsFollowing(!!d.isFollowing);
      return !!d.isFollowing;
    } catch (err) {
      console.error("checkFollow error:", err);
      setIsFollowing(false);
      return false;
    }
  }, [API, user, username]);

  const handleFollow = async () => {
    if (!API) {
      console.error("API base URL is not configured (NEXT_PUBLIC_API_URL).");
      return;
    }
    if (!user || user.username === username) return;

    setFollowLoading(true);
    const prevIsFollowing = isFollowing;
    const prevFollowersCount = profile?.followers ?? 0;

    // optimistic UI
    setIsFollowing(true);
    setProfile((p) => (p ? { ...p, followers: (p.followers || 0) + 1 } : p));

    try {
      const res = await fetch(`${API}/follow/${encodeURIComponent(username)}`, {
        method: "POST",
        credentials: "include", // <-- send httpOnly cookie
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.msg || "Follow failed");
      }
      await loadProfile();
    } catch (err) {
      console.error("handleFollow error:", err);
      // rollback
      setIsFollowing(prevIsFollowing);
      setProfile((p) => (p ? { ...p, followers: prevFollowersCount } : p));
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!API) {
      console.error("API base URL is not configured (NEXT_PUBLIC_API_URL).");
      return;
    }
    if (!user || user.username === username) return;

    setFollowLoading(true);
    const prevIsFollowing = isFollowing;
    const prevFollowersCount = profile?.followers ?? 0;

    // optimistic UI
    setIsFollowing(false);
    setProfile((p) => (p ? { ...p, followers: Math.max(0, (p.followers || 1) - 1) } : p));

    try {
      const res = await fetch(`${API}/unfollow/${encodeURIComponent(username)}`, {
        method: "POST",
        credentials: "include", // <-- send httpOnly cookie
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.msg || "Unfollow failed");
      }
      await loadProfile();
    } catch (err) {
      console.error("handleUnfollow error:", err);
      // rollback
      setIsFollowing(prevIsFollowing);
      setProfile((p) => (p ? { ...p, followers: prevFollowersCount } : p));
    } finally {
      setFollowLoading(false);
    }
  };

  useEffect(() => {
    if (!followersOpen) return;
    if (!API) {
      console.error("API base URL is not configured (NEXT_PUBLIC_API_URL).");
      setFollowersList([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/profile/${encodeURIComponent(username)}/followers`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch followers");
        const d = await res.json();
        if (!cancelled) setFollowersList(Array.isArray(d) ? d : []);
      } catch (err) {
        console.error("fetch followers error:", err);
        if (!cancelled) setFollowersList([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [followersOpen, API, username]);

  useEffect(() => {
    if (!followingOpen) return;
    if (!API) {
      console.error("API base URL is not configured (NEXT_PUBLIC_API_URL).");
      setFollowingList([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/profile/${encodeURIComponent(username)}/following`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch following");
        const d = await res.json();
        if (!cancelled) setFollowingList(Array.isArray(d) ? d : []);
      } catch (err) {
        console.error("fetch following error:", err);
        if (!cancelled) setFollowingList([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [followingOpen, API, username]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setLoading(true);
      const prof = await loadProfile();
      const postsLoaded = await loadPosts();
      if (!cancelled && user && user.username !== username) {
        await checkFollow();
      } else if (!cancelled) {
        setIsFollowing(false);
      }
      setLoading(false);
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [username, user?.username, loadProfile, loadPosts, checkFollow]);

  if (loading) {
    return (
      <div style={{ color: "#777", textAlign: "center", marginTop: 80 }}>
        Loading...
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ color: "#777", textAlign: "center", marginTop: 80 }}>
        Profile not found
      </div>
    );
  }

  const isOwn = user?.username === profile.username;

  const imagePosts = posts.filter((p) => p.type !== "video");
  const videoPosts = posts.filter((p) => p.type === "video");
  const visiblePosts = tab === "images" ? imagePosts : posts.filter((p) => p.type === "video");

  const avatarSrc = profile?.avatar ? `${profile.avatar}?v=${profile.updatedAt || ""}` : "";

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#000",
        color: "#fff",
        padding: isMobile ? "16px" : "40px",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 16 : 40,
          alignItems: "center",
          maxWidth: 900,
          margin: "0 auto",
          textAlign: isMobile ? "center" : "left",
        }}
      >
        {/* AVATAR */}
        <div
          onClick={() => profile?.avatar && setAvatarOpen(true)}
          style={{
            width: isMobile ? 96 : 150,
            height: isMobile ? 96 : 150,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)",
            padding: 3,
            boxShadow: isMobile ? "0 0 0 3px #000, 0 0 0 5px #fd1d1d" : "none",
            cursor: profile?.avatar ? "pointer" : "default",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              backgroundColor: "#111",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              fontSize: 42,
              fontWeight: "bold",
            }}
          >
            {profile?.avatar ? (
              <img
                src={avatarSrc}
                alt="avatar"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              (profile?.username && profile.username[0]?.toUpperCase()) || ""
            )}
          </div>
        </div>

        {/* INFO */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: isMobile ? "center" : "flex-start" }}>
            <h2
              style={{
                margin: 0,
                fontSize: isMobile ? 22 : 28,
                letterSpacing: 0.3,
                textAlign: isMobile ? "center" : "left",
              }}
            >
              {profile.username}
            </h2>

            {isOwn && (
              <button
                onClick={() => setSettingsOpen(true)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#fff",
                  fontSize: 22,
                  cursor: "pointer",
                }}
                title="Settings"
              >
                ⚙️
              </button>
            )}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              margin: isMobile ? "14px 0" : "18px 0",
              width: "100%",
            }}
          >
            <span style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <b>{profile.posts}</b>
              <span style={{ fontSize: 12, color: "#bbb" }}>posts</span>
            </span>

            <span style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }} onClick={() => setFollowersOpen(true)}>
              <b>{profile.followers}</b>
              <span style={{ fontSize: 12, color: "#bbb" }}>followers</span>
            </span>

            <span style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }} onClick={() => setFollowingOpen(true)}>
              <b>{profile.following}</b>
              <span style={{ fontSize: 12, color: "#bbb" }}>following</span>
            </span>
          </div>

          {profile.bio && (
            <div
              style={{
                marginTop: 10,
                fontSize: 13,
                color: "#ddd",
                lineHeight: 1.45,
                maxWidth: 420,
                marginLeft: isMobile ? "auto" : 0,
                marginRight: isMobile ? "auto" : 0,
              }}
            >
              {profile.bio}
            </div>
          )}

          {profile.website && (
            <div style={{ marginTop: 6 }}>
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#1da1f2",
                  fontSize: 13,
                  fontWeight: 500,
                  wordBreak: "break-all",
                }}
              >
                {profile.website}
              </a>
            </div>
          )}

          <div style={{ marginTop: 16, display: "flex", justifyContent: isMobile ? "center" : "flex-start" }}>
            {isOwn ? (
              <button onClick={() => setEditing(true)} style={btnStyle}>
                Edit profile
              </button>
            ) : isFollowing ? (
              <button
                onClick={handleUnfollow}
                disabled={followLoading}
                style={{ ...btnStyle, opacity: 0.95, backgroundColor: "#222" }}
              >
                {followLoading ? "..." : "Following"}
              </button>
            ) : (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                style={{ ...btnStyle, backgroundColor: "#1da1f2" }}
              >
                {followLoading ? "..." : "Follow"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div
        style={{
          maxWidth: 900,
          margin: "40px auto 0",
          display: "flex",
          justifyContent: "center",
          borderTop: "1px solid #222",
        }}
      >
        <button
          onClick={() => setTab("images")}
          style={{
            padding: isMobile ? "10px 14px" : "14px 20px",
            fontSize: isMobile ? 12 : 14,
            letterSpacing: 0.5,
            background: "none",
            border: "none",
            color: tab === "images" ? "#fff" : "#777",
            borderTop: tab === "images" ? "2px solid #fff" : "2px solid transparent",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Image
        </button>

        <button
          onClick={() => setTab("video")}
          style={{
            padding: isMobile ? "10px 14px" : "14px 20px",
            fontSize: isMobile ? 12 : 14,
            letterSpacing: 0.5,
            background: "none",
            border: "none",
            color: tab === "video" ? "#fff" : "#777",
            borderTop: tab === "video" ? "2px solid #fff" : "2px solid transparent",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Videos
        </button>
      </div>

      {/* POSTS GRID */}
      <div
        style={{
          maxWidth: 900,
          margin: "50px auto 0",
          borderTop: "1px solid #222",
          paddingTop: 30,
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
          gap: isMobile ? 6 : 4,
        }}
      >
        {visiblePosts.length === 0 ? (
          <div
            style={{
              gridColumn: "1 / -1",
              color: "#777",
              textAlign: "center",
              padding: 60,
            }}
          >
            Hali rasmlar yo'q
          </div>
        ) : (
          visiblePosts.map((p, index) => (
            <div
              key={p.id || index}
              onClick={() => {
                setViewerIndex(index);
                setViewerOpen(true);
              }}
              style={{
                aspectRatio: "1 / 1",
                backgroundColor: "#111",
                overflow: "hidden",
                cursor: "pointer",
                position: "relative",
              }}
              className="profile-post-item"
            >
              {p.type === "video" && p.media?.[0]?.url ? (
                <video
                  src={p.media[0].url}
                  muted
                  playsInline
                  preload="metadata"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : p.media?.[0]?.url ? (
                <img
                  src={p.media[0].url}
                  alt="post"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : null}

              <div
                className="profile-hover-overlay"
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.55)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 24,
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 16,
                }}
              >
                <span>❤️ {p.likesCount ?? 0}</span>
                {p.type === "video" && <span>▶️ {p.viewsCount ?? 0}</span>}
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .profile-hover-overlay {
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease;
        }

        @media (hover: hover) and (pointer: fine) {
          .profile-post-item:hover .profile-hover-overlay {
            opacity: 1;
            pointer-events: auto;
          }
        }

        @media (hover: none) and (pointer: coarse) {
          .profile-hover-overlay {
            display: none;
          }
        }

        .profile-hover-overlay span {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>

      {/* EDIT PROFILE */}
      {editing && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditing(false)}
          onSaved={async ({ avatar }) => {
            setProfile((prev) => ({
              ...prev,
              avatar: avatar || prev.avatar,
            }));
          }}
        />
      )}

      {/* PROFILE SETTINGS */}
      <ProfileSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* FOLLOW MODALS */}
      <FollowModal
  open={followingOpen}
  onClose={() => setFollowingOpen(false)}
  title="Following"
  users={followingList}
  onUnfollow={async (username) => {
    await fetch(`${API}/unfollow/${encodeURIComponent(username)}`, {
      method: "POST",
      credentials: "include",
    });
    setFollowingList((prev) => prev.filter(u => u.username !== username));
    setProfile(p => ({ ...p, following: Math.max(0, p.following - 1) }));
  }}
/>

      {/* POST VIEWER */}
      {viewerOpen && (
        <PostViewerModal posts={visiblePosts} startIndex={viewerIndex} onClose={() => setViewerOpen(false)} />
      )}

      {/* AVATAR VIEWER */}
      {avatarOpen && <AvatarViewerModal src={avatarSrc || profile?.avatar} onClose={() => setAvatarOpen(false)} />}
    </div>
  );
}
