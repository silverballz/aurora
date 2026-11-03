import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Check-in is permanently closed. Fest has concluded. Only check-out (exit) is allowed.",
      message: "Check-in is permanently closed. Fest has concluded. Only check-out (exit) is allowed.",
    },
    { status: 403 }
  );
}
