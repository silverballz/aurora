import { NextResponse } from "next/server";
import { memoryStore } from "@/lib/data/store";

export async function GET() {
  const logs = [...memoryStore.auditLogs].reverse();
  return NextResponse.json({ logs });
}
