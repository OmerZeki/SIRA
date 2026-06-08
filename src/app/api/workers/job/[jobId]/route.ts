import { NextResponse } from "next/server";
import { verifyWorkerSecret } from "@/lib/worker-auth";
import { buildWorkerJobPayload } from "@/lib/worker-job";

/**
 * GET /api/workers/job/:jobId
 *
 * Direct API for the SIRA software robot. Returns everything required to run an
 * automation job: portal metadata, decrypted credentials, the candidate packet,
 * and machine-friendly field values. Authenticated with the static worker
 * secret header (`x-sira-worker-secret`).
 */
export async function GET(_req: Request, { params }: { params: { jobId: string } }) {
  try {
    if (!verifyWorkerSecret(_req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await buildWorkerJobPayload(params.jobId);
    if (!payload) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error("Worker job fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
