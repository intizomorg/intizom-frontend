const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
if (!API_BASE) throw new Error("NEXT_PUBLIC_API_URL belgilanmagan");

// ---------------- CORE FETCH ----------------

async function baseFetch(url, options = {}, retry = true) {
  const res = await fetch(API_BASE + url, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.headers || {}),
      ...(options.body && !(options.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {})
    }
  });

  // ❗ Faqat protected API lar uchun refresh ishlaydi
  if (res.status === 401 && retry && !url.startsWith("/auth/")) {
    const refreshed = await fetch(API_BASE + "/auth/refresh", {
      method: "POST",
      credentials: "include"
    });

    if (refreshed.ok) {
      return baseFetch(url, options, false);
    }
  }

  return res;
}

// ---------------- AUTH ----------------

// 🔥 MUHIM: login / register baseFetch ishlatmaydi
export async function loginUser(data) {
  const res = await fetch(API_BASE + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data)
  });

  return res.json();
}

export async function registerUser(data) {
  const res = await fetch(API_BASE + "/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data)
  });

  return res.json();
}

export async function logoutUser() {
  const res = await baseFetch("/auth/logout", { method: "POST" });
  return res.json();
}

export async function getMe() {
  const res = await baseFetch("/auth/me");
  if (!res.ok) return null;
  return res.json();
}

// ---------------- POSTS ----------------

export async function getPosts(page = 1) {
  const res = await baseFetch(`/posts?page=${page}`);
  return res.json();
}

export async function likePost(id) {
  const res = await baseFetch(`/posts/${id}/like`, { method: "POST" });
  return res.json();
}

export async function unlikePost(id) {
  const res = await baseFetch(`/posts/${id}/unlike`, { method: "POST" });
  return res.json();
}

// ---------------- UPLOAD ----------------

export async function uploadVideo(formData) {
  const res = await baseFetch("/upload", {
    method: "POST",
    body: formData
  });
  return res.json();
}
