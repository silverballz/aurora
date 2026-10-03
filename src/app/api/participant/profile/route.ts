import { NextResponse } from "next/server";
import { memoryStore } from "@/lib/data/store";
import { cookies } from "next/headers";
import { Participant } from "@/lib/types/database";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let email = body.email;

    try {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get("aurora_session");
      if (sessionCookie) {
        const session = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString("utf-8"));
        email = session.email;
      }
    } catch {
      // In standalone test environments, fallback to body.email
    }

    if (!email) {
      return NextResponse.json({ error: "Unauthorized session or missing email." }, { status: 401 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find participant
    let participant: Participant | null = null;
    for (const p of memoryStore.participants.values()) {
      if (p.email.toLowerCase() === normalizedEmail) {
        participant = p;
        break;
      }
    }

    if (!participant) {
      // Create new participant record linked to invitation if exists
      const pId = `part-${Date.now()}`;
      participant = {
        id: pId,
        user_id: null,
        invitation_id: null,
        registration_id: null,
        full_name: body.full_name || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        mobile: body.mobile || "",
        college: null,
        course: null,
        year_of_study: null,
        address: null,
        city: null,
        state: null,
        pincode: null,
        selfie_path: null,
        status: "IN_PROGRESS",
        campus_status: "OUTSIDE",
        correction_reason: null,
        rejection_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        submitted_at: null,
        approved_at: null,
        approved_by: null,
      };
      memoryStore.participants.set(pId, participant);
    }

    // Do not allow participants to silently modify approved identity information
    if (participant.status === "APPROVED") {
      return NextResponse.json(
        { error: "Approved registrations cannot be modified directly. Please submit a Profile Correction Request." },
        { status: 403 }
      );
    }

    // Update allowable fields
    if (body.college !== undefined) participant.college = body.college;
    if (body.course !== undefined) participant.course = body.course;
    if (body.year_of_study !== undefined) participant.year_of_study = body.year_of_study;
    if (body.address !== undefined) participant.address = body.address;
    if (body.city !== undefined) participant.city = body.city;
    if (body.state !== undefined) participant.state = body.state;
    if (body.pincode !== undefined) participant.pincode = body.pincode;
    if (body.selfie_path !== undefined) participant.selfie_path = body.selfie_path;

    if (participant.status === "INVITED") {
      participant.status = "IN_PROGRESS";
    }

    participant.updated_at = new Date().toISOString();

    return NextResponse.json({
      success: true,
      participant,
    });
  } catch (error) {
    console.error("Profile save error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
