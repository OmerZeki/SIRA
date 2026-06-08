import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const applicants = await prisma.applicant.findMany({
      where: { agencyId: session.user.agencyId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        passportNumber: true,
        status: true,
        dateOfExpiry: true,
        passportPhotoUrl: true,
        nationality: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Group by status for kanban
    const grouped: Record<string, typeof applicants> = {};
    for (const a of applicants) {
      if (!grouped[a.status]) grouped[a.status] = [];
      grouped[a.status].push(a);
    }

    return NextResponse.json({ applicants, grouped });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
