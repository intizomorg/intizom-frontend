"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState, useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const [posts, setPosts] = useState([]);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("error");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const { user } = useContext(AuthContext);
  const router = useRouter();

  // ⛔ user hali yo‘q bo‘lsa — hech narsa render qilinmaydi
  if (!user) return null;

  // 🔐 Admin bo‘lmagan userni redirect qilish
  useEffect(() => {
    if (user.role !== "admin") {
      router.replace("/");
    }
  }, [user, router]);

  // 📥 Postlarni yuklash
  async function loadPosts() {
    setMsg("");
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/posts`,
        { credentials: "include" }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setMsg((data && data.msg) || "Postlarni yuklashda xatolik");
        setMsgType("error");
        setPosts([]);
        return;
      }

      setPosts(Array.isArray(data) ? data : []);
    } catch {
      setMsg("Tarmoq xatosi");
      setMsgType("error");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  // ✅ FAQAT admin bo‘lsa postlar yuklanadi
  useEffect(() => {
    if (user.role === "admin") {
      loadPosts();
    }
  }, [user]);

  // 🗑 Post o‘chirish
  async function handleDelete(id) {
    if (!confirm("Postni o‘chirishni xohlaysizmi?")) return;

    setDeletingId(id);
    setMsg("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/posts/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setMsg((data && data.msg) || "O‘chirishda xatolik");
        setMsgType("error");
        return;
      }

      setMsg("Post o‘chirildi");
      setMsgType("success");
      await loadPosts();
    } catch {
      setMsg("Tarmoq xatosi");
      setMsgType("error");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        Admin — Postlar boshqaruvi
      </h1>

      {msg && (
        <p
          className={`mb-3 px-3 py-2 rounded ${
            msgType === "error"
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {msg}
        </p>
      )}

      {loading ? (
        <p className="text-gray-500">Yuklanmoqda...</p>
      ) : posts.length === 0 ? (
        <p className="text-gray-500">Postlar yo‘q.</p>
      ) : (
        posts.map((p) => (
          <div key={p._id} className="border p-4 rounded-xl mb-5">
            <div className="text-sm text-gray-400 mb-1">
              Yuklagan: {p.username}
            </div>

            {p.media?.map((m, i) =>
              m.type === "video" ? (
                <video
                  key={i}
                  src={m.url}
                  controls
                  className="w-full mb-2"
                />
              ) : (
                <img
                  key={i}
                  src={m.url}
                  className="w-full mb-2"
                />
              )
            )}

            <div className="flex gap-4 mt-3">
              <button
                onClick={() => handleDelete(p._id)}
                disabled={deletingId === p._id}
                className="text-red-500"
              >
                {deletingId === p._id
                  ? "O‘chirilmoqda..."
                  : "Delete"}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
