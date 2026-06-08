export const PORTAL_IDS = [
  "ethiopian_lmis",
  "wafid",
  "tawtheeq_musaned",
  "easyenjaz",
  "tasheer",
  "mofa",
] as const;

export type PortalId = (typeof PORTAL_IDS)[number];

export type AutomationTier = "FULL_BACKGROUND" | "GUIDED_SEMI_AUTOMATION" | "COPY_PASTE_HELPER";

export interface PortalDefinition {
  id: PortalId;
  name: string;
  url: string;
  automationTier: AutomationTier;
  jobType: string;
  requiresCredentials: boolean;
  supportedActions: string[];
  fallback: string;
}

export const portalRegistry: Record<PortalId, PortalDefinition> = {
  ethiopian_lmis: {
    id: "ethiopian_lmis",
    name: "Ethiopian LMIS",
    url: process.env.LMIS_BASE_URL || "https://lmis.gov.et",
    automationTier: "FULL_BACKGROUND",
    jobType: "LMIS_REGISTRATION",
    requiresCredentials: true,
    supportedActions: ["register_candidate", "upload_documents", "capture_reference"],
    fallback: "Manual registration using SIRA-generated candidate packet.",
  },
  wafid: {
    id: "wafid",
    name: "Wafid Medical Status",
    url: process.env.WAFID_URL || "https://wafid.com/en/medical-status-search/",
    automationTier: "FULL_BACKGROUND",
    jobType: "WAFID_STATUS_CHECK",
    requiresCredentials: false,
    supportedActions: ["medical_status_lookup", "status_polling"],
    fallback: "Open Wafid status page with passport details copied.",
  },
  tawtheeq_musaned: {
    id: "tawtheeq_musaned",
    name: "Tawtheeq Musaned",
    url: process.env.TAWTHEEQ_MUSANED_URL || "https://tawtheeq.musaned.com.sa/",
    automationTier: "GUIDED_SEMI_AUTOMATION",
    jobType: "MUSANED_GUIDED_CONTRACT",
    requiresCredentials: true,
    supportedActions: ["prefill_contract", "open_review_session", "capture_contract_number"],
    fallback: "Agent reviews prefilled form, solves any challenge, and submits manually.",
  },
  easyenjaz: {
    id: "easyenjaz",
    name: "EasyEnjaz",
    url: process.env.EASYENJAZ_URL || "https://www.easyenjaz.net/",
    automationTier: "GUIDED_SEMI_AUTOMATION",
    jobType: "EASYENJAZ_GUIDED_SUBMISSION",
    requiresCredentials: true,
    supportedActions: ["prefill_application", "copy_payment_fields", "capture_reference"],
    fallback: "Agent completes CAPTCHA/payment-sensitive steps manually.",
  },
  tasheer: {
    id: "tasheer",
    name: "Tasheer Visa Center",
    url: process.env.TASHEER_URL || "https://vc.tasheer.com/home",
    automationTier: "GUIDED_SEMI_AUTOMATION",
    jobType: "TASHEER_GUIDED_SUBMISSION",
    requiresCredentials: true,
    supportedActions: ["prefill_application", "appointment_helper", "capture_reference"],
    fallback: "Agent completes CAPTCHA/appointment confirmation manually.",
  },
  mofa: {
    id: "mofa",
    name: "Saudi MOFA Visa Services",
    url: process.env.MOFA_URL || "https://visa.mofa.gov.sa/",
    automationTier: "COPY_PASTE_HELPER",
    jobType: "MOFA_COPY_PASTE_PACKET",
    requiresCredentials: false,
    supportedActions: ["generate_field_order_packet", "copy_candidate_payload"],
    fallback: "No browser automation; SIRA generates exact copy-paste data for the agent.",
  },
};

export function isPortalId(value: string): value is PortalId {
  return PORTAL_IDS.includes(value as PortalId);
}

export function getPortalDefinition(value: string): PortalDefinition | null {
  return isPortalId(value) ? portalRegistry[value] : null;
}

/**
 * Resolve a portal definition from a stored AutomationJob.jobType
 * (e.g. "LMIS_REGISTRATION" -> Ethiopian LMIS). Used by the worker API
 * when the job result data does not carry an explicit portalId.
 */
export function getPortalDefinitionByJobType(jobType: string): PortalDefinition | null {
  return (
    Object.values(portalRegistry).find((portal) => portal.jobType === jobType) ?? null
  );
}
