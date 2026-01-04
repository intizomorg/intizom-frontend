import { useRouter } from "next/navigation";

export default function UserResult({ user, onSelect }) {
  const router = useRouter();

  const openProfile = () => {
    if (onSelect) onSelect();
    router.push(`/profile/${user.username}`);
  };

  const openMessages = (e) => {
    e.stopPropagation(); // profile clickni to‘xtatadi
    if (onSelect) onSelect();
   router.push(`/messages?user=${encodeURIComponent(user.username)}`);

  };

  return (
    <div
      className="user-result"
      onClick={openProfile}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: 10,
        cursor: "pointer",
      }}
    >
      {/* AVATAR */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "#333",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          fontWeight: "bold",
          flexShrink: 0,
        }}
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.username}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          user.username[0].toUpperCase()
        )}
      </div>

      {/* USERNAME */}
      <div style={{ flex: 1 }}>{user.username}</div>

      {/* MESSAGE ICON */}
      <button
        onClick={openMessages}
        title="Send message"
        style={{
          background: "none",
          border: "none",
          color: "#3b82f6",
          fontSize: 18,
          cursor: "pointer",
        }}
      >
        ✉️
      </button>
    </div>
  );
}
