import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  // 1. Protect Admin Pages (/admin/* except /admin/login)
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!session || session.role !== "ADMIN") {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Protect Admin APIs (/api/admin/*)
  if (pathname.startsWith("/api/admin")) {
    // Allow occupancy, pending (approved roster), and activity for authenticated GUARD as well
    if (
      (pathname === "/api/admin/occupancy" ||
        pathname === "/api/admin/pending" ||
        pathname === "/api/admin/activity") &&
      session &&
      (session.role === "ADMIN" || session.role === "GUARD")
    ) {
      return NextResponse.next();
    }
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized: Admin login required." }, { status: 401 });
    }
  }

  // 3. Protect Security Scanner Pages (/security/* except /security/login)
  if (pathname.startsWith("/security") && !pathname.startsWith("/security/login")) {
    if (!session || (session.role !== "GUARD" && session.role !== "ADMIN")) {
      const loginUrl = new URL("/security/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 4. Protect Security Scanner APIs (/api/security/*)
  if (pathname.startsWith("/api/security")) {
    if (!session || (session.role !== "GUARD" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized: Security guard login required." }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/security/:path*", "/api/security/:path*"],
};
