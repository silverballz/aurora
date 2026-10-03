import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { memoryStore } from "@/lib/data/store";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("aurora_session");

    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const sessionData = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString("utf-8"));
    const user = memoryStore.users.get(sessionData.userId);

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Also look up participant record if exists
    let participant = null;
    for (const p of memoryStore.participants.values()) {
      if (p.email.toLowerCase() === user.email.toLowerCase() || p.user_id === user.id) {
        participant = p;
        break;
      }
    }

    return NextResponse.json({
      authenticated: true,
      user,
      participant,
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
