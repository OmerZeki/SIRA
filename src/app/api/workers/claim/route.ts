import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWorkerSecret } from "@/lib/worker-auth";
import { buildWorkerJobPayload } from "@/lib/worker-job";
import { getPortalDefinition } from "@/lib/portals";

/**
 * POST /api/workers/claim
 *
 * Pull-based entry point for the SIRA software robot. Atomically claims the
 * oldest PENDING automation job (optionally filtered by portal), marks it as
 * PROCESSING, and returns its full execution payload. When no job is available
 * it responds with `{ job: null }` so the robot can keep polling.
 *
 * Body (all optional): { portalId?: string, jobType?: string }
 * Auth: `x-sira-worker-secret` header.
 */
export async function POST(req: Request) {
  try {
    if (!verifyWorkerSecret(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const portal = body?.portalId ? getPortalDefinition(String(body.portalId)) : null;
    const jobType: string | undefined = portal?.jobType ?? body?.jobType;

    const where = {
      status: "PENDING" as const,
      ...(jobType ? { jobType } : {}),
    };

    // Fetch a small batch and try to claim one atomically to avoid races
    // between multiple robot instances polling the same queue.
    const candidates = await prisma.automationJob.findMany({
      where,
      orderBy: { enqueuedAt: "asc" },
      take: 5,
      select: { id: true },
    });

    let claimedId: string | null = null;
    for (const candidate of candidates) {
      const result = await prisma.automationJob.updateMany({
        where: { id: candidate.id, status: "PENDING" },
        data: { status: "PROCESSING", startedAt: new Date(), attempts: { increment: 1 } },
      });
      if (result.count === 1) {
        claimedId = candidate.id;
        break;
      }
    }

    if (!claimedId) {
      return NextResponse.json({ job: null });
    }

    const payload = await buildWorkerJobPayload(claimedId);
    return NextResponse.json({ job: payload });
  } catch (error: any) {
    console.error("Worker claim error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
