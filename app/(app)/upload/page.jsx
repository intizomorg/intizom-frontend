"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Image, Video, X } from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

  const [title, setTitle] = useState("");
  const [mode, setMode] = useState(null); // video | image
  const [files, setFiles] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!API) {
      throw new Error("NEXT_PUBLIC_API_URL belgilanmagan");
    }
  }, [API]);

  /* ========= HELPERS ========= */
  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  /* ========= FILE SELECT ========= */
  const handleSelect = (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    const isVideo = selected[0].type.startsWith("video/");
    const isImage = selected[0].type.startsWith("image/");

    if (
      selected.some(
        (f) =>
          (isVideo && !f.type.startsWith("video/")) ||
          (isImage && !f.type.startsWith("image/"))
      )
    ) {
      setMsg("Video va rasmni aralashtirib bo‘lmaydi.");
      return;
    }

    if (isVideo) {
      if (selected.length > 1) return setMsg("Faqat bitta video mumkin.");
      if (selected[0].size > 100 * 1024 * 1024)
        return setMsg("Video 100MB dan oshmasligi kerak.");

      setMode("video");
      setFiles(selected);
      setMsg("");
      return;
    }

    if (isImage) {
      const combined = [...files, ...selected];
      if (combined.length > 5)
        return setMsg("Ko‘pi bilan 5 ta rasm mumkin.");

      setMode("image");
      setFiles(combined);
      setMsg("");
    }
  };

  const clearFiles = () => {
    setFiles([]);
    setMode(null);
    setMsg("");
  };

  /* ========= SUBMIT ========= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!files.length) return setMsg("Media tanlang.");

    setLoading(true);
    setMsg("Yuklanmoqda...");

    const fd = new FormData();
    files.forEach((f) => fd.append("media", f));
    fd.append("title", title.trim());
    fd.append("description", "");

    try {
      const res = await fetch(`${API}/upload`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });

      // Agar server 401 qaytarsa — userni login sahifasiga yo‘naltiramiz
      if (res.status === 401) {
        router.push("/login");
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data.msg || "Upload xatosi");

      setMsg("Post muvaffaqiyatli joylandi!");
      setTimeout(() => router.push("/"), 700);
    } catch (err) {
      setMsg(err.message || "Server bilan aloqa yo‘q");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <header className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Create new post</h1>
            <p className="text-zinc-400 text-sm">Video yoki 1–5 ta rasm yuklang.</p>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <span className="text-xs text-zinc-400">Tip:</span>
            <div className="flex items-center gap-2 bg-zinc-800 px-3 py-1 rounded-lg text-sm">
              <UploadCloud className="w-4 h-4" />
              <span className="text-zinc-300">Drag & select files</span>
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LEFT: Form controls */}
          <div className="space-y-5">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sarlavha"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500"
            />

            <div className="border-2 border-dashed border-zinc-700 rounded-xl p-4 flex flex-col gap-3">
              <label className="inline-flex items-center gap-3 bg-zinc-800 px-4 py-2 rounded-lg cursor-pointer">
                <UploadCloud className="w-5 h-5" />
                <span className="text-sm">Choose media</span>
                <input
                  type="file"
                  accept="video/*,image/*"
                  multiple
                  onChange={handleSelect}
                  className="hidden"
                  disabled={loading}
                />
              </label>

              <p className="text-xs text-zinc-400">Rasm: 1–5 ta. Video: faqat 1 ta (≤100MB).</p>

              {mode === "video" && files.length === 1 && (
                <div className="flex items-center gap-3 text-sm text-zinc-300">
                  <Video className="w-4 h-4" />
                  <div>
                    <div className="font-medium">{files[0].name}</div>
                    <div className="text-xs text-zinc-500">{formatBytes(files[0].size)}</div>
                  </div>
                </div>
              )}

              {mode === "image" && files.length > 0 && (
                <ul className="mt-2 grid grid-cols-1 gap-2 text-sm text-zinc-300">
                  {files.map((f, i) => (
                    <li key={i} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Image className="w-4 h-4" />
                        <div>
                          <div className="font-medium truncate max-w-[220px]">{f.name}</div>
                          <div className="text-xs text-zinc-500">{formatBytes(f.size)}</div>
                        </div>
                      </div>

                      <div className="text-xs text-zinc-400">{i + 1}/5</div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex items-center justify-between mt-2">
                {files.length > 0 ? (
                  <button
                    type="button"
                    onClick={clearFiles}
                    className="text-xs text-zinc-400 hover:text-red-400 inline-flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Clear all
                  </button>
                ) : (
                  <div className="text-xs text-zinc-500">Hech qanday media tanlanmagan</div>
                )}

                <div className="text-xs text-zinc-500">Max hajm: 100MB</div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-semibold ${
                loading
                  ? "bg-zinc-700 text-zinc-300"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.15" />
                    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                  Uploading...
                </span>
              ) : (
                "Upload"
              )}
            </button>

            {msg && (
              <div className="mt-1 text-sm text-center text-zinc-300">{msg}</div>
            )}
          </div>

          {/* RIGHT: Preview / tips */}
          <aside className="hidden md:block p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
            <h3 className="text-sm font-semibold mb-3">Preview & Tips</h3>

            <div className="text-sm text-zinc-400 space-y-3">
              <p>— Sarlavha qisqaroq va mazmunli bo‘lsin.</p>
              <p>— Hashtag va tavsif (serverda description qo‘shing) orqali ko‘proq odamga chiqing.</p>
              <p>— Videolar 9:16 formatda yaxshi chiqadi.</p>
            </div>

            <div className="mt-4">
              <h4 className="text-xs text-zinc-400 mb-2">Tanlangan media</h4>
              {files.length === 0 ? (
                <div className="text-xs text-zinc-500">Hozircha hech narsa yo‘q</div>
              ) : (
                <ul className="space-y-2 text-sm text-zinc-300">
                  {files.map((f, i) => (
                    <li key={i} className="flex items-center justify-between">
                      <div className="truncate max-w-[220px]">{f.name}</div>
                      <div className="text-xs text-zinc-500">{formatBytes(f.size)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
