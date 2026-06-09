import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { DEFAULT_LOCALE, getLocaleFromPath, stripLocaleFromPath } from "@/lib/i18n";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Skip middleware for static files, API routes, and internal Next.js paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/manifest.json"
  ) {
    return NextResponse.next();
  }

  const locale = getLocaleFromPath(pathname);
  const normalizedPathname = stripLocaleFromPath(pathname);

  const isProtectedRoute =
    normalizedPathname.startsWith("/dashboard") ||
    normalizedPathname.startsWith("/candidates") ||
    normalizedPathname.startsWith("/settings") ||
    normalizedPathname.startsWith("/import") ||
    normalizedPathname.startsWith("/export") ||
    normalizedPathname.startsWith("/automation") ||
    normalizedPathname.startsWith("/admin");

  const isAuthRoute = normalizedPathname.startsWith("/login") || normalizedPathname.startsWith("/register");

  // Use NextAuth v5 session via req.auth
  const isAuthenticated = !!req.auth;

  if (isProtectedRoute && !isAuthenticated) {
    const loginPath = locale && locale !== DEFAULT_LOCALE ? `/${locale}/login` : "/login";
    const loginUrl = new URL(loginPath, req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isAuthenticated) {
    const dashboardPath = locale && locale !== DEFAULT_LOCALE ? `/${locale}/dashboard` : "/dashboard";
    return NextResponse.redirect(new URL(dashboardPath, req.url));
  }

  // Locale-prefixed public URLs map to the existing App Router pages
  const rewriteUrl = req.nextUrl.clone();
  rewriteUrl.pathname = normalizedPathname;

  const response = locale ? NextResponse.rewrite(rewriteUrl) : NextResponse.next();

  if (locale) {
    response.cookies.set("NEXT_LOCALE", locale, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  } else if (!req.cookies.get("NEXT_LOCALE")) {
    response.cookies.set("NEXT_LOCALE", DEFAULT_LOCALE, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
