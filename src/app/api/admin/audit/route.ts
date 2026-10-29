import { NextResponse } from "next/server";
import { memoryStore, loadStoreFromDisk } from "@/lib/data/store";

export async function GET() {
  loadStoreFromDisk();
  const logs = [...memoryStore.auditLogs].reverse();
  return NextResponse.json({ logs });
}
