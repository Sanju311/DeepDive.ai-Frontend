import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth0 } from "./lib/auth0";

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const pathname = nextUrl.pathname;

  // Let Auth0 handle its own routes
  if (pathname.startsWith("/auth/")) {
    return await auth0.middleware(request);
  }

  // Run SDK middleware first (rolling sessions, etc.)
  const sdkResponse = await auth0.middleware(request);

  // Public routes (allow unauthenticated)
  if (pathname === "/" || pathname === "/login") {
    return sdkResponse;
  }

  // Protect everything else
  const session = await auth0.getSession(request);
  if (!session) {
    const loginUrl = new URL("/auth/login", nextUrl);
    const returnTo = pathname + nextUrl.search;
    loginUrl.searchParams.set("returnTo", returnTo);
    return NextResponse.redirect(loginUrl);
  }

  return sdkResponse;
}

export const config = {
  matcher: [
    "/auth/:path*",
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};