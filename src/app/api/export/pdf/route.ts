import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildCandidatePacket, candidatePacketFields } from "@/lib/candidate-packet";

function escapePdfText(value: string) {
  return value.replace(/[^\x20-\x7E]/g, "").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildSimplePdf(lines: string[]) {
  const pageLines = lines.slice(0, 44);
  const stream = [
    "BT",
    "/F1 11 Tf",
    "50 780 Td",
    ...pageLines.map((line, index) => `${index === 0 ? "" : "0 -16 Td"}(${escapePdfText(line)}) Tj`),
    "ET",
  ].join("\n");

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${Buffer.byteLength(stream)} >> stream\n${stream}\nendstream endobj`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${object}\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) {
    pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, "binary");
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

    const applicants = await prisma.applicant.findMany({ where, orderBy: { createdAt: "desc" }, take: 10 });
    const lines = ["SIRA Candidate Export", `Generated: ${new Date().toLocaleDateString("en-GB")}`, ""];
    for (const applicant of applicants) {
      const packet = buildCandidatePacket(applicant);
      lines.push(packet.fullName || applicant.passportNumber);
      for (const [label, key] of candidatePacketFields) {
        if (packet[key]) lines.push(`${label}: ${packet[key]}`);
      }
      lines.push("");
    }

    const buffer = buildSimplePdf(lines);
    const filename = `SIRA_Candidates_${new Date().toISOString().split("T")[0]}.pdf`;

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.byteLength.toString(),
      },
    });
  } catch (error: any) {
    console.error("PDF export error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

