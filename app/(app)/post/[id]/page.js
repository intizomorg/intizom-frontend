"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function PostDetailsPage() {
  const { id } = useParams();
  const API = process.env.NEXT_PUBLIC_API_URL;

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadPost() {
    try {
      const res = await fetch(`${API}/posts/${id}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setPost(data);
    } catch {
      setPost(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadComments() {
    try {
      const res = await fetch(`${API}/posts/${id}/comments`, {
        credentials: "include"
      });
      const data = await res.json();
      setComments(data.comments || []);
    } catch {
      setComments([]);
    }
  }

  useEffect(() => {
    if (!id) return;
    loadPost();
    loadComments();
  }, [id]);

  async function sendComment() {
    if (!text.trim()) return setMsg("Bo‘sh komment bo‘lishi mumkin emas");

    try {
      const res = await fetch(`${API}/posts/${id}/comment`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });

      const data = await res.json();
      if (!res.ok) return setMsg(data.msg || "Xatolik");

      setText("");
      setMsg("");
      loadComments();
    } catch {
      setMsg("Tarmoq xatosi");
    }
  }

  if (loading) return <div className="p-6">Yuklanmoqda...</div>;
  if (!post) return <div className="p-6 text-red-500">Post topilmadi</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="space-y-3 mb-4">
        {post.media.map((m, i) =>
          m.type === "video" ? (
            <video key={i} src={m.url} controls className="w-full rounded-xl" />
          ) : (
            <img key={i} src={m.url} className="w-full rounded-xl" />
          )
        )}
      </div>

      <h1 className="text-xl font-bold">{post.title}</h1>
      <p className="text-gray-600">{post.description}</p>
      <div className="text-sm text-gray-400 mb-4">Yuklagan: {post.user}</div>

      <h2 className="font-semibold mb-2">Kommentlar ({comments.length})</h2>

      <div className="space-y-3 mb-4">
        {comments.map(c => (
          <div key={c.id} className="bg-gray-100 p-3 rounded">
            <div className="text-sm font-semibold">{c.user}</div>
            <div className="text-sm">{c.text}</div>
            <div className="text-xs text-gray-400">
              {new Date(c.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-gray-400">Hali komment yo‘q</p>
        )}
      </div>

      <textarea
        className="w-full border rounded p-3"
        rows={3}
        placeholder="Komment yozing..."
        value={text}
        onChange={e => setText(e.target.value)}
      />

      <button
        onClick={sendComment}
        className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
      >
        Yuborish
      </button>

      {msg && <p className="mt-2 text-sm text-red-500">{msg}</p>}
    </div>
  );
}
