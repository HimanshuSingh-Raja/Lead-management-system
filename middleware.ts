import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Server-side protection for /admin routes
  if (pathname.startsWith("/admin")) {
    const sessionCookie = request.cookies.get("__session")?.value;

    // Server-side redirect if unauthenticated (prevents flash of content)
    if (!sessionCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const response = NextResponse.next();
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
