export default function ChatItem({ chat, onClick, active }) {
  return (
    <div
      onClick={onClick}
      className={`chat-item ${active ? "active" : ""}`}
    >
      <div className="avatar">
        {chat.username?.[0]?.toUpperCase()}
      </div>

      <div className="chat-meta">
        <div className="username">{chat.username}</div>
        <div className="last">
          {chat.lastMessage || "Hali xabar yo‘q"}
        </div>
      </div>

      {chat.online && <span className="online-dot" />}
    </div>
  );
}
