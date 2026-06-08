import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createApplicantSchema } from "@/lib/validators/applicant.schema";
import { ApplicantStatus, Gender, Prisma } from "@prisma/client";

function cleanEnumFields(data: any) {
  if (data.maritalStatus === "") data.maritalStatus = null;
  if (data.lmisStatus === "") data.lmisStatus = null;
  if (data.musanedStatus === "") data.musanedStatus = null;
  return data;
}

// GET /api/applicants — list with filters
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || undefined;
    const gender = searchParams.get("gender") || undefined;

    const skip = (page - 1) * limit;

    const where: Prisma.ApplicantWhereInput = {
      agencyId: session.user.agencyId,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { passportNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && Object.values(ApplicantStatus).includes(status as ApplicantStatus)) {
      where.status = status as ApplicantStatus;
    }
    if (gender && Object.values(Gender).includes(gender as Gender)) {
      where.gender = gender as Gender;
    }

    const [applicants, total] = await Promise.all([
      prisma.applicant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          passportNumber: true,
          gender: true,
          status: true,
          dateOfExpiry: true,
          passportPhotoUrl: true,
          lmisStatus: true,
          musanedStatus: true,
          nationality: true,
          createdAt: true,
        },
      }),
      prisma.applicant.count({ where }),
    ]);

    return NextResponse.json({
      applicants,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("GET /api/applicants error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/applicants — create
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawData = await req.json();
    cleanEnumFields(rawData);

    const result = createApplicantSchema.safeParse(rawData);
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.format() }, { status: 400 });
    }

    const createData: Prisma.ApplicantUncheckedCreateInput = {
      ...result.data,
      customFields: result.data.customFields as Prisma.InputJsonValue,
      agencyId: session.user.agencyId,
      statusHistory: {
        create: {
          toStatus: "REGISTERED",
          changedByName: session.user.name || "System",
          notes: "Candidate registered via SIRA",
        },
      },
    };

    const applicant = await prisma.applicant.create({
      data: {
        ...createData,
      },
    });

    return NextResponse.json(applicant, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/applicants error:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A candidate with this passport number already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
