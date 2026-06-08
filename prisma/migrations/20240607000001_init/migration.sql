-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ApplicantStatus" AS ENUM ('REGISTERED', 'MEDICAL_APPROVED', 'LMIS_CLEAR', 'MUSANED_CONTRACTED', 'ENJAZ_COMPLETED', 'FLIGHT_READY', 'ON_HOLD', 'REJECTED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED');

-- CreateEnum
CREATE TYPE "LanguageLevel" AS ENUM ('NONE', 'BASIC', 'GOOD', 'FLUENT');

-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('NONE', 'PRIMARY', 'SECONDARY', 'DIPLOMA', 'DEGREE', 'POSTGRADUATE');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'MANAGER', 'AGENT', 'VIEWER');

-- CreateEnum
CREATE TYPE "AutomationStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'MANUAL_REQUIRED');

-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'CHECKBOX', 'DROPDOWN', 'TEXTAREA');

-- CreateTable
CREATE TABLE "Agency" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "licenseNumber" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT NOT NULL,
    "logoUrl" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "registrationCodeId" TEXT,
    "candidateLimit" INTEGER NOT NULL DEFAULT 100,
    "usersLimit" INTEGER NOT NULL DEFAULT 3,
    "lmisCredentials" TEXT,
    "musanedSroCredentials" TEXT,
    "easyEnjazCredentials" TEXT,
    "mofaCredentials" TEXT,
    "wafidCredentials" TEXT,
    "tasheerCredentials" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistrationCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistrationCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'AGENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "avatarUrl" TEXT,
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencyInvite" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'AGENT',
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgencyInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Applicant" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "passportNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT,
    "fatherName" TEXT,
    "grandfatherName" TEXT,
    "firstNameAmh" TEXT,
    "middleNameAmh" TEXT,
    "lastNameAmh" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "placeOfBirth" TEXT,
    "dateOfIssue" TIMESTAMP(3),
    "dateOfExpiry" TIMESTAMP(3),
    "gender" "Gender",
    "nationality" TEXT NOT NULL DEFAULT 'Ethiopian',
    "issuingCountry" TEXT NOT NULL DEFAULT 'Ethiopia',
    "placeOfIssue" TEXT,
    "maritalStatus" "MaritalStatus",
    "childrenCount" INTEGER NOT NULL DEFAULT 0,
    "religion" TEXT,
    "phone" TEXT,
    "emergencyContact" TEXT,
    "livingTown" TEXT,
    "weight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "workPosition" TEXT,
    "experienceYears" INTEGER NOT NULL DEFAULT 0,
    "experienceCountries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "arabicLevel" "LanguageLevel" NOT NULL DEFAULT 'NONE',
    "englishLevel" "LanguageLevel" NOT NULL DEFAULT 'NONE',
    "educationLevel" "EducationLevel" NOT NULL DEFAULT 'NONE',
    "monthlySalary" DOUBLE PRECISION,
    "contractPeriod" TEXT,
    "hasDrivingLicense" BOOLEAN NOT NULL DEFAULT false,
    "skillCleaning" BOOLEAN NOT NULL DEFAULT false,
    "skillCooking" BOOLEAN NOT NULL DEFAULT false,
    "skillArabicCooking" BOOLEAN NOT NULL DEFAULT false,
    "skillChildrenCare" BOOLEAN NOT NULL DEFAULT false,
    "skillBabySitting" BOOLEAN NOT NULL DEFAULT false,
    "skillElderCare" BOOLEAN NOT NULL DEFAULT false,
    "skillIroning" BOOLEAN NOT NULL DEFAULT false,
    "skillWashing" BOOLEAN NOT NULL DEFAULT false,
    "skillTutoring" BOOLEAN NOT NULL DEFAULT false,
    "skillDriving" BOOLEAN NOT NULL DEFAULT false,
    "skillGardening" BOOLEAN NOT NULL DEFAULT false,
    "status" "ApplicantStatus" NOT NULL DEFAULT 'REGISTERED',
    "passportPhotoUrl" TEXT,
    "passportScanUrl" TEXT,
    "fullBodyPhotoUrl" TEXT,
    "medicalReportUrl" TEXT,
    "cocCertificateUrl" TEXT,
    "cvUrl" TEXT,
    "medicalStatus" TEXT,
    "medicalCenter" TEXT,
    "medicalExpiryDate" TIMESTAMP(3),
    "lmisStatus" "AutomationStatus",
    "lmisReferenceNumber" TEXT,
    "lmisRegisteredAt" TIMESTAMP(3),
    "musanedStatus" "AutomationStatus",
    "musanedContractNumber" TEXT,
    "musanedContractedAt" TIMESTAMP(3),
    "enjazReference" TEXT,
    "visaNumber" TEXT,
    "flightDate" TIMESTAMP(3),
    "destinationCity" TEXT,
    "sponsorName" TEXT,
    "sponsorContact" TEXT,
    "agentNotes" TEXT,
    "parsedNotes" TEXT,
    "ocrConfidenceScore" DOUBLE PRECISION,
    "ocrProcessedAt" TIMESTAMP(3),
    "customFields" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Applicant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusHistoryEntry" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "fromStatus" "ApplicantStatus",
    "toStatus" "ApplicantStatus" NOT NULL,
    "changedByName" TEXT,
    "notes" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusHistoryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomFieldDefinition" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "labelAmh" TEXT,
    "fieldType" "FieldType" NOT NULL DEFAULT 'TEXT',
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomFieldDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationJob" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "status" "AutomationStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "resultData" JSONB,
    "errorMessage" TEXT,
    "screenshotUrl" TEXT,
    "enqueuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AutomationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExcelTemplate" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "columnMapping" JSONB NOT NULL,
    "dateFormat" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExcelTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportRecord" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "candidateCount" INTEGER NOT NULL,
    "exportedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExportRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agency_licenseNumber_key" ON "Agency"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Agency_email_key" ON "Agency"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Agency_registrationCodeId_key" ON "Agency"("registrationCodeId");

-- CreateIndex
CREATE INDEX "Agency_email_idx" ON "Agency"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationCode_code_key" ON "RegistrationCode"("code");

-- CreateIndex
CREATE INDEX "RegistrationCode_code_idx" ON "RegistrationCode"("code");

-- CreateIndex
CREATE INDEX "RegistrationCode_expiresAt_idx" ON "RegistrationCode"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_agencyId_idx" ON "User"("agencyId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "AgencyInvite_token_key" ON "AgencyInvite"("token");

-- CreateIndex
CREATE INDEX "Applicant_agencyId_idx" ON "Applicant"("agencyId");

-- CreateIndex
CREATE INDEX "Applicant_status_idx" ON "Applicant"("status");

-- CreateIndex
CREATE INDEX "Applicant_passportNumber_idx" ON "Applicant"("passportNumber");

-- CreateIndex
CREATE INDEX "Applicant_dateOfExpiry_idx" ON "Applicant"("dateOfExpiry");

-- CreateIndex
CREATE INDEX "Applicant_agencyId_status_idx" ON "Applicant"("agencyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Applicant_agencyId_passportNumber_key" ON "Applicant"("agencyId", "passportNumber");

-- CreateIndex
CREATE INDEX "StatusHistoryEntry_applicantId_idx" ON "StatusHistoryEntry"("applicantId");

-- CreateIndex
CREATE INDEX "CustomFieldDefinition_agencyId_idx" ON "CustomFieldDefinition"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomFieldDefinition_agencyId_fieldKey_key" ON "CustomFieldDefinition"("agencyId", "fieldKey");

-- CreateIndex
CREATE INDEX "AutomationJob_applicantId_idx" ON "AutomationJob"("applicantId");

-- CreateIndex
CREATE INDEX "AutomationJob_agencyId_status_idx" ON "AutomationJob"("agencyId", "status");

-- CreateIndex
CREATE INDEX "AutomationJob_status_idx" ON "AutomationJob"("status");

-- CreateIndex
CREATE INDEX "ExcelTemplate_agencyId_idx" ON "ExcelTemplate"("agencyId");

-- CreateIndex
CREATE INDEX "ExportRecord_agencyId_idx" ON "ExportRecord"("agencyId");

-- AddForeignKey
ALTER TABLE "Agency" ADD CONSTRAINT "Agency_registrationCodeId_fkey" FOREIGN KEY ("registrationCodeId") REFERENCES "RegistrationCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyInvite" ADD CONSTRAINT "AgencyInvite_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Applicant" ADD CONSTRAINT "Applicant_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusHistoryEntry" ADD CONSTRAINT "StatusHistoryEntry_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFieldDefinition" ADD CONSTRAINT "CustomFieldDefinition_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationJob" ADD CONSTRAINT "AutomationJob_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationJob" ADD CONSTRAINT "AutomationJob_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExcelTemplate" ADD CONSTRAINT "ExcelTemplate_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportRecord" ADD CONSTRAINT "ExportRecord_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
