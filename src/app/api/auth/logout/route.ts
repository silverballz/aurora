import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  response.cookies.delete(SESSION_COOKIE_NAME);
  response.cookies.delete("aurora-role");
  response.cookies.delete("aurora-user-email");

  return response;
}
