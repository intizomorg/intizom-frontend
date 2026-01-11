const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

if (!API_BASE) {
  throw new Error("NEXT_PUBLIC_API_URL belgilanmagan");
}

const defaultFetch = (url, options = {}) => {
  return fetch(API_BASE + url, {
    credentials: "include",   // <<< ENG MUHIM QATOR
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
};

// ---------------- AUTH ----------------

export async function loginUser(data) {
  const res = await defaultFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function registerUser(data) {
  const res = await defaultFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function logoutUser() {
  const res = await defaultFetch("/auth/logout", { method: "POST" });
  return res.json();
}

export async function getMe() {
  const res = await defaultFetch("/auth/me");
  return res.json();
}

// ---------------- POSTS ----------------

export async function getPosts(page = 1) {
  const res = await defaultFetch(`/posts?page=${page}`);
  return res.json();
}

export async function likePost(id) {
  const res = await defaultFetch(`/posts/${id}/like`, { method: "POST" });
  return res.json();
}

export async function unlikePost(id) {
  const res = await defaultFetch(`/posts/${id}/unlike`, { method: "POST" });
  return res.json();
}
