import { NextResponse } from "next/server";

const protectedPaths = ["/upload", "/messages", "/profile", "/admin"];

export function middleware(request) {
  const token = request.cookies.get("token");
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  if (protectedPaths.some(p => pathname.startsWith(p))) {
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|assets).*)"],
};
