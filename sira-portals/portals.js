/**
 * portals.js  –  SIRA Portal Registry
 * =====================================
 * Single source of truth for all government/commercial portals
 * that SIRA integrates with via proxy or Playwright automation.
 *
 * Fields
 * -------
 * id          – stable slug used in API calls and config
 * name        – human-readable name (English)
 * nameAmh     – Amharic label (displayed on Amharic UI)
 * nameAr      – Arabic label (displayed on Arabic UI)
 * url         – canonical portal URL (what the iframe loads / automation targets)
 * category    – "ethiopia" | "saudi" | "gcc" | "medical"
 * automatable – true if SIRA has a Playwright automation for this portal
 * proxiable   – true if the portal can be served via /proxy (no JS-heavy CAPTCHA blocking iframes)
 * icon        – emoji fallback icon
 * description – one-liner description (English)
 * color       – tailwind-friendly hex for card accents
 */

"use strict";

/** @type {Portal[]} */
const PORTALS = [
  // ── Ethiopia ─────────────────────────────────────────────────────────────
  {
    id: "ethiopian_lmis",
    name: "Ethiopian E-LMIS",
    nameAmh: "ኢ-LMIS",
    nameAr: "نظام LMIS الإثيوبي",
    url: process.env.LMIS_BASE_URL || "https://lmis.gov.et",
    category: "ethiopia",
    automatable: true,
    proxiable: true,
    icon: "🇪🇹",
    description: "Ethiopia Labour Market Information System – overseas worker registration",
    color: "#22863a",
  },

  // ── Saudi Arabia ─────────────────────────────────────────────────────────
  {
    id: "musaned",
    name: "Tawtheeq Musaned",
    nameAmh: "ታዉቲቅ ሙሳነድ",
    nameAr: "توثيق مساند",
    url: process.env.TAWTHEEQ_MUSANED_URL || "https://tawtheeq.musaned.com.sa/",
    category: "saudi",
    automatable: true,
    proxiable: true,
    icon: "📑",
    description: "Saudi HRSD domestic worker employment contract portal",
    color: "#166534",
  },
  {
    id: "enjaz_mofa",
    name: "MOFA – Enjaz Visa",
    nameAmh: "ሞፋ – አንጃዝ ቪዛ",
    nameAr: "وزارة الخارجية – إنجاز",
    url: process.env.MOFA_URL || "https://visa.mofa.gov.sa/",
    category: "saudi",
    automatable: false,
    proxiable: true,
    icon: "🛂",
    description: "Saudi Ministry of Foreign Affairs visa application (requires B2B agreement)",
    color: "#1d4ed8",
  },
  {
    id: "tasheer",
    name: "Tasheer Visa Center",
    nameAmh: "ታሼር ቪዛ ማዕከል",
    nameAr: "مركز تأشير",
    url: process.env.TASHEER_URL || "https://vc.tasheer.com/home",
    category: "saudi",
    automatable: false,
    proxiable: true,
    icon: "🏢",
    description: "Saudi PIF–owned visa center (B2B API available via formal agreement)",
    color: "#7c3aed",
  },
  {
    id: "saudi_hrsd",
    name: "Saudi HRSD",
    nameAmh: "ሳውዲ HRSD",
    nameAr: "وزارة الموارد البشرية",
    url: process.env.SAUDI_HRSD_URL || "https://hrsd.gov.sa/",
    category: "saudi",
    automatable: false,
    proxiable: true,
    icon: "🇸🇦",
    description: "Ministry of Human Resources and Social Development portal for labor policies",
    color: "#15803d",
  },
  {
    id: "easyenjaz",
    name: "EasyEnjaz",
    nameAmh: "ኢዚ አንጃዝ",
    nameAr: "إيزي إنجاز",
    url: process.env.EASYENJAZ_URL || "https://www.easyenjaz.net/",
    category: "saudi",
    automatable: false,
    proxiable: true,
    icon: "⚡",
    description: "Third-party helper portal for Saudi visa and Enjaz fee payments",
    color: "#f59e0b",
  },

  // ── Medical ───────────────────────────────────────────────────────────────
  {
    id: "wafid",
    name: "Wafid Medical",
    nameAmh: "ዋፊድ ሕክምና",
    nameAr: "وافد الطبي",
    url: process.env.WAFID_URL || "https://wafid.com/en/medical-status-search/",
    category: "medical",
    automatable: false,
    proxiable: true,
    icon: "🏥",
    description: "GCC Health Council pre-employment medical examination status portal",
    color: "#0891b2",
  },

  // ── GCC Countries ─────────────────────────────────────────────────────────
  {
    id: "uae_icp",
    name: "UAE ICP",
    nameAmh: "ዩኤኢ ICP",
    nameAr: "الهوية والجنسية الإماراتية",
    url: process.env.UAE_ICP_URL || "https://icp.gov.ae/en/",
    category: "gcc",
    automatable: false,
    proxiable: true,
    icon: "🇦🇪",
    description: "UAE Federal Authority for Identity, Citizenship, Customs & Ports Security",
    color: "#dc2626",
  },
  {
    id: "kuwait_moi",
    name: "Kuwait MOI eVisa",
    nameAmh: "ኩዌት ቪዛ",
    nameAr: "الكويت - الداخلية",
    url: process.env.KUWAIT_MOI_URL || "https://evisa.moi.gov.kw/",
    category: "gcc",
    automatable: false,
    proxiable: true,
    icon: "🇰🇼",
    description: "Kuwait Ministry of Interior electronic visa portal",
    color: "#059669",
  },
  {
    id: "qatar_visa",
    name: "Qatar Visa",
    nameAmh: "ቃጠር ቪዛ",
    nameAr: "تأشيرة قطر",
    url: process.env.QATAR_VISA_URL || "https://portal.moi.gov.qa/wps/portal/MOIInternet/services/inquiries/visainquiry",
    category: "gcc",
    automatable: false,
    proxiable: true,
    icon: "🇶🇦",
    description: "Qatar Ministry of Interior electronic visa portal",
    color: "#7e22ce",
  },
  {
    id: "oman_visa",
    name: "Oman eVisa",
    nameAmh: "ኦማን ቪዛ",
    nameAr: "تأشيرة عُمان",
    url: process.env.OMAN_VISA_URL || "https://evisa.rop.gov.om/",
    category: "gcc",
    automatable: false,
    proxiable: true,
    icon: "🇴🇲",
    description: "Royal Oman Police electronic visa portal",
    color: "#b45309",
  },
  {
    id: "bahrain_visa",
    name: "Bahrain eVisa",
    nameAmh: "ባህሬን ቪዛ",
    nameAr: "تأشيرة البحرين",
    url: process.env.BAHRAIN_VISA_URL || "https://www.evisa.gov.bh/",
    category: "gcc",
    automatable: false,
    proxiable: true,
    icon: "🇧🇭",
    description: "Kingdom of Bahrain electronic visa services portal",
    color: "#e11d48",
  },
  {
    id: "jordan_moi",
    name: "Jordan MOI eVisa",
    nameAmh: "ዮርዳኖስ ቪዛ",
    nameAr: "تأشيرة الأردن",
    url: process.env.JORDAN_MOI_URL || "https://eservices.moi.gov.jo/",
    category: "gcc",
    automatable: false,
    proxiable: true,
    icon: "🇯🇴",
    description: "Jordan Ministry of Interior electronic services and visa portal",
    color: "#007a3d",
  },
];

module.exports = PORTALS;
