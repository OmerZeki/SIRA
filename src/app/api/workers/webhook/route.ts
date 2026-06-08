import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { AutomationStatus } from "@prisma/client";

const VALID_STATUSES = new Set<AutomationStatus>([
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "MANUAL_REQUIRED",
]);

function isLmisJob(jobType: string) {
  return jobType.includes("LMIS");
}

function isMusanedJob(jobType: string) {
  return jobType.includes("MUSANED");
}

function verifyWorkerSignature(rawBody: string, signature: string | null) {
  const secret = process.env.WORKER_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("WORKER_WEBHOOK_SECRET is not configured");
  }

  if (!signature) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  const normalizedSignature = signature.replace(/^sha256=/, "");
  if (!/^[a-f0-9]{64}$/i.test(normalizedSignature)) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(normalizedSignature, "hex")
  );
}

/**
 * POST /api/workers/webhook
 * Called by Playwright workers (LMIS & Musaned) to report job status.
 * Requires an x-sira-worker-signature HMAC-SHA256 header.
 */
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-sira-worker-signature");

    if (!verifyWorkerSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const { jobId, applicantId, status, resultData, errorMessage } = body;

    if (!jobId || !applicantId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!VALID_STATUSES.has(status)) {
      return NextResponse.json({ error: "Invalid worker status" }, { status: 400 });
    }

    // Update the automation job
    const job = await prisma.automationJob.update({
      where: { id: jobId },
      data: {
        status,
        resultData: resultData || undefined,
        errorMessage: errorMessage || undefined,
        completedAt: status === "COMPLETED" || status === "FAILED" ? new Date() : undefined,
        startedAt: status === "PROCESSING" ? new Date() : undefined,
      },
    });

    // Update applicant status based on job type
    const applicantUpdateData: any = {};
    if (status === "COMPLETED") {
      if (isLmisJob(job.jobType)) {
        applicantUpdateData.lmisStatus = "COMPLETED";
        applicantUpdateData.lmisReferenceNumber = resultData?.referenceNumber || "";
        applicantUpdateData.status = "LMIS_CLEAR";
      } else if (isMusanedJob(job.jobType)) {
        applicantUpdateData.musanedStatus = "COMPLETED";
        applicantUpdateData.musanedContractNumber = resultData?.contractNumber || "";
        applicantUpdateData.status = "MUSANED_CONTRACTED";
      }
    } else if (status === "FAILED") {
      if (isLmisJob(job.jobType)) {
        applicantUpdateData.lmisStatus = "FAILED";
      } else if (isMusanedJob(job.jobType)) {
        applicantUpdateData.musanedStatus = "FAILED";
      }
    }

    const applicant = await prisma.applicant.update({
      where: { id: applicantId },
      data: applicantUpdateData,
    });

    // Send email notification to agency
    try {
      const agency = await prisma.agency.findUnique({
        where: { id: job.agencyId },
        select: { email: true, name: true },
      });

      if (agency?.email) {
        const platform = isLmisJob(job.jobType) ? "LMIS" : isMusanedJob(job.jobType) ? "Musaned" : "Portal";
        await sendEmail({
          to: agency.email,
          subject: `SIRA Automation — ${platform} ${status} for ${applicant.firstName} ${applicant.lastName}`,
          html: `<p>Hello,</p>
<p>The ${platform} automation for <strong>${applicant.firstName} ${applicant.lastName}</strong> has <strong>${status}</strong>.</p>
${errorMessage ? `<p>Error: ${errorMessage}</p>` : ""}
${resultData ? `<p>Details: ${JSON.stringify(resultData)}</p>` : ""}
<p>You can view the candidate in your <a href="${process.env.NEXT_PUBLIC_APP_URL}/candidates">SIRA dashboard</a>.</p>`,
        });
      }
    } catch (emailError) {
      console.error("Failed to send automation notification email:", emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Worker webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
