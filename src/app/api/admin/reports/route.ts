import { NextResponse } from "next/server";
import { memoryStore, loadStoreFromDisk } from "@/lib/data/store";

export const dynamic = "force-dynamic";

function resolveFullUrl(pathOrData: string | null | undefined, origin: string): string {
  if (!pathOrData) return "";
  if (pathOrData.startsWith("http://") || pathOrData.startsWith("https://") || pathOrData.startsWith("data:")) {
    return pathOrData;
  }
  return `${origin}${pathOrData.startsWith("/") ? "" : "/"}${pathOrData}`;
}

export async function GET(request: Request) {
  await loadStoreFromDisk();
  const reqUrl = new URL(request.url);
  const { searchParams } = reqUrl;
  const origin = reqUrl.origin;
  const type = searchParams.get("type") || "participants";

  const participants = Array.from(memoryStore.participants.values()).sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  // 1. Complete Export including Live Photo, Student ID & Aadhaar Image Links (CSV)
  if (type === "full_with_docs") {
    const headers = [
      "Registration ID",
      "Full Name",
      "College",
      "Mobile",
      "Email",
      "Status",
      "Campus Status",
      "Live Photo URL",
      "Student ID Photo URL",
      "Aadhaar Card Photo URL",
      "QR Pass URL",
      "Submitted At",
    ];
    const rows = participants.map((p) => [
      p.registration_id || "PENDING",
      `"${(p.full_name || "").replace(/"/g, '""')}"`,
      `"${(p.college || "").replace(/"/g, '""')}"`,
      `"${(p.mobile || "").replace(/"/g, '""')}"`,
      p.email,
      p.status,
      p.campus_status,
      `"${resolveFullUrl(p.selfie_path, origin)}"`,
      `"${resolveFullUrl(p.student_id_path, origin)}"`,
      `"${resolveFullUrl(p.aadhaar_path, origin)}"`,
      `"${p.registration_id ? `${origin}/api/qr?data=${encodeURIComponent(p.registration_id)}` : ""}"`,
      p.submitted_at || p.created_at,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="aurora_full_participants_with_aadhaar_studentid_${Date.now()}.csv"`,
      },
    });
  }

  // 2. Visual Dossier (All Participants + Live Photos + Student IDs + Aadhaar Images in Printable/Downloadable HTML)
  if (type === "visual_dossier") {
    const cardsHtml = participants
      .map((p, idx) => {
        const selfieUrl = resolveFullUrl(p.selfie_path || "/assets/participant-avatar.jpg", origin);
        const stuUrl = resolveFullUrl(p.student_id_path, origin);
        const aadUrl = resolveFullUrl(p.aadhaar_path, origin);
        return `
        <div class="card">
          <div class="card-header">
            <div>
              <span class="badge">${p.status}</span>
              <span class="badge-state">${p.campus_status}</span>
              <h2>#${idx + 1} · ${p.full_name} <span class="reg-id">(${p.registration_id || "PENDING"})</span></h2>
              <p class="meta"><strong>College:</strong> ${p.college || "—"} &nbsp;|&nbsp; <strong>Mobile:</strong> ${p.mobile || "—"} &nbsp;|&nbsp; <strong>Email:</strong> ${p.email}</p>
            </div>
          </div>
          <div class="photos-grid">
            <div class="photo-box">
              <div class="photo-label">1. Live Photo (Selfie)</div>
              <img src="${selfieUrl}" alt="Live Photo" />
              <a href="${selfieUrl}" target="_blank" download="${p.full_name}-LivePhoto.jpg">Open / Download Image</a>
            </div>
            <div class="photo-box">
              <div class="photo-label">2. College Student ID Card</div>
              ${
                stuUrl
                  ? `<img src="${stuUrl}" alt="Student ID" /><a href="${stuUrl}" target="_blank" download="${p.full_name}-StudentID.jpg">Open / Download Image</a>`
                  : `<div class="empty">No Student ID uploaded</div>`
              }
            </div>
            <div class="photo-box">
              <div class="photo-label">3. Government ID (Aadhaar Card)</div>
              ${
                aadUrl
                  ? `<img src="${aadUrl}" alt="Aadhaar Card" /><a href="${aadUrl}" target="_blank" download="${p.full_name}-Aadhaar.jpg">Open / Download Image</a>`
                  : `<div class="empty">No Aadhaar uploaded</div>`
              }
            </div>
          </div>
        </div>`;
      })
      .join("\n");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Aurora Kaltarang 2026 — Complete Visual Archive (Live Photos, Student IDs & Aadhaar Cards)</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 24px; background: #f8f7fa; color: #18151c; }
    .top-bar { max-width: 1150px; margin: 0 auto 24px; background: #1e162b; color: #fff; padding: 20px 24px; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
    .top-bar h1 { margin: 0; font-size: 20px; }
    .top-bar p { margin: 4px 0 0; font-size: 12px; color: #cbbce0; }
    .btn { background: #b82885; color: #fff; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 13px; text-decoration: none; }
    .container { max-width: 1150px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
    .card { background: #fff; border: 1px solid #e2dce8; border-radius: 12px; padding: 20px; page-break-inside: avoid; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .card-header h2 { margin: 6px 0 4px; font-size: 18px; }
    .reg-id { color: #b82885; font-family: monospace; }
    .meta { margin: 0; font-size: 13px; color: #575060; }
    .badge { display: inline-block; background: #e8f8ef; color: #137a43; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 99px; text-transform: uppercase; }
    .badge-state { display: inline-block; background: #f3eff7; color: #4c3b63; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 99px; text-transform: uppercase; margin-left: 6px; }
    .photos-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 16px; }
    .photo-box { border: 1px solid #e8e3ee; border-radius: 8px; padding: 10px; background: #fcfbfd; text-align: center; display: flex; flex-direction: column; justify-content: space-between; }
    .photo-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #6a6275; margin-bottom: 8px; }
    .photo-box img { width: 100%; height: 210px; object-fit: contain; background: #f0edf4; border-radius: 6px; }
    .photo-box a { display: inline-block; margin-top: 8px; font-size: 11px; color: #b82885; font-weight: 600; text-decoration: none; }
    .empty { height: 210px; display: grid; place-items: center; color: #9a92a6; font-size: 12px; background: #f4f1f8; border-radius: 6px; }
    @media print { .no-print { display: none !important; } body { background: #fff; padding: 0; } }
  </style>
</head>
<body>
  <div class="top-bar">
    <div>
      <h1>Kaltarang 2026 (RGIPT) — Complete Participant Photo, Student ID &amp; Aadhaar Archive</h1>
      <p>Total Participants: ${participants.length} · Generated on ${new Date().toLocaleString("en-IN")}</p>
    </div>
    <div class="no-print" style="display:flex;gap:10px;">
      <button class="btn" onclick="window.print()">Print / Save as PDF</button>
    </div>
  </div>
  <div class="container">
    ${cardsHtml || "<p>No participants registered yet.</p>"}
  </div>
</body>
</html>`;

    const isDownload = searchParams.get("download") === "1";
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        ...(isDownload
          ? {
              "Content-Disposition": `attachment; filename="aurora_complete_visual_archive_${Date.now()}.html"`,
            }
          : {}),
      },
    });
  }

  // 3. Full Raw JSON Database Backup
  if (type === "json_backup") {
    const dump = {
      exportedAt: new Date().toISOString(),
      registrationCounter: memoryStore.registrationCounter,
      totalParticipants: participants.length,
      participants,
      documents: Array.from(memoryStore.documents.values()),
      accessLogs: memoryStore.accessLogs,
      auditLogs: memoryStore.auditLogs,
    };
    return new NextResponse(JSON.stringify(dump, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="aurora_database_backup_${Date.now()}.json"`,
      },
    });
  }

  // 4. Standard Participant CSV (without Aadhaar)
  if (type === "participants") {
    const headers = [
      "Registration ID",
      "Full Name",
      "College",
      "Email",
      "Mobile",
      "Campus Status",
      "Status",
    ];
    const rows = participants.map((p) => [
      p.registration_id || "PENDING",
      `"${p.full_name.replace(/"/g, '""')}"`,
      `"${(p.college || "").replace(/"/g, '""')}"`,
      p.email,
      p.mobile,
      p.campus_status,
      p.status,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="aurora_participants_${Date.now()}.csv"`,
      },
    });
  }

  // 5. Gate Access Logs CSV
  if (type === "access_logs") {
    const headers = [
      "Time",
      "Date",
      "Registration ID",
      "Participant Name",
      "Gate",
      "Action",
      "Result",
      "Notes",
    ];
    const rows = memoryStore.accessLogs.map((log) => {
      const p = memoryStore.participants.get(log.participant_id);
      const gate = memoryStore.gates.get(log.gate_id || "");
      const d = new Date(log.timestamp);
      return [
        d.toLocaleTimeString("en-IN"),
        d.toLocaleDateString("en-IN"),
        log.registration_id,
        `"${(p?.full_name || "Unknown").replace(/"/g, '""')}"`,
        `"${(gate?.name || "RGIPT Main Gate").replace(/"/g, '""')}"`,
        log.action,
        log.result,
        `"${(log.notes || "").replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="aurora_access_logs_${Date.now()}.csv"`,
      },
    });
  }

  return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
}
