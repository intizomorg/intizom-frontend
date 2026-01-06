"use client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { useEffect, useState } from "react";
import API_BASE from "@/lib/api";

export default function AdminPage() {
  const [posts, setPosts] = useState([]);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("error"); // "error" | "success"
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [approvingId, setApprovingId] = useState(null);

  async function loadPosts() {
    setMsg("");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMsg("Admin sifatida login qiling");
        setMsgType("error");
        setPosts([]);
        return;
      }

      const res = await fetch(`${API_BASE}/admin/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let data;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        setMsg((data && data.msg) || "Postlarni yuklashda xatolik");
        setMsgType("error");
        setPosts([]);
        return;
      }

      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      setMsg(err?.message || "Tarmoq xatosi");
      setMsgType("error");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(id) {
    if (!confirm("Postni o‘chirishni xohlaysizmi?")) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setMsg("Admin sifatida login qiling");
      setMsgType("error");
      return;
    }

    setDeletingId(id);
    setMsg("");

    try {
      const res = await fetch(`${API_BASE}/admin/posts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      let data;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        setMsg((data && data.msg) || "O‘chirishda xatolik");
        setMsgType("error");
        return;
      }

      setMsg((data && data.msg) || "Post o‘chirildi");
      setMsgType("success");
      await loadPosts();
    } catch (err) {
      setMsg(err?.message || "Tarmoq xatosi");
      setMsgType("error");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleApprove(id) {
    const token = localStorage.getItem("token");
    if (!token) {
      setMsg("Admin sifatida login qiling");
      setMsgType("error");
      return;
    }

    setApprovingId(id);
    setMsg("");

    try {
      const res = await fetch(`${API_BASE}/admin/posts/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      let data;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        setMsg((data && data.msg) || "Approve qilishda xatolik");
        setMsgType("error");
        return;
      }

      setMsg("Post tasdiqlandi");
      setMsgType("success");
      await loadPosts();
    } catch (err) {
      setMsg(err?.message || "Tarmoq xatosi");
      setMsgType("error");
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        Admin — Postlar moderatsiyasi
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

            {/* MEDIA */}
            {p.media?.length > 0 ? (
              p.media.map((m, i) =>
                m?.type === "video" ? (
                  <video
                    key={i}
                    src={m.url}
                    controls
                    className="w-full rounded-lg mb-2"
                  />
                ) : (
                  <img
                    key={i}
                    src={m.url}
                    alt={`media-${i}`}
                    className="w-full rounded-lg mb-2"
                  />
                )
              )
            ) : (
              p.content && <p className="mb-2">{p.content}</p>
            )}

            <div className="flex items-center gap-4 mt-3">
              {/* APPROVE */}
              {p.status !== "approved" && (
                <button
                  onClick={() => handleApprove(p._id)}
                  disabled={approvingId === p._id}
                  className="text-green-600 text-sm"
                >
                  {approvingId === p._id ? "Tasdiqlanmoqda..." : "Approve"}
                </button>
              )}

              {/* DELETE */}
              <button
                onClick={() => handleDelete(p._id)}
                disabled={deletingId === p._id}
                className="text-red-500 text-sm"
              >
                {deletingId === p._id ? "O‘chirilmoqda..." : "Delete"}
              </button>

              {/* STATUS */}
              <span className="text-sm text-gray-500">
                {p.status === "approved"
                  ? "Approved"
                  : p.status === "rejected"
                  ? "Rejected"
                  : "Pending"}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
