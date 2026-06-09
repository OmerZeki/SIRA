import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateApplicantSchema } from "@/lib/validators/applicant.schema";
import { Prisma } from "@prisma/client";

function cleanEnumFields(data: any) {
  if (data.maritalStatus === "") data.maritalStatus = null;
  if (data.lmisStatus === "") data.lmisStatus = null;
  if (data.musanedStatus === "") data.musanedStatus = null;
  return data;
}

// GET /api/applicants/[id]
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const applicant = await prisma.applicant.findFirst({
      where: { id, agencyId: session.user.agencyId },
      include: {
        statusHistory: { orderBy: { timestamp: "desc" }, take: 20 },
        automationJobs: { orderBy: { enqueuedAt: "desc" }, take: 10 },
      },
    });

    if (!applicant) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    return NextResponse.json(applicant);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/applicants/[id]
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawData = await req.json();
    cleanEnumFields(rawData);

    const result = updateApplicantSchema.safeParse(rawData);
    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.format() }, { status: 400 });
    }

    // Fetch current applicant to check ownership + get old status
    const existing = await prisma.applicant.findFirst({
      where: { id, agencyId: session.user.agencyId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const data = result.data;
    const updateData: Prisma.ApplicantUpdateInput = {
      ...data,
      customFields: data.customFields as Prisma.InputJsonValue | undefined,
    };

    const updated = await prisma.applicant.update({
      where: { id },
      data: {
        ...updateData,
        // Create status history entry if status changed
        ...(data.status && data.status !== existing.status
          ? {
              statusHistory: {
                create: {
                  fromStatus: existing.status,
                  toStatus: data.status,
                  changedByName: session.user.name || "Agent",
                },
              },
            }
          : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/applicants/[id]
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.agencyId || !["OWNER", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.applicant.findFirst({
      where: { id, agencyId: session.user.agencyId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    await prisma.applicant.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
