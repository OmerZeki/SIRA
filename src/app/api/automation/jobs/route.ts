import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      prisma.automationJob.findMany({
        where: { agencyId: session.user.agencyId },
        skip,
        take: limit,
        orderBy: { enqueuedAt: "desc" },
        include: {
          applicant: {
            select: {
              firstName: true,
              lastName: true,
              passportNumber: true,
            },
          },
        },
      }),
      prisma.automationJob.count({
        where: { agencyId: session.user.agencyId },
      }),
    ]);

    const mappedJobs = jobs.map((job) => ({
      ...job,
      platform:
        typeof (job.resultData as Record<string, unknown> | null)?.portalName === "string"
          ? ((job.resultData as Record<string, unknown>).portalName as string)
          : job.jobType,
    }));

    return NextResponse.json({
      jobs: mappedJobs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
