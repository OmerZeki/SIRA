import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runLmisWorker } from "@/workers/lmis.worker";
import { runMusanedWorker } from "@/workers/musaned.worker";

export const runtime = "nodejs";
export const maxDuration = 300;

function isAuthorized(secret: string | null) {
  const expected = process.env.WORKER_WEBHOOK_SECRET;
  return Boolean(expected && secret && secret === expected);
}

export async function POST(
  req: Request,
  { params }: { params: { worker: string } }
) {
  try {
    if (!isAuthorized(req.headers.get("x-sira-worker-secret"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId, applicantId, platform } = await req.json();
    if (!jobId || !applicantId || !platform) {
      return NextResponse.json({ error: "jobId, applicantId, and platform are required." }, { status: 400 });
    }

    const job = await prisma.automationJob.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        resultData: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Automation job not found." }, { status: 404 });
    }

    if (params.worker === "ethiopian_lmis" && platform === "ethiopian_lmis") {
      await runLmisWorker({ jobId, applicantId } as any);
      return NextResponse.json({ success: true });
    }

    if (
      (params.worker === "guided-session" || params.worker === "tawtheeq_musaned") &&
      platform === "tawtheeq_musaned"
    ) {
      await runMusanedWorker({ jobId, applicantId } as any);
      return NextResponse.json({ success: true });
    }

    await prisma.automationJob.update({
      where: { id: jobId },
      data: {
        status: "MANUAL_REQUIRED",
        resultData: {
          ...(job.resultData as Record<string, unknown> | null),
          portalId: platform,
          dispatchMode: "operator_packet",
        },
        errorMessage: "This portal currently requires a guided operator session.",
      },
    });

    return NextResponse.json({
      success: true,
      manualRequired: true,
    });
  } catch (error: any) {
    console.error("Worker dispatch error:", error);
    return NextResponse.json({ error: error.message || "Worker dispatch failed." }, { status: 500 });
  }
}
