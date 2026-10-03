import { NextResponse } from "next/server";
import { memoryStore } from "@/lib/data/store";

export async function GET() {
  const events = Array.from(memoryStore.events.values()).filter((e) => e.status === "ACTIVE");
  return NextResponse.json({ events });
}
