const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

if (!API_BASE) {
  throw new Error("NEXT_PUBLIC_API_URL belgilanmagan");
}

export default API_BASE;

// ---------------- POSTS ----------------
export async function getPosts() {
  const res = await fetch(`${API_BASE}/posts`, {
    credentials: "include",
  });
  return res.json();
}

// ---------------- UPLOAD ----------------
export async function uploadVideo(formData) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
    credentials: "include",
  });

  return res.json();
}

// ---------------- LOGIN ----------------
export async function loginUser({ username, password }) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // ⭐ MUHIM (cookie/session uchun)
    body: JSON.stringify({ username, password }),
  });

  return res.json();
}

// ---------------- REGISTER ----------------
export async function registerUser(data) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  return res.json();
}
