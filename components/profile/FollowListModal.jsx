"use client";

import Link from "next/link";

export default function FollowModal({
  open,
  onClose,
  title,
  users = [],
  onUnfollow, // 🔥 YANGI
}) {
  if (!open) return null;

  const isFollowingList = title === "Following";

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div style={headerStyle}>
          <span>{title}</span>
          <button onClick={onClose} style={closeBtn}>×</button>
        </div>

        {/* BODY */}
        <div style={listStyle}>
          {users.length === 0 ? (
            <div style={{ padding: 20, color: "#777", textAlign: "center" }}>
              Hech kim yo‘q
            </div>
          ) : (
            users.map((u) => (
              <div key={u.username} style={userRow}>
                <Link
                  href={`/profile/${u.username}`}
                  onClick={onClose}
                  style={userLink}
                >
                  <div style={avatar}>
                    {u.avatar ? (
                      <img
                        src={u.avatar}
                        alt=""
                        style={{ width: "100%", height: "100%", borderRadius: "50%" }}
                      />
                    ) : (
                      u.username[0].toUpperCase()
                    )}
                  </div>
                  <span>{u.username}</span>
                </Link>

                {/* 🔥 UNFOLLOW BUTTON (faqat Following listda) */}
                {isFollowingList && (
                  <button
                    onClick={() => onUnfollow(u.username)}
                    style={unfollowBtn}
                  >
                    Unfollow
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const overlayStyle = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalStyle = {
  width: 420,
  maxHeight: "70vh",
  backgroundColor: "#111",
  borderRadius: 10,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

const headerStyle = {
  padding: "12px 16px",
  borderBottom: "1px solid #222",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontWeight: "bold",
};

const closeBtn = {
  background: "none",
  border: "none",
  color: "#fff",
  fontSize: 22,
  cursor: "pointer",
};

const listStyle = {
  overflowY: "auto",
};

const userRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "10px 16px",
  borderBottom: "1px solid #222",
};

const userLink = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  textDecoration: "none",
  color: "#fff",
};

const avatar = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  backgroundColor: "#333",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "bold",
};

const unfollowBtn = {
  background: "none",
  border: "1px solid #333",
  color: "#ef4444",
  padding: "4px 10px",
  borderRadius: 6,
  cursor: "pointer",
  fontSize: 13,
};
