import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      total,
      lmisPending,
      musanedPending,
      flightReady,
      expiringSoon,
      automationFailed,
    ] = await Promise.all([
      prisma.applicant.count({ where: { agencyId: session.user.agencyId } }),
      prisma.applicant.count({ where: { agencyId: session.user.agencyId, status: "MEDICAL_APPROVED" } }),
      prisma.applicant.count({ where: { agencyId: session.user.agencyId, status: "LMIS_CLEAR" } }),
      prisma.applicant.count({ where: { agencyId: session.user.agencyId, status: "FLIGHT_READY" } }),
      prisma.applicant.count({
        where: {
          agencyId: session.user.agencyId,
          dateOfExpiry: { lt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.automationJob.count({
        where: { agencyId: session.user.agencyId, status: "FAILED" },
      }),
    ]);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newThisMonth = await prisma.applicant.count({
      where: { agencyId: session.user.agencyId, createdAt: { gte: startOfMonth } },
    });

    return NextResponse.json({
      total,
      newThisMonth,
      lmisPending,
      musanedPending,
      flightReady,
      expiringSoon,
      automationFailed,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
