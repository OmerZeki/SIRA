"use client";

import React, { useState, useEffect } from "react";
import { PassportDropZone } from "./PassportDropZone";
import { NotesParser } from "./NotesParser";
import { DocumentCanvas } from "./DocumentCanvas";
import { Sparkles, Save, ShieldAlert, AlertCircle, PlusCircle, CheckCircle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { ApplicantStatus } from "@prisma/client";
import { useCurrentLocale } from "@/components/sira/LanguageSwitcher";
import { getDictionary } from "@/lib/i18n";

interface CustomFieldDef {
  id: string;
  fieldKey: string;
  label: string;
  fieldType: "TEXT" | "NUMBER" | "DATE" | "CHECKBOX" | "DROPDOWN" | "TEXTAREA";
  options: string[];
  isRequired: boolean;
}

interface CandidateFormProps {
  initialData?: any;
  onSubmit: (formData: any) => Promise<void>;
  isSubmitting?: boolean;
}

export const CandidateForm: React.FC<CandidateFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting = false,
}) => {
  const locale = useCurrentLocale();
  const t = getDictionary(locale);

  // Form State
  const [formData, setFormData] = useState({
    // Section A: Biographical (OCR-filled)
    passportNumber: "",
    firstName: "",
    middleName: "",
    lastName: "",
    firstNameAmh: "",
    middleNameAmh: "",
    lastNameAmh: "",
    dateOfBirth: "",
    placeOfBirth: "",
    dateOfIssue: "",
    dateOfExpiry: "",
    gender: "FEMALE" as "MALE" | "FEMALE",
    nationality: "Ethiopian",
    issuingCountry: "Ethiopia",
    placeOfIssue: "Addis Ababa",

    // Section B: Personal Details
    maritalStatus: null as "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED" | null,
    childrenCount: 0,
    religion: "",
    phone: "",
    emergencyContact: "",
    livingTown: "",
    weight: "",
    height: "",

    // Section C: Professional Profile
    experienceYears: 0,
    experienceCountries: [] as string[],
    arabicLevel: "NONE" as "NONE" | "BASIC" | "GOOD" | "FLUENT",
    englishLevel: "NONE" as "NONE" | "BASIC" | "GOOD" | "FLUENT",
    educationLevel: "NONE" as "NONE" | "PRIMARY" | "SECONDARY" | "DIPLOMA" | "DEGREE" | "POSTGRADUATE",
    monthlySalary: "",
    contractPeriod: "2 years",
    hasDrivingLicense: false,

    // Section D: Skills Matrix
    skillCleaning: false,
    skillCooking: false,
    skillArabicCooking: false,
    skillChildrenCare: false,
    skillBabySitting: false,
    skillElderCare: false,
    skillIroning: false,
    skillWashing: false,
    skillTutoring: false,
    skillDriving: false,
    skillGardening: false,

    // Section E: Compliance & Tracking
    status: "REGISTERED" as ApplicantStatus,
    lmisReferenceNumber: "",
    lmisStatus: null as "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "MANUAL_REQUIRED" | null,
    musanedContractNumber: "",
    musanedStatus: null as "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "MANUAL_REQUIRED" | null,
    medicalStatus: "",
    medicalCenter: "",
    medicalExpiryDate: "",
    enjazReference: "",
    visaNumber: "",
    flightDate: "",
    destinationCity: "",
    sponsorName: "",
    sponsorContact: "",

    // Notes
    agentNotes: "",
    parsedNotes: "",

    // Document URLs
    passportPhotoUrl: null as string | null,
    passportScanUrl: null as string | null,
    fullBodyPhotoUrl: null as string | null,
    medicalReportUrl: null as string | null,
    cocCertificateUrl: null as string | null,
    cvUrl: null as string | null,
  });

  // Custom Fields State
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDef[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<string>("biographical");

  // Load Custom Field Definitions
  useEffect(() => {
    async function loadCustomFields() {
      try {
        const res = await fetch("/api/agency/custom-fields");
        if (res.ok) {
          const data = await res.json();
          setCustomFieldDefs(data);
        }
      } catch (err) {
        console.error("Could not fetch custom fields:", err);
      }
    }
    loadCustomFields();
  }, []);

  // Set Initial Data if editing
  useEffect(() => {
    if (initialData) {
      const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "";
        return new Date(dateStr).toISOString().split("T")[0];
      };

      setFormData((prev) => ({
        ...prev,
        ...initialData,
        dateOfBirth: formatDate(initialData.dateOfBirth),
        dateOfIssue: formatDate(initialData.dateOfIssue),
        dateOfExpiry: formatDate(initialData.dateOfExpiry),
        medicalExpiryDate: formatDate(initialData.medicalExpiryDate),
        flightDate: formatDate(initialData.flightDate),
      }));

      if (initialData.customFields) {
        setCustomFieldValues(initialData.customFields);
      }
    }
  }, [initialData]);

  // Merge OCR Fields
  const handleOcrComplete = (ocrFields: any) => {
    const givenNames = ocrFields.givenNames || [];
    const firstName = givenNames[0] || "";
    const middleName = givenNames.slice(1).join(" ") || "";

    setFormData((prev) => ({
      ...prev,
      passportNumber: ocrFields.passportNumber || prev.passportNumber,
      firstName: ocrFields.firstName || firstName || prev.firstName,
      middleName: ocrFields.middleName || middleName || prev.middleName,
      lastName: ocrFields.surname || prev.lastName,
      firstNameAmh: ocrFields.firstNameAmh || prev.firstNameAmh,
      middleNameAmh: ocrFields.middleNameAmh || prev.middleNameAmh,
      lastNameAmh: ocrFields.lastNameAmh || prev.lastNameAmh,
      dateOfBirth: ocrFields.dateOfBirth || prev.dateOfBirth,
      dateOfIssue: ocrFields.dateOfIssue || prev.dateOfIssue,
      dateOfExpiry: ocrFields.dateOfExpiry || prev.dateOfExpiry,
      gender: ocrFields.gender === "M" ? "MALE" : "FEMALE",
      placeOfBirth: ocrFields.placeOfBirth || prev.placeOfBirth,
      placeOfIssue: ocrFields.placeOfIssue || "Addis Ababa",
      nationality: ocrFields.nationality || prev.nationality,
      issuingCountry: ocrFields.issuingCountry || prev.issuingCountry,
    }));
    setActiveSection("biographical");
  };

  // Merge AI Parsed Notes
  const handleParseComplete = (aiFields: any) => {
    setFormData((prev) => ({
      ...prev,
      maritalStatus: aiFields.maritalStatus || prev.maritalStatus,
      childrenCount: aiFields.childrenCount !== null ? aiFields.childrenCount : prev.childrenCount,
      experienceYears: aiFields.experienceYears !== null ? aiFields.experienceYears : prev.experienceYears,
      experienceCountries: aiFields.experienceCountries || prev.experienceCountries,
      religion: aiFields.religion || prev.religion,
      monthlySalary: aiFields.monthlySalaryExpected ? String(aiFields.monthlySalaryExpected) : prev.monthlySalary,
      arabicLevel: aiFields.languageArabic || prev.arabicLevel,
      englishLevel: aiFields.languageEnglish || prev.englishLevel,
      skillCleaning: aiFields.skills?.cleaning ?? prev.skillCleaning,
      skillCooking: aiFields.skills?.cooking ?? prev.skillCooking,
      skillArabicCooking: aiFields.skills?.arabicCooking ?? prev.skillArabicCooking,
      skillChildrenCare: aiFields.skills?.childrenCare ?? prev.skillChildrenCare,
      skillBabySitting: aiFields.skills?.babySitting ?? prev.skillBabySitting,
      skillElderCare: aiFields.skills?.elderCare ?? prev.skillElderCare,
      skillIroning: aiFields.skills?.ironing ?? prev.skillIroning,
      skillWashing: aiFields.skills?.washing ?? prev.skillWashing,
      skillTutoring: aiFields.skills?.tutoring ?? prev.skillTutoring,
      skillDriving: aiFields.skills?.driving ?? prev.skillDriving,
      agentNotes: aiFields.notes || prev.agentNotes,
      parsedNotes: aiFields.notes || prev.parsedNotes,
    }));
    setActiveSection("personal");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: target.checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors((prev) => {
        const clone = { ...prev };
        delete clone[name];
        return clone;
      });
    }
  };

  const handleCustomFieldChange = (key: string, value: any) => {
    setCustomFieldValues((prev) => ({ ...prev, [key]: value }));
    if (errors[`custom_${key}`]) {
      setErrors((prev) => {
        const clone = { ...prev };
        delete clone[`custom_${key}`];
        return clone;
      });
    }
  };

  const handleDocChange = (key: string, url: string | null) => {
    setFormData((prev) => ({ ...prev, [`${key}Url`]: url }));
  };

  const validateForm = () => {
    const tempErrors: Record<string, string> = {};

    // Required check
    if (!formData.passportNumber.trim()) tempErrors.passportNumber = `${t.form.passportNumber} ${t.common.error.toLowerCase()}`;
    if (!formData.firstName.trim()) tempErrors.firstName = `${t.form.firstName} ${t.common.error.toLowerCase()}`;
    if (!formData.lastName.trim()) tempErrors.lastName = `${t.form.lastName} ${t.common.error.toLowerCase()}`;
    if (!formData.dateOfBirth) tempErrors.dateOfBirth = `${t.form.dateOfBirth} ${t.common.error.toLowerCase()}`;
    if (!formData.dateOfExpiry) tempErrors.dateOfExpiry = `${t.form.passportExpiry} ${t.common.error.toLowerCase()}`;

    // Custom fields validation
    customFieldDefs.forEach((def) => {
      if (def.isRequired && !customFieldValues[def.fieldKey]) {
        tempErrors[`custom_${def.fieldKey}`] = `${def.label} is required`;
      }
    });

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      alert(t.form.validationError);
      return;
    }

    const payload = {
      ...formData,
      // Format Dates
      dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : null,
      dateOfIssue: formData.dateOfIssue ? new Date(formData.dateOfIssue) : null,
      dateOfExpiry: formData.dateOfExpiry ? new Date(formData.dateOfExpiry) : null,
      medicalExpiryDate: formData.medicalExpiryDate ? new Date(formData.medicalExpiryDate) : null,
      flightDate: formData.flightDate ? new Date(formData.flightDate) : null,
      // Map custom fields JSON
      customFields: customFieldValues,
    };

    await onSubmit(payload);
  };

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? "" : section);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* OCR Onboarding Panel */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-ink">{t.form.scanSection}</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PassportDropZone onOcrComplete={handleOcrComplete} />
          <NotesParser onParseComplete={handleParseComplete} />
        </div>
      </div>

      <hr className="border-hairline" />

      {/* Profile Form Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-ink">{t.form.formSection}</h3>

        {/* Section A: Biographical */}
        <div className="bg-surface-1 border border-hairline rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("biographical")}
            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-surface-2 border-b border-hairline"
          >
            <div>
              <h4 className="text-sm font-semibold text-ink">Section A: {t.candidates.biographical}</h4>
              <p className="text-xs text-ink-subtle">Primary biographical details populated by OCR</p>
            </div>
            {activeSection === "biographical" ? <ChevronUp className="w-4 h-4 text-ink-subtle" /> : <ChevronDown className="w-4 h-4 text-ink-subtle" />}
          </button>

          {activeSection === "biographical" && (
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">{t.form.firstName}</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`w-full input-text ${errors.firstName ? "border-error" : ""}`}
                />
                {errors.firstName && <span className="text-[10px] text-error mt-0.5">{errors.firstName}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">Middle Name (English)</label>
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName || ""}
                  onChange={handleInputChange}
                  className="w-full input-text"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">{t.form.lastName}</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`w-full input-text ${errors.lastName ? "border-error" : ""}`}
                />
                {errors.lastName && <span className="text-[10px] text-error mt-0.5">{errors.lastName}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">{t.form.firstNameAmh}</label>
                <input
                  type="text"
                  name="firstNameAmh"
                  value={formData.firstNameAmh || ""}
                  onChange={handleInputChange}
                  placeholder="ቢዙነሽ"
                  className="w-full input-text"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">Middle Name (አማርኛ)</label>
                <input
                  type="text"
                  name="middleNameAmh"
                  value={formData.middleNameAmh || ""}
                  onChange={handleInputChange}
                  placeholder="ሚልክያስ"
                  className="w-full input-text"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">{t.form.lastNameAmh}</label>
                <input
                  type="text"
                  name="lastNameAmh"
                  value={formData.lastNameAmh || ""}
                  onChange={handleInputChange}
                  placeholder="ፎላ"
                  className="w-full input-text"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">{t.form.passportNumber}</label>
                <input
                  type="text"
                  name="passportNumber"
                  value={formData.passportNumber}
                  onChange={handleInputChange}
                  className={`w-full input-text ${errors.passportNumber ? "border-error" : ""}`}
                />
                {errors.passportNumber && <span className="text-[10px] text-error mt-0.5">{errors.passportNumber}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">{t.form.gender}</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full input-text bg-surface-1"
                >
                  <option value="FEMALE">{t.form.genderFemale} (ሴት)</option>
                  <option value="MALE">{t.form.genderMale} (ወንድ)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">{t.form.dateOfBirth}</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className={`w-full input-text ${errors.dateOfBirth ? "border-error" : ""}`}
                />
                {errors.dateOfBirth && <span className="text-[10px] text-error mt-0.5">{errors.dateOfBirth}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">{t.form.passportExpiry}</label>
                <input
                  type="date"
                  name="dateOfExpiry"
                  value={formData.dateOfExpiry}
                  onChange={handleInputChange}
                  className={`w-full input-text ${errors.dateOfExpiry ? "border-error" : ""}`}
                />
                {errors.dateOfExpiry && <span className="text-[10px] text-error mt-0.5">{errors.dateOfExpiry}</span>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">{t.form.placeOfBirth}</label>
                <input
                  type="text"
                  name="placeOfBirth"
                  value={formData.placeOfBirth || ""}
                  onChange={handleInputChange}
                  className="w-full input-text"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">{t.form.dateOfIssue}</label>
                <input
                  type="date"
                  name="dateOfIssue"
                  value={formData.dateOfIssue || ""}
                  onChange={handleInputChange}
                  className="w-full input-text"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">{t.form.placeOfIssue}</label>
                <input
                  type="text"
                  name="placeOfIssue"
                  value={formData.placeOfIssue || ""}
                  onChange={handleInputChange}
                  className="w-full input-text"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">{t.form.nationality}</label>
                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  className="w-full input-text"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section B: Personal Details */}
        <div className="bg-surface-1 border border-hairline rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("personal")}
            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-surface-2 border-b border-hairline"
          >
            <div>
              <h4 className="text-sm font-semibold text-ink">Section B: {t.candidates.personal}</h4>
              <p className="text-xs text-ink-subtle">Marital status, religion, children, contact info</p>
            </div>
            {activeSection === "personal" ? <ChevronUp className="w-4 h-4 text-ink-subtle" /> : <ChevronDown className="w-4 h-4 text-ink-subtle" />}
          </button>

          {activeSection === "personal" && (
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">{t.form.maritalStatus}</label>
                <select
                  name="maritalStatus"
                  value={formData.maritalStatus || ""}
                  onChange={handleInputChange}
                  className="w-full input-text bg-surface-1"
                >
                  <option value="">Select...</option>
                  <option value="SINGLE">{t.form.maritalSingle}</option>
                  <option value="MARRIED">{t.form.maritalMarried}</option>
                  <option value="DIVORCED">{t.form.maritalDivorced}</option>
                  <option value="WIDOWED">{t.form.maritalWidowed}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">{t.form.childrenCount}</label>
                <input
                  type="number"
                  name="childrenCount"
                  value={formData.childrenCount}
                  onChange={handleInputChange}
                  className="w-full input-text"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">{t.form.religion}</label>
                <input
                  type="text"
                  name="religion"
                  value={formData.religion || ""}
                  onChange={handleInputChange}
                  placeholder="Christian / Muslim"
                  className="w-full input-text"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">{t.form.phone}</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleInputChange}
                  className="w-full input-text"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">{t.form.emergencyContact}</label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact || ""}
                  onChange={handleInputChange}
                  className="w-full input-text"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">{t.form.livingTown}</label>
                <input
                  type="text"
                  name="livingTown"
                  value={formData.livingTown || ""}
                  onChange={handleInputChange}
                  className="w-full input-text"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">{t.form.weight}</label>
                <input
                  type="text"
                  name="weight"
                  value={formData.weight || ""}
                  onChange={handleInputChange}
                  className="w-full input-text"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">{t.form.height}</label>
                <input
                  type="text"
                  name="height"
                  value={formData.height || ""}
                  onChange={handleInputChange}
                  className="w-full input-text"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section C: Professional Profile */}
        <div className="bg-surface-1 border border-hairline rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("professional")}
            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-surface-2 border-b border-hairline"
          >
            <div>
              <h4 className="text-sm font-semibold text-ink">Section C: {t.candidates.professional}</h4>
              <p className="text-xs text-ink-subtle">Experience, language skills, and salary expectations</p>
            </div>
            {activeSection === "professional" ? <ChevronUp className="w-4 h-4 text-ink-subtle" /> : <ChevronDown className="w-4 h-4 text-ink-subtle" />}
          </button>

          {activeSection === "professional" && (
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">{t.form.experienceYears}</label>
                <input
                  type="number"
                  name="experienceYears"
                  value={formData.experienceYears}
                  onChange={handleInputChange}
                  className="w-full input-text"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">{t.form.arabicLevel}</label>
                <select
                  name="arabicLevel"
                  value={formData.arabicLevel}
                  onChange={handleInputChange}
                  className="w-full input-text bg-surface-1"
                >
                  <option value="NONE">None</option>
                  <option value="BASIC">Basic</option>
                  <option value="GOOD">Good</option>
                  <option value="FLUENT">Fluent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">{t.form.englishLevel}</label>
                <select
                  name="englishLevel"
                  value={formData.englishLevel}
                  onChange={handleInputChange}
                  className="w-full input-text bg-surface-1"
                >
                  <option value="NONE">None</option>
                  <option value="BASIC">Basic</option>
                  <option value="GOOD">Good</option>
                  <option value="FLUENT">Fluent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">{t.form.monthlySalary}</label>
                <input
                  type="number"
                  name="monthlySalary"
                  value={formData.monthlySalary || ""}
                  onChange={handleInputChange}
                  placeholder="300"
                  className="w-full input-text"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">{t.form.contractPeriod}</label>
                <input
                  type="text"
                  name="contractPeriod"
                  value={formData.contractPeriod}
                  onChange={handleInputChange}
                  className="w-full input-text"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">{t.form.educationLevel}</label>
                <select
                  name="educationLevel"
                  value={formData.educationLevel}
                  onChange={handleInputChange}
                  className="w-full input-text bg-surface-1"
                >
                  <option value="NONE">None</option>
                  <option value="PRIMARY">Primary</option>
                  <option value="SECONDARY">Secondary</option>
                  <option value="DIPLOMA">Diploma</option>
                  <option value="DEGREE">Degree</option>
                  <option value="POSTGRADUATE">Postgraduate</option>
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-ink-muted">
                  <input
                    type="checkbox"
                    name="hasDrivingLicense"
                    checked={formData.hasDrivingLicense}
                    onChange={handleInputChange}
                    className="rounded border-hairline text-primary w-4 h-4 bg-surface-2"
                  />
                  {t.form.hasDrivingLicense}
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Section D: Skills Matrix */}
        <div className="bg-surface-1 border border-hairline rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("skills")}
            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-surface-2 border-b border-hairline"
          >
            <div>
              <h4 className="text-sm font-semibold text-ink">Section D: {t.candidates.skills}</h4>
              <p className="text-xs text-ink-subtle">Check skills matching the candidate&apos;s capabilities</p>
            </div>
            {activeSection === "skills" ? <ChevronUp className="w-4 h-4 text-ink-subtle" /> : <ChevronDown className="w-4 h-4 text-ink-subtle" />}
          </button>

          {activeSection === "skills" && (
            <div className="p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { name: "skillCleaning", label: `${t.form.skillsCleaning} (ማጽዳት)` },
                { name: "skillCooking", label: `${t.form.skillsCooking} (ምግብ ማብሰል)` },
                { name: "skillArabicCooking", label: t.form.skillsArabicCooking },
                { name: "skillChildrenCare", label: t.form.skillsChildrenCare },
                { name: "skillBabySitting", label: t.form.skillsBabySitting },
                { name: "skillElderCare", label: t.form.skillsElderCare },
                { name: "skillIroning", label: t.form.skillsIroning },
                { name: "skillWashing", label: t.form.skillsWashing },
                { name: "skillTutoring", label: t.form.skillsTutoring },
                { name: "skillDriving", label: t.form.skillsDriving },
                { name: "skillGardening", label: t.form.skillsGardening },
              ].map((skill) => (
                <label key={skill.name} className="flex items-center gap-2.5 cursor-pointer text-sm text-ink-muted hover:text-ink">
                  <input
                    type="checkbox"
                    name={skill.name}
                    checked={(formData as any)[skill.name]}
                    onChange={handleInputChange}
                    className="rounded border-hairline text-primary focus:ring-primary/30 w-4 h-4 bg-surface-2"
                  />
                  {skill.label}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Section E: Compliance & Tracking */}
        <div className="bg-surface-1 border border-hairline rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("compliance")}
            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-surface-2 border-b border-hairline"
          >
            <div>
              <h4 className="text-sm font-semibold text-ink">Section E: {t.candidates.compliance}</h4>
              <p className="text-xs text-ink-subtle">Tracking numbers for LMIS, Musaned, and Saudi visas</p>
            </div>
            {activeSection === "compliance" ? <ChevronUp className="w-4 h-4 text-ink-subtle" /> : <ChevronDown className="w-4 h-4 text-ink-subtle" />}
          </button>

          {activeSection === "compliance" && (
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">Pipeline Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full input-text bg-surface-1"
                >
                  <option value="REGISTERED">{t.status.REGISTERED}</option>
                  <option value="MEDICAL_APPROVED">{t.status.MEDICAL_APPROVED}</option>
                  <option value="LMIS_CLEAR">{t.status.LMIS_CLEAR}</option>
                  <option value="MUSANED_CONTRACTED">{t.status.MUSANED_CONTRACTED}</option>
                  <option value="ENJAZ_COMPLETED">{t.status.ENJAZ_COMPLETED}</option>
                  <option value="FLIGHT_READY">{t.status.FLIGHT_READY}</option>
                  <option value="ON_HOLD">{t.status.ON_HOLD}</option>
                  <option value="REJECTED">{t.status.REJECTED}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">LMIS Reference Number</label>
                <input
                  type="text"
                  name="lmisReferenceNumber"
                  value={formData.lmisReferenceNumber || ""}
                  onChange={handleInputChange}
                  placeholder="MOLS-XXXXX"
                  className="w-full input-text"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">Musaned Contract Number</label>
                <input
                  type="text"
                  name="musanedContractNumber"
                  value={formData.musanedContractNumber || ""}
                  onChange={handleInputChange}
                  placeholder="MUS-XXXXX"
                  className="w-full input-text"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">Visa Reference Number</label>
                <input
                  type="text"
                  name="enjazReference"
                  value={formData.enjazReference || ""}
                  onChange={handleInputChange}
                  className="w-full input-text"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">Medical Center</label>
                <input
                  type="text"
                  name="medicalCenter"
                  value={formData.medicalCenter || ""}
                  onChange={handleInputChange}
                  className="w-full input-text"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted mb-1">Flight Date</label>
                <input
                  type="date"
                  name="flightDate"
                  value={formData.flightDate || ""}
                  onChange={handleInputChange}
                  className="w-full input-text"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section F: Dynamic Custom Fields */}
        {customFieldDefs.length > 0 && (
          <div className="bg-surface-1 border border-hairline rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection("custom")}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-surface-2 border-b border-hairline"
            >
              <div>
                <h4 className="text-sm font-semibold text-ink">Section F: Custom Agency Fields</h4>
                <p className="text-xs text-ink-subtle">Dynamic fields custom-tailored for your agency</p>
              </div>
              {activeSection === "custom" ? <ChevronUp className="w-4 h-4 text-ink-subtle" /> : <ChevronDown className="w-4 h-4 text-ink-subtle" />}
            </button>

            {activeSection === "custom" && (
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customFieldDefs.map((def) => {
                  const key = `custom_${def.fieldKey}`;
                  const error = errors[key];

                  return (
                    <div key={def.id}>
                      <label className="block text-xs font-semibold text-ink-muted mb-1">
                        {def.label} {def.isRequired && <span className="text-primary">*</span>}
                      </label>

                      {def.fieldType === "TEXT" && (
                        <input
                           type="text"
                          value={customFieldValues[def.fieldKey] || ""}
                          onChange={(e) => handleCustomFieldChange(def.fieldKey, e.target.value)}
                          className={`w-full input-text ${error ? "border-error" : ""}`}
                        />
                      )}

                      {def.fieldType === "NUMBER" && (
                        <input
                          type="number"
                          value={customFieldValues[def.fieldKey] || ""}
                          onChange={(e) => handleCustomFieldChange(def.fieldKey, e.target.value)}
                          className={`w-full input-text ${error ? "border-error" : ""}`}
                        />
                      )}

                      {def.fieldType === "DATE" && (
                        <input
                          type="date"
                          value={customFieldValues[def.fieldKey] || ""}
                          onChange={(e) => handleCustomFieldChange(def.fieldKey, e.target.value)}
                          className={`w-full input-text ${error ? "border-error" : ""}`}
                        />
                      )}

                      {def.fieldType === "CHECKBOX" && (
                        <label className="flex items-center gap-2 mt-2 cursor-pointer text-sm text-ink-muted">
                          <input
                            type="checkbox"
                            checked={!!customFieldValues[def.fieldKey]}
                            onChange={(e) => handleCustomFieldChange(def.fieldKey, e.target.checked)}
                            className="rounded border-hairline text-primary w-4 h-4 bg-surface-2"
                          />
                          Yes
                        </label>
                      )}

                      {def.fieldType === "DROPDOWN" && (
                        <select
                          value={customFieldValues[def.fieldKey] || ""}
                          onChange={(e) => handleCustomFieldChange(def.fieldKey, e.target.value)}
                          className={`w-full input-text bg-surface-1 ${error ? "border-error" : ""}`}
                        >
                          <option value="">Select...</option>
                          {def.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}

                      {error && <span className="text-[10px] text-error mt-0.5">{error}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <hr className="border-hairline" />

      {/* Document Canvas Panel */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-ink">3. Candidate Document Canvas</h3>
        <DocumentCanvas values={formData} onChange={handleDocChange} />
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary flex items-center gap-2 px-6 py-3 font-semibold select-none disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {initialData ? "Updating..." : "Saving..."}
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              {initialData ? t.form.submitUpdate : t.form.submitCreate}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default CandidateForm;
