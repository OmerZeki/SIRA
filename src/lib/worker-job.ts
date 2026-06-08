import type { Applicant } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { buildCandidatePacket, buildMofaFieldOrderPacket } from "@/lib/candidate-packet";
import { getPortalDefinition, getPortalDefinitionByJobType, type PortalDefinition } from "@/lib/portals";
import { getPortalCredentialsFromAgency } from "@/lib/portal-credentials";

export interface WorkerJobPayload {
  jobId: string;
  applicantId: string;
  agencyId: string;
  jobType: string;
  status: string;
  attempts: number;
  maxAttempts: number;
  portal: PortalDefinition;
  /** Decrypted portal credentials. Empty strings when not configured. */
  credentials: { username: string; password: string };
  /** Human-readable, formatted packet (dates as DD/MM/YYYY). */
  candidatePacket: ReturnType<typeof buildCandidatePacket>;
  /** Ordered copy-paste packet, only for the MOFA copy-paste helper. */
  copyPastePacket: ReturnType<typeof buildMofaFieldOrderPacket> | null;
  /** Machine-friendly raw field values (ISO dates) for form filling. */
  fields: WorkerApplicantFields;
}

export interface WorkerApplicantFields {
  firstName: string;
  middleName: string;
  lastName: string;
  fatherName: string;
  grandfatherName: string;
  firstNameAmh: string;
  middleNameAmh: string;
  lastNameAmh: string;
  passportNumber: string;
  dateOfBirth: string | null;
  dateOfIssue: string | null;
  dateOfExpiry: string | null;
  gender: string;
  nationality: string;
  issuingCountry: string;
  placeOfBirth: string;
  placeOfIssue: string;
  religion: string;
  workPosition: string;
  maritalStatus: string;
  phone: string;
}

function isoDate(value: Date | null | undefined): string | null {
  if (!value) return null;
  return new Date(value).toISOString().split("T")[0];
}

function str(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

function buildFields(applicant: Applicant): WorkerApplicantFields {
  return {
    firstName: str(applicant.firstName),
    middleName: str(applicant.middleName),
    lastName: str(applicant.lastName),
    fatherName: str(applicant.fatherName),
    grandfatherName: str(applicant.grandfatherName),
    firstNameAmh: str(applicant.firstNameAmh),
    middleNameAmh: str(applicant.middleNameAmh),
    lastNameAmh: str(applicant.lastNameAmh),
    passportNumber: str(applicant.passportNumber),
    dateOfBirth: isoDate(applicant.dateOfBirth),
    dateOfIssue: isoDate(applicant.dateOfIssue),
    dateOfExpiry: isoDate(applicant.dateOfExpiry),
    gender: str(applicant.gender),
    nationality: str(applicant.nationality),
    issuingCountry: str(applicant.issuingCountry),
    placeOfBirth: str(applicant.placeOfBirth),
    placeOfIssue: str(applicant.placeOfIssue),
    religion: str(applicant.religion),
    workPosition: str(applicant.workPosition),
    maritalStatus: str(applicant.maritalStatus),
    phone: str(applicant.phone),
  };
}

function resolvePortal(jobType: string, resultData: unknown): PortalDefinition | null {
  const portalId =
    resultData && typeof resultData === "object" && "portalId" in resultData
      ? String((resultData as Record<string, unknown>).portalId)
      : "";
  return getPortalDefinition(portalId) ?? getPortalDefinitionByJobType(jobType);
}

/**
 * Assemble the full execution payload the software robot needs to run a job:
 * portal metadata, decrypted credentials, the candidate packet, and raw fields.
 * Returns null when the job (or its applicant) cannot be found.
 */
export async function buildWorkerJobPayload(jobId: string): Promise<WorkerJobPayload | null> {
  const job = await prisma.automationJob.findUnique({ where: { id: jobId } });
  if (!job) return null;

  const applicant = await prisma.applicant.findUnique({ where: { id: job.applicantId } });
  if (!applicant) return null;

  const portal = resolvePortal(job.jobType, job.resultData);
  if (!portal) return null;

  const agency = await prisma.agency.findUnique({
    where: { id: job.agencyId },
    select: {
      lmisCredentials: true,
      musanedSroCredentials: true,
      easyEnjazCredentials: true,
      mofaCredentials: true,
      wafidCredentials: true,
      tasheerCredentials: true,
    },
  });

  const credentials = portal.requiresCredentials
    ? getPortalCredentialsFromAgency(agency, portal.id)
    : { username: "", password: "" };

  return {
    jobId: job.id,
    applicantId: job.applicantId,
    agencyId: job.agencyId,
    jobType: job.jobType,
    status: job.status,
    attempts: job.attempts,
    maxAttempts: job.maxAttempts,
    portal,
    credentials,
    candidatePacket: buildCandidatePacket(applicant),
    copyPastePacket: portal.id === "mofa" ? buildMofaFieldOrderPacket(applicant) : null,
    fields: buildFields(applicant),
  };
}
