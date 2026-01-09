// middleware.js
import { NextResponse } from "next/server";

const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/_next",
  "/api",
  "/favicon.ico",
  "/assets",
  "/public",
];

function isPublic(pathname) {
  return PUBLIC_PREFIXES.some(p => pathname.startsWith(p));
}

export function middleware(request) {
  const cookieToken = request.cookies.get("token")?.value;
  const authHeader = request.headers.get("authorization");
  const authToken = authHeader && authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  const token = cookieToken || authToken;
  const { pathname } = request.nextUrl;

  // Allow all public prefixes
  if (isPublic(pathname)) return NextResponse.next();

  // If request is to static asset (/_next/static, etc) allow
  if (pathname.startsWith("/_next/static") || pathname.startsWith("/static")) {
    return NextResponse.next();
  }

  // Default: require auth for non-public routes (this will protect "/" as well)
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // preserve original requested path to return after login
    url.searchParams.set("next", request.nextUrl.pathname + (request.nextUrl.search || ""));
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|assets).*)"],
};
