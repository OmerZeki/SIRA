import { z } from "zod";

export const ApplicantStatusEnum = z.enum([
  "REGISTERED",
  "MEDICAL_APPROVED",
  "LMIS_CLEAR",
  "MUSANED_CONTRACTED",
  "ENJAZ_COMPLETED",
  "FLIGHT_READY",
  "ON_HOLD",
  "REJECTED",
]);

export const GenderEnum = z.enum(["MALE", "FEMALE"]);
export const MaritalStatusEnum = z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"]);
export const LanguageLevelEnum = z.enum(["NONE", "BASIC", "GOOD", "FLUENT"]);
export const EducationLevelEnum = z.enum(["NONE", "PRIMARY", "SECONDARY", "DIPLOMA", "DEGREE", "POSTGRADUATE"]);
export const AutomationStatusEnum = z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED", "MANUAL_REQUIRED"]);
export const UserRoleEnum = z.enum(["OWNER", "MANAGER", "AGENT", "VIEWER"]);

export const createApplicantSchema = z.object({
  passportNumber: z.string().min(3).max(100),
  firstName: z.string().min(1).max(200),
  middleName: z.string().optional().transform(v => v || undefined),
  lastName: z.string().optional().transform(v => v || undefined),
  firstNameAmh: z.string().optional().transform(v => v || undefined),
  middleNameAmh: z.string().optional().transform(v => v || undefined),
  lastNameAmh: z.string().optional().transform(v => v || undefined),
  dateOfBirth: z.coerce.date(),
  placeOfBirth: z.string().optional().transform(v => v || undefined),
  dateOfIssue: z.coerce.date().optional(),
  dateOfExpiry: z.coerce.date(),
  gender: GenderEnum,
  nationality: z.string().default("Ethiopian"),
  issuingCountry: z.string().default("Ethiopia"),
  placeOfIssue: z.string().optional().transform(v => v || undefined),
  maritalStatus: MaritalStatusEnum.nullish(),
  childrenCount: z.coerce.number().int().min(0).default(0),
  religion: z.string().optional().transform(v => v || undefined),
  phone: z.string().optional().transform(v => v || undefined),
  emergencyContact: z.string().optional().transform(v => v || undefined),
  livingTown: z.string().optional().transform(v => v || undefined),
  weight: z.coerce.number().optional(),
  height: z.coerce.number().optional(),
  experienceYears: z.coerce.number().int().min(0).default(0),
  experienceCountries: z.array(z.string()).default([]),
  arabicLevel: LanguageLevelEnum.default("NONE"),
  englishLevel: LanguageLevelEnum.default("NONE"),
  educationLevel: EducationLevelEnum.default("NONE"),
  monthlySalary: z.coerce.number().optional(),
  contractPeriod: z.string().optional().transform(v => v || undefined),
  hasDrivingLicense: z.boolean().default(false),
  skillCleaning: z.boolean().default(false),
  skillCooking: z.boolean().default(false),
  skillArabicCooking: z.boolean().default(false),
  skillChildrenCare: z.boolean().default(false),
  skillBabySitting: z.boolean().default(false),
  skillElderCare: z.boolean().default(false),
  skillIroning: z.boolean().default(false),
  skillWashing: z.boolean().default(false),
  skillTutoring: z.boolean().default(false),
  skillDriving: z.boolean().default(false),
  skillGardening: z.boolean().default(false),
  status: ApplicantStatusEnum.default("REGISTERED"),
  lmisReferenceNumber: z.string().optional().transform(v => v || undefined),
  lmisStatus: AutomationStatusEnum.nullish(),
  musanedContractNumber: z.string().optional().transform(v => v || undefined),
  musanedStatus: AutomationStatusEnum.nullish(),
  medicalStatus: z.string().optional().transform(v => v || undefined),
  medicalCenter: z.string().optional().transform(v => v || undefined),
  medicalExpiryDate: z.coerce.date().optional(),
  enjazReference: z.string().optional().transform(v => v || undefined),
  visaNumber: z.string().optional().transform(v => v || undefined),
  flightDate: z.coerce.date().optional(),
  destinationCity: z.string().optional().transform(v => v || undefined),
  sponsorName: z.string().optional().transform(v => v || undefined),
  sponsorContact: z.string().optional().transform(v => v || undefined),
  agentNotes: z.string().optional().transform(v => v || undefined),
  parsedNotes: z.string().optional().transform(v => v || undefined),
  customFields: z.record(z.string(), z.any()).default({}),
  passportPhotoUrl: z.string().optional().transform(v => v || undefined),
  passportScanUrl: z.string().optional().transform(v => v || undefined),
  fullBodyPhotoUrl: z.string().optional().transform(v => v || undefined),
  medicalReportUrl: z.string().optional().transform(v => v || undefined),
  cocCertificateUrl: z.string().optional().transform(v => v || undefined),
  cvUrl: z.string().optional().transform(v => v || undefined),
});

export const updateApplicantSchema = createApplicantSchema.partial();

export type CreateApplicantInput = z.infer<typeof createApplicantSchema>;
export type UpdateApplicantInput = z.infer<typeof updateApplicantSchema>;
