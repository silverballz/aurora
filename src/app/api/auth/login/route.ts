import { NextResponse } from "next/server";
import {
  ADMIN_CREDENTIALS,
  GUARD_CREDENTIALS,
  SESSION_COOKIE_NAME,
  createSessionToken,
} from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const { identifier, password, role, gate } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Please enter both account ID/email and password." },
        { status: 400 }
      );
    }

    const cleanId = String(identifier).trim().toLowerCase();
    const cleanPass = String(password);

    if (role === "ADMIN") {
      if (cleanId !== ADMIN_CREDENTIALS.email || cleanPass !== ADMIN_CREDENTIALS.password) {
        return NextResponse.json(
          { error: "Invalid administrator email or password." },
          { status: 401 }
        );
      }

      const token = await createSessionToken({
        sub: ADMIN_CREDENTIALS.email,
        role: "ADMIN",
      });

      const res = NextResponse.json({
        success: true,
        role: "ADMIN",
        user: ADMIN_CREDENTIALS.email,
      });

      res.cookies.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return res;
    }

    if (role === "GUARD") {
      const isGuardMatch =
        (cleanId === GUARD_CREDENTIALS.username ||
          cleanId === "guard" ||
          cleanId === "security") &&
        cleanPass === GUARD_CREDENTIALS.password;

      const isAdminMatch =
        cleanId === ADMIN_CREDENTIALS.email && cleanPass === ADMIN_CREDENTIALS.password;

      if (!isGuardMatch && !isAdminMatch) {
        return NextResponse.json(
          { error: "Invalid security guard ID or password." },
          { status: 401 }
        );
      }

      const token = await createSessionToken({
        sub: isAdminMatch ? ADMIN_CREDENTIALS.email : GUARD_CREDENTIALS.username,
        role: isAdminMatch ? "ADMIN" : "GUARD",
        gate: gate || "gate-main",
      });

      const res = NextResponse.json({
        success: true,
        role: isAdminMatch ? "ADMIN" : "GUARD",
        user: isAdminMatch ? ADMIN_CREDENTIALS.email : GUARD_CREDENTIALS.username,
        gate: gate || "gate-main",
      });

      res.cookies.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return res;
    }

    return NextResponse.json({ error: "Invalid login role." }, { status: 400 });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Authentication failed." }, { status: 500 });
  }
}
