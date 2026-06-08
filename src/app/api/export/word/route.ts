import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildCandidatePacket, candidatePacketFields } from "@/lib/candidate-packet";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ids, status } = await req.json();
    const where: any = { agencyId: session.user.agencyId };
    if (ids && Array.isArray(ids) && ids.length > 0) {
      where.id = { in: ids };
    } else if (status && typeof status === "string") {
      where.status = status;
    }

    const applicants = await prisma.applicant.findMany({ where, orderBy: { createdAt: "desc" } });
    const sections = applicants
      .map((applicant) => {
        const packet = buildCandidatePacket(applicant);
        const rows = candidatePacketFields
          .map(([label, key]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(packet[key])}</td></tr>`)
          .join("");
        return `<h2>${escapeHtml(packet.fullName || applicant.passportNumber)}</h2><table>${rows}</table>`;
      })
      .join("<br style='page-break-after:always' />");

    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      body{font-family:Arial,sans-serif;color:#111827}
      h1{font-size:22px} h2{font-size:18px;margin-top:24px}
      table{border-collapse:collapse;width:100%;margin-top:12px}
      th,td{border:1px solid #d1d5db;padding:7px 9px;font-size:11px;text-align:left}
      th{background:#eef2ff;width:34%}
    </style></head><body><h1>SIRA Candidate Export</h1>${sections}</body></html>`;

    const buffer = Buffer.from(html, "utf8");
    const filename = `SIRA_Candidates_${new Date().toISOString().split("T")[0]}.doc`;

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/msword; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.byteLength.toString(),
      },
    });
  } catch (error: any) {
    console.error("Word export error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

