import type { Applicant } from "@prisma/client";

export const candidatePacketFields = [
  ["Full Name", "fullName"],
  ["First Name (English)", "firstName"],
  ["Last Name (English)", "lastName"],
  ["First Name (Amharic)", "firstNameAmh"],
  ["Middle Name (Amharic)", "middleNameAmh"],
  ["Last Name (Amharic)", "lastNameAmh"],
  ["Passport Number", "passportNumber"],
  ["Gender", "gender"],
  ["Date of Birth", "dateOfBirth"],
  ["Place of Birth", "placeOfBirth"],
  ["Nationality", "nationality"],
  ["Passport Issue Date", "dateOfIssue"],
  ["Passport Expiry Date", "dateOfExpiry"],
  ["Passport Issue Place", "placeOfIssue"],
  ["Religion", "religion"],
  ["Marital Status", "maritalStatus"],
  ["Children", "childrenCount"],
  ["Education", "educationLevel"],
  ["Height (cm)", "height"],
  ["Weight (kg)", "weight"],
  ["Position", "workPosition"],
  ["Arabic Level", "arabicLevel"],
  ["English Level", "englishLevel"],
  ["Experience Years", "experienceYears"],
  ["Experience Countries", "experienceCountries"],
  ["Monthly Salary", "monthlySalary"],
  ["Contract Period", "contractPeriod"],
  ["Medical Status", "medicalStatus"],
  ["Medical Center", "medicalCenter"],
  ["LMIS Reference", "lmisReferenceNumber"],
  ["Musaned Contract", "musanedContractNumber"],
  ["Enjaz Reference", "enjazReference"],
  ["Visa Number", "visaNumber"],
  ["Destination City", "destinationCity"],
  ["Sponsor Name", "sponsorName"],
  ["Sponsor Contact", "sponsorContact"],
] as const;

type CandidatePacketKey = (typeof candidatePacketFields)[number][1];
export type CandidatePacket = Record<CandidatePacketKey, string>;

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB");
}

function value(value: unknown) {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

export function buildCandidatePacket(applicant: Applicant): CandidatePacket {
  const fullName = [applicant.firstName, applicant.lastName].filter(Boolean).join(" ");

  return {
    fullName,
    firstName: value(applicant.firstName),
    lastName: value(applicant.lastName),
    firstNameAmh: value(applicant.firstNameAmh),
    middleNameAmh: value(applicant.middleNameAmh),
    lastNameAmh: value(applicant.lastNameAmh),
    passportNumber: value(applicant.passportNumber),
    gender: value(applicant.gender),
    dateOfBirth: formatDate(applicant.dateOfBirth),
    placeOfBirth: value(applicant.placeOfBirth),
    nationality: value(applicant.nationality),
    dateOfIssue: formatDate(applicant.dateOfIssue),
    dateOfExpiry: formatDate(applicant.dateOfExpiry),
    placeOfIssue: value(applicant.placeOfIssue),
    religion: value(applicant.religion),
    maritalStatus: value(applicant.maritalStatus),
    childrenCount: value(applicant.childrenCount),
    educationLevel: value(applicant.educationLevel),
    height: value(applicant.height),
    weight: value(applicant.weight),
    workPosition: value(applicant.workPosition),
    arabicLevel: value(applicant.arabicLevel),
    englishLevel: value(applicant.englishLevel),
    experienceYears: value(applicant.experienceYears),
    experienceCountries: value(applicant.experienceCountries),
    monthlySalary: value(applicant.monthlySalary),
    contractPeriod: value(applicant.contractPeriod),
    medicalStatus: value(applicant.medicalStatus),
    medicalCenter: value(applicant.medicalCenter),
    lmisReferenceNumber: value(applicant.lmisReferenceNumber),
    musanedContractNumber: value(applicant.musanedContractNumber),
    enjazReference: value(applicant.enjazReference),
    visaNumber: value(applicant.visaNumber),
    destinationCity: value(applicant.destinationCity),
    sponsorName: value(applicant.sponsorName),
    sponsorContact: value(applicant.sponsorContact),
  };
}

export function buildMofaFieldOrderPacket(applicant: Applicant) {
  const packet = buildCandidatePacket(applicant);
  return [
    ["Passport Number", packet.passportNumber],
    ["Nationality", packet.nationality],
    ["First Name", packet.firstName],
    ["Last Name", packet.lastName],
    ["Gender", packet.gender],
    ["Date of Birth", packet.dateOfBirth],
    ["Place of Birth", packet.placeOfBirth],
    ["Passport Issue Place", packet.placeOfIssue],
    ["Passport Issue Date", packet.dateOfIssue],
    ["Passport Expiry Date", packet.dateOfExpiry],
    ["Visa Number", packet.visaNumber],
    ["Sponsor Name", packet.sponsorName],
    ["Sponsor Contact", packet.sponsorContact],
  ].map(([label, packetValue], index) => ({ order: index + 1, label, value: packetValue }));
}

