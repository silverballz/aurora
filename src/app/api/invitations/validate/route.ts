import { NextResponse } from "next/server";
import { memoryStore } from "@/lib/data/store";
import { hashToken } from "@/lib/crypto/tokens";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        {
          valid: false,
          error: "Invitation unavailable. This registration invitation is invalid, expired, or has already been used. Please contact Kaltarang administration.",
        },
        { status: 400 }
      );
    }

    const tokenHash = hashToken(token.trim());

    // Search for invitation with matching token hash
    let invitation = null;
    for (const inv of memoryStore.invitations.values()) {
      if (inv.token_hash === tokenHash) {
        invitation = inv;
        break;
      }
    }

    if (!invitation) {
      return NextResponse.json(
        {
          valid: false,
          error: "Invitation unavailable. This registration invitation is invalid, expired, or has already been used. Please contact Kaltarang administration.",
        },
        { status: 404 }
      );
    }

    // Check status
    if (invitation.status === "REVOKED") {
      return NextResponse.json(
        {
          valid: false,
          error: "Invitation unavailable. This registration invitation has been revoked by fest administration.",
        },
        { status: 403 }
      );
    }

    if (invitation.status === "USED") {
      return NextResponse.json(
        {
          valid: false,
          error: "This registration invitation has already been redeemed. Please sign in directly to your participant account.",
        },
        { status: 409 }
      );
    }

    // Check expiration
    if (new Date() > new Date(invitation.expires_at)) {
      invitation.status = "EXPIRED";
      return NextResponse.json(
        {
          valid: false,
          error: "Invitation unavailable. This registration invitation has expired. Please contact Kaltarang administration.",
        },
        { status: 410 }
      );
    }

    // Mask email for display: a***@gmail.com
    const emailParts = invitation.email.split("@");
    const maskedEmail = `${emailParts[0].charAt(0)}***@${emailParts[1]}`;

    return NextResponse.json({
      valid: true,
      invitation: {
        id: invitation.id,
        participantName: invitation.participant_name,
        email: invitation.email,
        maskedEmail,
        mobile: invitation.mobile,
        paymentReference: invitation.payment_reference,
        paymentDate: invitation.payment_date,
        expiresAt: invitation.expires_at,
      },
    });
  } catch (error) {
    console.error("Token validation error:", error);
    return NextResponse.json(
      {
        valid: false,
        error: "Something went wrong verifying the invitation. Reference: AUR-" + Math.floor(10000 + Math.random() * 90000),
      },
      { status: 500 }
    );
  }
}
