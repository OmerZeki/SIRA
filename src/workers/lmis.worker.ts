/**
 * SIRA — LMIS Playwright Worker
 * ==============================
 * Automates data submission to the Ethiopian Labour Market Information System.
 * This worker is invoked by the QStash queue or can be run directly as a Node.js script.
 *
 * Usage (standalone):
 *   node -r ts-node/register src/workers/lmis.worker.ts <jobId>
 *
 * Environment variables required:
 *   DATABASE_URL, LMIS_USERNAME, LMIS_PASSWORD, LMIS_BASE_URL
 */

import { chromium as playwright, type Browser, type Page } from "playwright-core";
import chromium from "@sparticuz/chromium";
import { PrismaClient, type AutomationStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { decrypt } from "../lib/encrypt";

function createWorkerPrisma() {
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL ||
      "postgresql://postgres:postgres@localhost:5432/sira?schema=public",
  });
  const adapter = new PrismaPg(pool);
  // @ts-ignore – Prisma v7 adapter overload
  return new PrismaClient({ adapter });
}

const prisma = createWorkerPrisma();

const LMIS_BASE_URL = process.env.LMIS_BASE_URL || "https://lmis.gov.et";

function readCredentialRecord(raw: string | null | undefined) {
  if (!raw) {
    return { username: "", password: "" };
  }

  const decrypted = JSON.parse(decrypt(raw));
  return {
    username: decrypted.username || "",
    password: decrypted.password || "",
  };
}

interface LmisJobPayload {
  jobId: string;
  applicantId: string;
  firstName: string;
  lastName: string;
  fatherName?: string;
  grandfatherName?: string;
  passportNumber: string;
  dateOfBirth?: Date | string;
  nationality?: string;
  gender?: string;
  workPosition?: string;
  agencyLicenseNumber?: string;
}

async function updateJobStatus(
  jobId: string,
  status: AutomationStatus,
  result?: any,
  errorMessage?: string
) {
  await prisma.automationJob.update({
    where: { id: jobId },
    data: {
      status,
      resultData: result || undefined,
      errorMessage: errorMessage || undefined,
      completedAt: ["COMPLETED", "FAILED"].includes(status) ? new Date() : undefined,
      startedAt: status === "PROCESSING" ? new Date() : undefined,
    },
  });
}

async function loginToLmis(page: Page, credentials: { username: string; password: string }, baseUrl: string): Promise<boolean> {
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded", timeout: 30_000 });
      await page.fill('input[name="username"], input[type="email"]', credentials.username);
      await page.fill('input[name="password"], input[type="password"]', credentials.password);
      await page.click('button[type="submit"], input[type="submit"]');

      // Wait for navigation to confirm login success
      await page.waitForURL(/dashboard|home|index/, { timeout: 15_000 });
      return true;
    } catch (e) {
      console.warn(`[LMIS] Login attempt ${attempt} failed:`, e);
      if (attempt === maxRetries) {
        console.error("[LMIS] Max login retries reached.");
        return false;
      }
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
  return false;
}

async function submitCandidateToLmis(page: Page, payload: LmisJobPayload, baseUrl: string): Promise<string> {
  // Navigate to candidate registration
  await page.goto(`${baseUrl}/candidates/register`, { waitUntil: "domcontentloaded", timeout: 30_000 });

  // Wait for form
  await page.waitForSelector('form, .candidate-form', { timeout: 15_000 });

  // Fill personal information
  const fillIfExists = async (selectors: string[], value: string) => {
    for (const sel of selectors) {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        await el.fill(value);
        return;
      }
    }
    console.warn(`[LMIS] Could not find field for value: ${value}`);
  };

  await fillIfExists(['input[name="firstName"]', '#firstName', '[data-field="firstName"]'], payload.firstName);
  await fillIfExists(['input[name="fatherName"]', '#fatherName', '[data-field="fatherName"]'], payload.fatherName || "");
  await fillIfExists(['input[name="grandfatherName"]', '#grandfatherName'], payload.grandfatherName || "");
  await fillIfExists(['input[name="passportNumber"]', '#passportNumber'], payload.passportNumber);

  if (payload.dateOfBirth) {
    const dob = new Date(payload.dateOfBirth);
    const dobStr = dob.toISOString().split("T")[0];
    await fillIfExists(['input[name="dateOfBirth"]', '#dateOfBirth', 'input[type="date"]'], dobStr);
  }

  if (payload.gender) {
    const genderSel = page.locator(`select[name="gender"], #gender`).first();
    if (await genderSel.isVisible().catch(() => false)) {
      await genderSel.selectOption({ label: payload.gender });
    }
  }

  if (payload.workPosition) {
    await fillIfExists(['input[name="workPosition"]', '#workPosition', 'select[name="workPosition"]'], payload.workPosition);
  }

  // Take a screenshot for verification
  await page.screenshot({ path: `/tmp/lmis_${payload.jobId}_filled.png` });

  // Submit the form
  const submitBtn = page.locator('button[type="submit"], .submit-btn, #submitBtn').first();
  await submitBtn.click();

  // Wait for success page or confirmation
  await page.waitForURL(/success|confirmation|complete/, { timeout: 20_000 });

  // Extract LMIS reference number if available
  const refText = await page.locator('.reference-number, .confirmation-id, #refNumber').textContent().catch(() => "");
  const refMatch = refText?.match(/([A-Z0-9]{8,})/);
  return refMatch ? refMatch[1] : `LMIS_${Date.now()}`;
}

export async function runLmisWorker(payload: LmisJobPayload): Promise<void> {
  const { jobId, applicantId } = payload;
  let browser: Browser | null = null;

  try {
    await updateJobStatus(jobId, "PROCESSING");

    // Fetch full applicant data
    const applicant = await prisma.applicant.findUnique({
      where: { id: applicantId },
      include: {
        agency: {
          select: {
            lmisCredentials: true,
          },
        },
      },
    });
    if (!applicant) throw new Error(`Applicant ${applicantId} not found`);

    const job = await prisma.automationJob.findUnique({
      where: { id: jobId },
      select: { resultData: true },
    });
    const resultData = (job?.resultData as Record<string, unknown> | null) ?? null;
    const credentials = readCredentialRecord(applicant.agency?.lmisCredentials);
    const baseUrl = typeof resultData?.url === "string" ? resultData.url : LMIS_BASE_URL;

    if (!credentials.username || !credentials.password) {
      throw new Error("LMIS portal credentials are missing for this agency.");
    }

    const fullPayload: LmisJobPayload = {
      ...payload,
      firstName: applicant.firstName,
      lastName: applicant.lastName || "",
      fatherName: applicant.fatherName || undefined,
      grandfatherName: applicant.grandfatherName || undefined,
      passportNumber: applicant.passportNumber,
      dateOfBirth: applicant.dateOfBirth || undefined,
      nationality: applicant.nationality || undefined,
      gender: applicant.gender || undefined,
      workPosition: applicant.workPosition || undefined,
    };

    // Launch browser
    browser = await playwright.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      // @ts-ignore
      headless: chromium.headless,
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 720 },
      locale: "en-US",
    });

    const page = await context.newPage();
    page.setDefaultTimeout(30_000);

    // Login
    const loggedIn = await loginToLmis(page, credentials, baseUrl);
    if (!loggedIn) throw new Error("Failed to authenticate with LMIS portal");

    // Submit candidate
    const referenceNumber = await submitCandidateToLmis(page, fullPayload, baseUrl);

    // Update applicant and job status
    await prisma.$transaction([
      prisma.applicant.update({
        where: { id: applicantId },
        data: {
          lmisStatus: "COMPLETED",
          lmisReferenceNumber: referenceNumber,
          status: "LMIS_CLEAR",
          statusHistory: {
            create: {
              fromStatus: applicant.status,
              toStatus: "LMIS_CLEAR",
              changedByName: "LMIS Automation",
              notes: `LMIS reference: ${referenceNumber}`,
            },
          },
        },
      }),
      prisma.automationJob.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          resultData: { referenceNumber },
        },
      }),
    ]);

    console.log(`[LMIS] ✅ Completed for applicant ${applicantId}. Ref: ${referenceNumber}`);
  } catch (error: any) {
    console.error(`[LMIS] ❌ Failed for job ${jobId}:`, error.message);
    await updateJobStatus(jobId, "FAILED", undefined, error.message);

    // Update applicant LMIS status
    if (applicantId) {
      await prisma.applicant.update({
        where: { id: applicantId },
        data: { lmisStatus: "FAILED" },
      }).catch(() => {});
    }

    throw error;
  } finally {
    if (browser) await browser.close();
    await prisma.$disconnect();
  }
}

// Direct invocation support
if (require.main === module) {
  const jobId = process.argv[2];
  if (!jobId) {
    console.error("Usage: node lmis.worker.ts <jobId>");
    process.exit(1);
  }

  prisma.automationJob.findUnique({ where: { id: jobId } }).then((job) => {
    if (!job) {
      console.error(`Job ${jobId} not found`);
      process.exit(1);
    }
    return runLmisWorker({
      jobId: job.id,
      applicantId: job.applicantId,
    } as any);
  }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
