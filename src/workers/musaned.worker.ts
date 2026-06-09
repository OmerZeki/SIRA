/**
 * SIRA — Musaned Playwright Worker
 * ==================================
 * Automates domestic worker contract submission on the Saudi Musaned portal.
 * Uses Playwright headless browser to fill the Musaned registration form.
 *
 * Portal: https://musaned.com.sa
 *
 * Environment variables required:
 *   DATABASE_URL, MUSANED_USERNAME, MUSANED_PASSWORD
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

const MUSANED_URL = "https://musaned.com.sa";

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

interface MusanedPayload {
  jobId: string;
  applicantId: string;
  firstName: string;
  lastName: string;
  fatherName?: string;
  grandfatherName?: string;
  passportNumber: string;
  dateOfBirth?: Date | string;
  dateOfExpiry?: Date | string;
  nationality?: string;
  gender?: string;
  workPosition?: string;
  religion?: string;
}

async function updateJobStatus(jobId: string, status: AutomationStatus, result?: any, errorMessage?: string) {
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

async function loginToMusaned(page: Page, credentials: { username: string; password: string }): Promise<boolean> {
  try {
    await page.goto(`${MUSANED_URL}/login`, { waitUntil: "domcontentloaded", timeout: 30_000 });

    // Handle potential cookie consent dialogs
    const cookieBtn = page.locator('button:has-text("Accept"), .accept-cookies').first();
    if (await cookieBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cookieBtn.click();
    }

    await page.fill('input[name="username"], input[type="text"]:visible', credentials.username);
    await page.fill('input[name="password"], input[type="password"]:visible', credentials.password);
    await page.click('button[type="submit"]:visible');

    await page.waitForURL(/dashboard|home/, { timeout: 20_000 });
    return true;
  } catch (e) {
    console.error("[Musaned] Login failed:", e);
    return false;
  }
}

async function submitToMusaned(page: Page, payload: MusanedPayload): Promise<string> {
  // Navigate to new worker registration
  await page.goto(`${MUSANED_URL}/domestic-worker/new`, { waitUntil: "domcontentloaded", timeout: 30_000 });

  await page.waitForSelector('form, .registration-form', { timeout: 15_000 });

  const fillIfExists = async (selectors: string[], value: string) => {
    for (const sel of selectors) {
      try {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 2000 })) {
          await el.fill(value);
          return;
        }
      } catch {}
    }
    console.warn(`[Musaned] Could not fill selector for value: ${value.substring(0, 30)}`);
  };

  const selectIfExists = async (selectors: string[], value: string) => {
    for (const sel of selectors) {
      try {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 2000 })) {
          await el.selectOption(value);
          return;
        }
      } catch {}
    }
  };

  // Step 1: Worker Details
  await fillIfExists(['#workerFirstName', 'input[name="firstName"]'], payload.firstName);
  await fillIfExists(['#workerFatherName', 'input[name="fatherName"]'], payload.fatherName || "");
  await fillIfExists(['#workerGrandfatherName', 'input[name="grandfatherName"]'], payload.grandfatherName || "");
  await fillIfExists(['#workerLastName', 'input[name="lastName"]'], payload.lastName);

  if (payload.dateOfBirth) {
    const dob = new Date(payload.dateOfBirth).toISOString().split("T")[0];
    await fillIfExists(['input[name="dateOfBirth"]', '#workerDOB', '#dateOfBirth'], dob);
  }

  // Passport fields
  await fillIfExists(['#passportNumber', 'input[name="passportNo"]'], payload.passportNumber);

  if (payload.dateOfExpiry) {
    const doe = new Date(payload.dateOfExpiry).toISOString().split("T")[0];
    await fillIfExists(['input[name="passportExpiry"]', '#passportExpiry'], doe);
  }

  // Select nationality
  if (payload.nationality) {
    await selectIfExists(['select[name="nationality"]', '#nationality'], payload.nationality);
  }

  // Religion
  if (payload.religion) {
    await selectIfExists(['select[name="religion"]', '#religion'], payload.religion);
  }

  // Work position / occupation
  if (payload.workPosition) {
    await selectIfExists(
      ['select[name="occupation"]', '#occupation', 'select[name="workPosition"]'],
      payload.workPosition
    );
  }

  // Screenshot before submit
  await page.screenshot({ path: `/tmp/musaned_${payload.jobId}_filled.png` });

  // Next / Submit
  const nextBtn = page.locator('button:has-text("Next"), button[type="submit"], .btn-next').first();
  await nextBtn.click();

  // Wait for confirmation
  await page.waitForSelector('.confirmation, .success-message, #contractNumber', { timeout: 20_000 });

  const contractEl = page.locator('.contract-number, #contractNumber, .reference-id').first();
  const contractNumber = await contractEl.textContent().catch(() => `MSN_${Date.now()}`);

  return contractNumber?.trim() || `MSN_${Date.now()}`;
}

export async function runMusanedWorker(payload: MusanedPayload): Promise<void> {
  const { jobId, applicantId } = payload;
  let browser: Browser | null = null;

  try {
    await updateJobStatus(jobId, "PROCESSING");

    const applicant = await prisma.applicant.findUnique({
      where: { id: applicantId },
      include: {
        agency: {
          select: {
            musanedSroCredentials: true,
          },
        },
      },
    });
    if (!applicant) throw new Error(`Applicant ${applicantId} not found`);

    const credentials = readCredentialRecord(applicant.agency?.musanedSroCredentials);
    if (!credentials.username || !credentials.password) {
      throw new Error("Musaned portal credentials are missing for this agency.");
    }

    const fullPayload: MusanedPayload = {
      ...payload,
      firstName: applicant.firstName,
      lastName: applicant.lastName || "",
      fatherName: applicant.fatherName || undefined,
      grandfatherName: applicant.grandfatherName || undefined,
      passportNumber: applicant.passportNumber,
      dateOfBirth: applicant.dateOfBirth || undefined,
      dateOfExpiry: applicant.dateOfExpiry || undefined,
      nationality: applicant.nationality || undefined,
      gender: applicant.gender || undefined,
      workPosition: applicant.workPosition || undefined,
      religion: applicant.religion || undefined,
    };

    browser = await playwright.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      // @ts-ignore
      headless: chromium.headless,
    });

    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1366, height: 768 },
      locale: "ar-SA",
    });

    const page = await context.newPage();
    page.setDefaultTimeout(30_000);

    const loggedIn = await loginToMusaned(page, credentials);
    if (!loggedIn) throw new Error("Failed to authenticate with Musaned portal");

    const contractNumber = await submitToMusaned(page, fullPayload);

    await prisma.$transaction([
      prisma.applicant.update({
        where: { id: applicantId },
        data: {
          musanedStatus: "COMPLETED",
          musanedContractNumber: contractNumber,
          status: "MUSANED_CONTRACTED",
          statusHistory: {
            create: {
              fromStatus: applicant.status,
              toStatus: "MUSANED_CONTRACTED",
              changedByName: "Musaned Automation",
              notes: `Contract: ${contractNumber}`,
            },
          },
        },
      }),
      prisma.automationJob.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          resultData: { contractNumber },
        },
      }),
    ]);

    console.log(`[Musaned] ✅ Contract submitted for ${applicantId}. Contract: ${contractNumber}`);
  } catch (error: any) {
    console.error(`[Musaned] ❌ Failed for job ${jobId}:`, error.message);
    await updateJobStatus(jobId, "FAILED", undefined, error.message);

    if (applicantId) {
      await prisma.applicant.update({
        where: { id: applicantId },
        data: { musanedStatus: "FAILED" },
      }).catch(() => {});
    }

    throw error;
  } finally {
    if (browser) await browser.close();
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  const jobId = process.argv[2];
  if (!jobId) {
    console.error("Usage: node musaned.worker.ts <jobId>");
    process.exit(1);
  }

  prisma.automationJob.findUnique({ where: { id: jobId } }).then((job) => {
    if (!job) {
      console.error(`Job ${jobId} not found`);
      process.exit(1);
    }
    return runMusanedWorker({
      jobId: job.id,
      applicantId: job.applicantId,
    } as any);
  }).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
