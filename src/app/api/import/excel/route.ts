import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Use Uint8Array to avoid Buffer<ArrayBuffer> type mismatch with ExcelJS
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const workbook = new ExcelJS.Workbook();

    if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      // eslint-disable-next-line
      await workbook.xlsx.load(uint8Array as any);
    } else {
      return NextResponse.json({ error: "Only .xlsx files are supported" }, { status: 400 });
    }

    const sheet = workbook.worksheets[0];
    if (!sheet) {
      return NextResponse.json({ error: "No worksheets found in file" }, { status: 400 });
    }

    // Extract headers from row 1
    const headers: string[] = [];
    sheet.getRow(1).eachCell((cell, colIndex) => {
      headers[colIndex - 1] = cell.text.toLowerCase().replace(/[^a-z0-9]/g, "");
    });

    // Map spreadsheet column keys → Prisma Applicant field names
    const FIELD_MAP: Record<string, string> = {
      firstname: "firstName",
      fathersname: "fatherName",
      fathername: "fatherName",
      grandfathersname: "grandfatherName",
      grandfathername: "grandfatherName",
      lastname: "lastName",
      gender: "gender",
      dateofbirth: "dateOfBirth",
      placeofbirth: "placeOfBirth",
      nationality: "nationality",
      religion: "religion",
      maritalstatus: "maritalStatus",
      educationlevel: "educationLevel",
      passportnumber: "passportNumber",
      dateofissue: "dateOfIssue",
      dateofexpiry: "dateOfExpiry",
      placeofissue: "placeOfIssue",
      heightcm: "height",
      weightkg: "weight",
      workposition: "workPosition",
      jobtitle: "workPosition",
      arabiclevel: "arabicLevel",
      englishlevel: "englishLevel",
      experienceyrs: "experienceYears",
      experienceyears: "experienceYears",
      monthlysalary: "monthlySalary",
      expectedsalary: "monthlySalary",
      phone: "phone",
      emergencycontact: "emergencyContact",
    };

    const results = { imported: 0, skipped: 0, errors: [] as string[] };
    const rowsToProcess: any[] = [];

    sheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) return; // skip header

      const record: any = { agencyId: session.user.agencyId };

      row.eachCell((cell, colIndex) => {
        const headerKey = headers[colIndex - 1];
        const fieldName = FIELD_MAP[headerKey];
        if (fieldName) {
          let value: any = cell.text?.trim() || null;

          // Parse dates
          if (fieldName.startsWith("dateOf") && value) {
            const parsed = new Date(value);
            if (!isNaN(parsed.getTime())) value = parsed;
            else value = null;
          }

          // Parse floats
          if (["height", "weight", "monthlySalary"].includes(fieldName)) {
            const num = parseFloat(String(value || ""));
            record[fieldName] = isNaN(num) ? null : num;
          // Parse integers
          } else if (["experienceYears"].includes(fieldName)) {
            const num = parseInt(String(value || ""), 10);
            record[fieldName] = isNaN(num) ? 0 : num;
          } else {
            record[fieldName] = value;
          }
        }
      });

      if (record.passportNumber) {
        rowsToProcess.push(record);
      }
    });

    // Upsert in batches using agencyId + passportNumber composite key
    for (const record of rowsToProcess) {
      try {
        await prisma.applicant.upsert({
          where: {
            agencyId_passportNumber: {
              agencyId: session.user.agencyId,
              passportNumber: record.passportNumber,
            },
          },
          create: {
            ...record,
            status: "REGISTERED",
            customFields: {},
          },
          update: {
            ...record,
          },
        });
        results.imported++;
      } catch (e: any) {
        results.skipped++;
        results.errors.push(`Row ${record.passportNumber}: ${e.message}`);
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Import error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
