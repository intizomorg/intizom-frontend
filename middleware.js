import { NextResponse } from "next/server";

export function middleware(request) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // 🔓 Ochiq sahifalar
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/_next")
  ) {
    return NextResponse.next();
  }

  // 🔒 Login qilinmagan bo‘lsa
  if (!token) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",                 // localhost:3000
    "/profile/:path*",
    "/posts/:path*",
    "/messages/:path*"
  ],
};
