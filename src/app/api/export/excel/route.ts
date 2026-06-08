import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildCandidatePacket } from "@/lib/candidate-packet";
import ExcelJS from "exceljs";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { ids, status } = body;

    const where: any = { agencyId: session.user.agencyId };
    if (ids && Array.isArray(ids) && ids.length > 0) {
      where.id = { in: ids };
    } else if (status && typeof status === "string") {
      where.status = status;
    }

    const applicants = await prisma.applicant.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "SIRA Platform";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Candidates", {
      views: [{ state: "frozen", ySplit: 1 }],
    });

    // Define columns
    sheet.columns = [
      { header: "First Name", key: "firstName", width: 18 },
      { header: "First Name (Amharic)", key: "firstNameAmh", width: 20 },
      { header: "Father's Name", key: "fatherName", width: 18 },
      { header: "Grandfather's Name", key: "grandfatherName", width: 20 },
      { header: "Last Name", key: "lastName", width: 18 },
      { header: "Last Name (Amharic)", key: "lastNameAmh", width: 20 },
      { header: "Gender", key: "gender", width: 10 },
      { header: "Date of Birth", key: "dateOfBirth", width: 15 },
      { header: "Place of Birth", key: "placeOfBirth", width: 18 },
      { header: "Nationality", key: "nationality", width: 15 },
      { header: "Religion", key: "religion", width: 12 },
      { header: "Marital Status", key: "maritalStatus", width: 15 },
      { header: "Education Level", key: "educationLevel", width: 18 },
      { header: "Passport Number", key: "passportNumber", width: 18 },
      { header: "Date of Issue", key: "dateOfIssue", width: 15 },
      { header: "Date of Expiry", key: "dateOfExpiry", width: 15 },
      { header: "Place of Issue", key: "placeOfIssue", width: 18 },
      { header: "Height (cm)", key: "height", width: 12 },
      { header: "Weight (kg)", key: "weight", width: 12 },
      { header: "Work Position", key: "workPosition", width: 18 },
      { header: "Arabic Level", key: "arabicLevel", width: 14 },
      { header: "English Level", key: "englishLevel", width: 14 },
      { header: "Experience (yrs)", key: "experienceYears", width: 16 },
      { header: "Monthly Salary ($)", key: "monthlySalary", width: 18 },
      { header: "Status", key: "status", width: 20 },
      { header: "LMIS Status", key: "lmisStatus", width: 15 },
      { header: "LMIS Reference", key: "lmisReferenceNumber", width: 18 },
      { header: "Musaned Status", key: "musanedStatus", width: 16 },
      { header: "Musaned Contract", key: "musanedContractNumber", width: 18 },
      { header: "Enjaz Reference", key: "enjazReference", width: 18 },
      { header: "Visa Number", key: "visaNumber", width: 16 },
      { header: "Created At", key: "createdAt", width: 18 },
    ];

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.height = 28;
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF5E6AD2" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };

    // Add data rows
    for (const a of applicants) {
      const packet = buildCandidatePacket(a);
      const row = sheet.addRow({
        ...a,
        ...packet,
        createdAt: new Date(a.createdAt).toLocaleDateString("en-GB"),
        skillsList: undefined,
        customFields: undefined,
      });

      // Color expiring passports red
      if (a.dateOfExpiry) {
        const daysLeft = Math.round(
          (new Date(a.dateOfExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        if (daysLeft < 90) {
          const expiryCell = row.getCell("dateOfExpiry");
          expiryCell.font = { color: { argb: "FFE53935" }, bold: true };
        }
      }

      row.height = 20;
    }

    // Auto-filter
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: sheet.columns.length },
    };

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    const filename = `SIRA_Candidates_${new Date().toISOString().split("T")[0]}.xlsx`;

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": buffer.byteLength.toString(),
      },
    });
  } catch (error: any) {
    console.error("Excel export error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
