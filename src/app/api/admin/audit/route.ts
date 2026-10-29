import { NextResponse } from "next/server";
import { memoryStore, loadStoreFromDisk } from "@/lib/data/store";

export const dynamic = "force-dynamic";

export async function GET() {
  await loadStoreFromDisk();
  const logs = [...memoryStore.auditLogs].reverse();
  return NextResponse.json({ logs });
}
