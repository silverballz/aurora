import { NextResponse } from "next/server";
import {
  GUARD_CREDENTIALS,
  SESSION_COOKIE_NAME,
  createSessionToken,
  isValidAdminOrCohead,
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
      if (!isValidAdminOrCohead(cleanId, cleanPass)) {
        return NextResponse.json(
          { error: "Invalid administrator or Technical Co-Head credentials." },
          { status: 401 }
        );
      }

      const token = await createSessionToken({
        sub: cleanId,
        role: "ADMIN",
        gate: "gate-main",
      });

      const res = NextResponse.json({
        success: true,
        role: "ADMIN",
        user: cleanId,
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

      const isAdminOrCoheadMatch = isValidAdminOrCohead(cleanId, cleanPass);

      if (!isGuardMatch && !isAdminOrCoheadMatch) {
        return NextResponse.json(
          { error: "Invalid security guard or Co-Head credentials." },
          { status: 401 }
        );
      }

      const assignedRole = isAdminOrCoheadMatch ? "ADMIN" : "GUARD";
      const assignedSub = isAdminOrCoheadMatch ? cleanId : GUARD_CREDENTIALS.username;

      const token = await createSessionToken({
        sub: assignedSub,
        role: assignedRole,
        gate: gate || "gate-main",
      });

      const res = NextResponse.json({
        success: true,
        role: assignedRole,
        user: assignedSub,
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
