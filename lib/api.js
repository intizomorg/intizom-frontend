const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

if (!API_BASE) {
  throw new Error("NEXT_PUBLIC_API_URL belgilanmagan");
}

export default API_BASE;

// ---------------- HELPERS ----------------
function getAuthHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ---------------- POSTS ----------------
export async function getPosts() {
  const res = await fetch(`${API_BASE}/posts`, {
    credentials: 'include',
    headers: getAuthHeader(),
  });
  return res.json();
}

// ---------------- UPLOAD ----------------
export async function uploadVideo(formData) {
  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    credentials: 'include',
    headers: getAuthHeader(),
    body: formData,
  });
  return res.json();
}

// ---------------- LOGIN ----------------
export async function loginUser({ username, password }) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      credentials: 'include',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { msg: data.msg || "Login xatosi" };
    }

    // Login muvaffaqiyatli bo‘lsa, localStorage-ga token saqlash
    if (data.token) localStorage.setItem("token", data.token);

    return data;
  } catch {
    return { msg: "Server bilan aloqa yo‘q" };
  }
}

// ---------------- REGISTER ----------------
export async function registerUser(data) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    credentials: 'include',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const responseData = await res.json();

  // Register muvaffaqiyatli bo‘lsa, localStorage-ga token saqlash
  if (responseData.token) localStorage.setItem("token", responseData.token);

  return responseData;
}
