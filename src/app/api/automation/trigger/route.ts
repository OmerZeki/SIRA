import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPortalDefinition } from "@/lib/portals";
import { hasPortalCredentialsConfigured } from "@/lib/portal-credentials";
import { buildCandidatePacket, buildMofaFieldOrderPacket } from "@/lib/candidate-packet";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { applicantId, platform } = await req.json();

    if (!applicantId || !platform) {
      return NextResponse.json({ error: "applicantId and platform are required." }, { status: 400 });
    }

    const portal = getPortalDefinition(platform);
    if (!portal) {
      return NextResponse.json({ error: "Unsupported portal platform." }, { status: 400 });
    }

    const applicant = await prisma.applicant.findFirst({
      where: { id: applicantId, agencyId: session.user.agencyId },
    });

    if (!applicant) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const agency = await prisma.agency.findUnique({
      where: { id: session.user.agencyId },
      select: {
        lmisCredentials: true,
        musanedSroCredentials: true,
        easyEnjazCredentials: true,
        mofaCredentials: true,
        wafidCredentials: true,
        tasheerCredentials: true,
      },
    });

    if (portal.requiresCredentials && !hasPortalCredentialsConfigured(agency, portal.id)) {
      return NextResponse.json(
        { error: `Portal credentials are required for ${portal.name}. Configure them in Portal Vault first.` },
        { status: 400 }
      );
    }

    const job = await prisma.automationJob.create({
      data: {
        applicantId,
        agencyId: session.user.agencyId,
        jobType: portal.jobType,
        status: portal.automationTier === "COPY_PASTE_HELPER" ? "MANUAL_REQUIRED" : "PENDING",
        resultData: {
          portalId: portal.id,
          portalName: portal.name,
          url: portal.url,
          automationTier: portal.automationTier,
          supportedActions: portal.supportedActions,
          fallback: portal.fallback,
          candidatePacket: buildCandidatePacket(applicant),
          copyPastePacket: portal.id === "mofa" ? buildMofaFieldOrderPacket(applicant) : undefined,
        },
      },
    });

    const qstashToken = process.env.QSTASH_TOKEN;
    const workerUrl = process.env.WORKER_URL;

    if (portal.automationTier !== "COPY_PASTE_HELPER" && qstashToken && workerUrl) {
      const workerPath = portal.automationTier === "FULL_BACKGROUND" ? portal.id : "guided-session";
      const qstashRes = await fetch(
        `https://qstash.upstash.io/v2/publish/${workerUrl}/api/workers/${workerPath}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${qstashToken}`,
            "Content-Type": "application/json",
            "Upstash-Retries": "3",
            "Upstash-Delay": "1s",
            "Upstash-Forward-x-sira-worker-secret": process.env.WORKER_WEBHOOK_SECRET || "",
          },
          body: JSON.stringify({ jobId: job.id, applicantId, platform: portal.id }),
        }
      );

      if (!qstashRes.ok) {
        console.warn("QStash enqueue failed, job remains in operator queue:", await qstashRes.text());
      }
    } else {
      console.log("QStash not configured or manual portal selected; job created for operator follow-up.");
    }

    return NextResponse.json({ success: true, jobId: job.id, portal });
  } catch (error: any) {
    console.error("Automation trigger error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
