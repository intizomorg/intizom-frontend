// frontend/lib/api.js
const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

if (!API_BASE) {
  throw new Error("NEXT_PUBLIC_API_URL belgilanmagan");
}

export default API_BASE;

/**
 * Token helpers (localStorage)
 */
export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}
export function setAccessToken(token) {
  if (typeof window === "undefined") return;
  localStorage.setItem("accessToken", token);
}
export function removeAccessToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("accessToken");
}

/**
 * CSRF helper: server yuborgan x-csrf-token headerni localStorage ga yozish/use qilish.
 */
export function getCsrf() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("csrf") || null;
}
export function setCsrf(val) {
  if (typeof window === "undefined") return;
  if (val) localStorage.setItem("csrf", val);
}

/**
 * Generic fetch wrapper:
 * - qo'shimcha: Authorization header accessToken orqali
 * - avtomatik refresh: 401 olinsa /auth/refresh ga POST, agar muvaffaqiyat bo'lsa original request qayta yuboriladi
 * - credentials: "include" qo'yiladi (refresh cookie uchun)
 */
async function apiFetch(path, opts = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  const init = Object.assign({}, opts);

  // default credentials to include so refresh cookie is sent
  init.credentials = init.credentials || "include";

  init.headers = init.headers || {};

  // attach Authorization if accessToken present
  const accessToken = getAccessToken();
  if (accessToken) {
    init.headers = { ...init.headers, Authorization: `Bearer ${accessToken}` };
  }

  // attach CSRF for state-changing requests if available and not a FormData body
  const method = (init.method || "GET").toUpperCase();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const csrf = getCsrf();
    if (csrf) init.headers = { ...init.headers, "x-csrf-token": csrf };
  }

  // perform request
  let res = await fetch(url, init);

  // if 401 -> try refresh once
  if (res.status === 401) {
    // attempt refresh
    const r = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include"
    });

    if (r.ok) {
      const data = await r.json();
      if (data?.accessToken) {
        setAccessToken(data.accessToken);
        // retry original request with new token
        init.headers = init.headers || {};
        init.headers.Authorization = `Bearer ${data.accessToken}`;
        res = await fetch(url, init);
      } else {
        // refresh returned ok but no token -> fallthrough to error handling
      }
    } else {
      // refresh failed: clear token and propagate unauthorized
      removeAccessToken();
      throw { status: 401, msg: "Unauthorized" };
    }
  }

  // parse json when possible; caller can read status if needed
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await res.json();
    if (!res.ok) throw { status: res.status, body };
    return body;
  } else {
    // non-json response (e.g., file stream / image) -> return Response
    if (!res.ok) throw { status: res.status, body: await res.text() };
    return res;
  }
}

/* ------------------ Public API functions ------------------ */

/** Public: get posts (no auth required) */
export async function getPosts({ page = 1, limit = 10, feed = "all" } = {}) {
  const q = `?page=${page}&limit=${limit}&feed=${encodeURIComponent(feed)}`;
  return apiFetch(`/posts${q}`, { method: "GET" });
}

/** Upload video/image - uses FormData; Authorization header is attached by apiFetch */
export async function uploadVideo(formData) {
  // do NOT set Content-Type header for FormData; browser sets boundary
  return apiFetch("/upload", {
    method: "POST",
    body: formData
  });
}

/** Login: send credentials; server should set refreshToken cookie and return { accessToken } */
export async function loginUser({ username, password }) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  if (!res.ok) {
    // try parse error body
    let err;
    try { err = await res.json(); } catch { err = { msg: "Login failed" }; }
    throw { status: res.status, body: err };
  }

  const data = await res.json();
  if (!data?.accessToken) {
    throw { status: 500, body: { msg: "Login: server didn't return accessToken" } };
  }

  // store accessToken
  setAccessToken(data.accessToken);

  // fetch /auth/me to get user + capture x-csrf-token header if provided
  const meRes = await fetch(`${API_BASE}/auth/me`, {
    method: "GET",
    credentials: "include",
    headers: { Authorization: `Bearer ${data.accessToken}` }
  });

  if (!meRes.ok) {
    // if /auth/me fails, still return accessToken but indicate failure
    removeAccessToken();
    throw { status: meRes.status, body: await meRes.text() };
  }

  const user = await meRes.json();
  // extract CSRF header if present
  const csrfHeader = meRes.headers.get("x-csrf-token");
  if (csrfHeader) setCsrf(csrfHeader);

  return { accessToken: data.accessToken, user };
}

/** Register: similar to login flow (server should return accessToken and set refresh cookie) */
export async function registerUser(payload) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    let err;
    try { err = await res.json(); } catch { err = { msg: "Register failed" }; }
    throw { status: res.status, body: err };
  }

  const data = await res.json();
  if (!data?.accessToken) {
    throw { status: 500, body: { msg: "Register: server didn't return accessToken" } };
  }

  setAccessToken(data.accessToken);

  const meRes = await fetch(`${API_BASE}/auth/me`, {
    method: "GET",
    credentials: "include",
    headers: { Authorization: `Bearer ${data.accessToken}` }
  });

  if (!meRes.ok) {
    removeAccessToken();
    throw { status: meRes.status, body: await meRes.text() };
  }

  const user = await meRes.json();
  const csrfHeader = meRes.headers.get("x-csrf-token");
  if (csrfHeader) setCsrf(csrfHeader);

  return { accessToken: data.accessToken, user };
}

/** Logout: call server to revoke refresh token; clear local storage tokens */
export async function logoutUser() {
  try {
    // use apiFetch so Authorization header is attached and CSRF included
    await apiFetch("/auth/logout", { method: "POST" });
  } catch (e) {
    // ignore server errors on logout, proceed to clear local state
    // but rethrow if it's critical? here we just clear anyway
  } finally {
    removeAccessToken();
    if (typeof window !== "undefined") localStorage.removeItem("csrf");
  }
}

/* Export apiFetch for other modules to use directly when needed */
export { apiFetch };
