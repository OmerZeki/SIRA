"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Globe,
  ExternalLink,
  Camera,
  Zap,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Maximize2,
  Minimize2,
  RefreshCw,
  Shield,
  Info,
  ChevronRight,
} from "lucide-react";
import { useCurrentLocale } from "@/components/sira/LanguageSwitcher";
import { getDictionary } from "@/lib/i18n";

// ─── Portal Data (mirrors sira-portals/portals.js) ────────────────────────────
interface Portal {
  id: string;
  name: string;
  nameAmh: string;
  nameAr: string;
  url: string;
  category: "ethiopia" | "saudi" | "gcc" | "medical";
  automatable: boolean;
  proxiable: boolean;
  icon: string;
  description: string;
  color: string;
}

const PORTALS: Portal[] = [
  {
    id: "ethiopian_lmis",
    name: "Ethiopian E-LMIS",
    nameAmh: "ኢ-LMIS",
    nameAr: "نظام LMIS الإثيوبي",
    url: "https://lmis.gov.et",
    category: "ethiopia",
    automatable: true,
    proxiable: true,
    icon: "🇪🇹",
    description: "Ethiopia Labour Market Information System – overseas worker registration",
    color: "#22863a",
  },
  {
    id: "musaned",
    name: "Tawtheeq Musaned",
    nameAmh: "ታዉቲቅ ሙሳነድ",
    nameAr: "توثيق مساند",
    url: "https://tawtheeq.musaned.com.sa/",
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
    url: "https://visa.mofa.gov.sa/",
    category: "saudi",
    automatable: false,
    proxiable: true,
    icon: "🛂",
    description: "Saudi Ministry of Foreign Affairs visa application",
    color: "#1d4ed8",
  },
  {
    id: "tasheer",
    name: "Tasheer Visa Center",
    nameAmh: "ታሼር ቪዛ ማዕከል",
    nameAr: "مركز تأشير",
    url: "https://vc.tasheer.com/home",
    category: "saudi",
    automatable: false,
    proxiable: true,
    icon: "🏢",
    description: "Saudi PIF-owned visa center with B2B API",
    color: "#7c3aed",
  },
  {
    id: "saudi_hrsd",
    name: "Saudi HRSD",
    nameAmh: "ሳውዲ HRSD",
    nameAr: "وزارة الموارد البشرية",
    url: "https://hrsd.gov.sa/",
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
    url: "https://www.easyenjaz.net/",
    category: "saudi",
    automatable: false,
    proxiable: true,
    icon: "⚡",
    description: "Third-party helper portal for Saudi visa and Enjaz fee payments",
    color: "#f59e0b",
  },
  {
    id: "wafid",
    name: "Wafid Medical",
    nameAmh: "ዋፊድ ሕክምና",
    nameAr: "وافد الطبي",
    url: "https://wafid.com/en/medical-status-search/",
    category: "medical",
    automatable: false,
    proxiable: true,
    icon: "🏥",
    description: "GCC Health Council pre-employment medical examination",
    color: "#0891b2",
  },
  {
    id: "uae_icp",
    name: "UAE ICP",
    nameAmh: "ዩኤኢ ICP",
    nameAr: "الهوية والجنسية الإماراتية",
    url: "https://icp.gov.ae/en/",
    category: "gcc",
    automatable: false,
    proxiable: true,
    icon: "🇦🇪",
    description: "UAE Federal Authority for Identity and Citizenship",
    color: "#dc2626",
  },
  {
    id: "kuwait_moi",
    name: "Kuwait MOI eVisa",
    nameAmh: "ኩዌት ቪዛ",
    nameAr: "الكويت - الداخلية",
    url: "https://evisa.moi.gov.kw/",
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
    url: "https://www.moi.gov.qa/service/evisa",
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
    url: "https://evisa.rop.gov.om/",
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
    url: "https://www.evisa.gov.bh/",
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
    url: "https://eservices.moi.gov.jo/",
    category: "gcc",
    automatable: false,
    proxiable: true,
    icon: "🇯🇴",
    description: "Jordan Ministry of Interior electronic services and visa portal",
    color: "#007a3d",
  },
];

const CATEGORIES = [
  { key: "all", labelKey: null, label: "All Portals" },
  { key: "ethiopia", labelKey: "categoryEthiopia" },
  { key: "saudi", labelKey: "categorySaudi" },
  { key: "medical", labelKey: "categoryMedical" },
  { key: "gcc", labelKey: "categoryGcc" },
] as const;

const PORTAL_SERVICE_URL =
  process.env.NEXT_PUBLIC_PORTAL_SERVICE_URL || "https://sira-portals.onrender.com";

// ─── Portal Frame Component ────────────────────────────────────────────────────
function PortalFrame({
  portal,
  onClose,
}: {
  portal: Portal;
  onClose: () => void;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const proxyUrl = `${PORTAL_SERVICE_URL}/proxy?url=${encodeURIComponent(portal.url)}`;

  const takeScreenshot = async () => {
    setScreenshotLoading(true);
    try {
      const res = await fetch("/api/portals/screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: portal.url }),
      });
      if (res.ok) {
        const blob = await res.blob();
        setScreenshotUrl(URL.createObjectURL(blob));
      }
    } catch {
      // screenshot failed silently
    } finally {
      setScreenshotLoading(false);
    }
  };

  const height = isFullscreen ? "calc(100vh - 120px)" : "520px";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-surface-1 border border-hairline rounded-xl overflow-hidden flex flex-col shadow-2xl transition-all duration-300 ${
          isFullscreen ? "w-full h-full" : "w-full max-w-5xl"
        }`}
        style={{ height: isFullscreen ? "100%" : "85vh" }}
      >
        {/* Frame Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-hairline bg-surface-2 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{portal.icon}</span>
            <div>
              <h3 className="text-sm font-semibold text-ink">{portal.name}</h3>
              <p className="text-[11px] text-ink-tertiary truncate max-w-xs">{portal.url}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={takeScreenshot}
              disabled={screenshotLoading}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded border border-hairline text-ink-subtle hover:text-ink hover:bg-surface-3 transition"
              title="Take a Playwright screenshot"
            >
              {screenshotLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5" />
              )}
              Screenshot
            </button>
            <button
              onClick={() => window.open(portal.url, "_blank")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded border border-hairline text-ink-subtle hover:text-ink hover:bg-surface-3 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open
            </button>
            <button
              onClick={() => {
                setIsLoading(true);
                setHasError(false);
                if (iframeRef.current) {
                  iframeRef.current.src = proxyUrl;
                }
              }}
              className="p-1.5 rounded border border-hairline text-ink-subtle hover:text-ink hover:bg-surface-3 transition"
              title="Reload"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded border border-hairline text-ink-subtle hover:text-ink hover:bg-surface-3 transition"
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded border border-hairline text-ink-subtle hover:text-error hover:bg-error/10 transition font-bold text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Screenshot preview (if taken) */}
        {screenshotUrl && (
          <div className="relative border-b border-hairline flex-shrink-0">
            <div className="flex items-center justify-between px-4 py-2 bg-primary/5 border-b border-hairline">
              <span className="text-[11px] font-semibold text-primary flex items-center gap-1.5">
                <Camera className="w-3 h-3" />
                Playwright Screenshot — Live portal state
              </span>
              <button
                onClick={() => setScreenshotUrl(null)}
                className="text-[10px] text-ink-tertiary hover:text-ink"
              >
                Dismiss
              </button>
            </div>
            <img
              src={screenshotUrl}
              alt={`${portal.name} screenshot`}
              className="w-full max-h-48 object-cover object-top"
            />
          </div>
        )}

        {/* iframe Content */}
        <div className="relative flex-1 overflow-hidden">
          {isLoading && !hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-1 z-10 gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-ink-subtle">Loading {portal.name}…</p>
              <p className="text-xs text-ink-tertiary">Via SIRA proxy service</p>
            </div>
          )}
          {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-1 z-10 gap-4">
              <div className="p-4 rounded-full bg-error/10 border border-error/20">
                <AlertCircle className="w-8 h-8 text-error" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-ink">Portal could not be embedded</p>
                <p className="text-xs text-ink-tertiary max-w-xs">
                  This portal blocks iframe embedding even through the proxy.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={takeScreenshot}
                  disabled={screenshotLoading}
                  className="btn-secondary flex items-center gap-2 text-sm"
                >
                  {screenshotLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                  Take Screenshot
                </button>
                <button
                  onClick={() => window.open(portal.url, "_blank")}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in New Tab
                </button>
              </div>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={proxyUrl}
            title={portal.name}
            className="w-full h-full border-0"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Portal Card Component ─────────────────────────────────────────────────────
function PortalCard({
  portal,
  locale,
  onOpen,
}: {
  portal: Portal;
  locale: string;
  onOpen: (portal: Portal) => void;
}) {
  const displayName =
    locale === "am" ? portal.nameAmh : locale === "ar" ? portal.nameAr : portal.name;

  return (
    <div className="group bg-surface-1 border border-hairline rounded-xl overflow-hidden hover:border-primary/40 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 flex flex-col hover:-translate-y-0.5">
      {/* Card Header with color accent */}
      <div
        className="h-1 w-full"
        style={{ background: `linear-gradient(90deg, ${portal.color}, ${portal.color}80)` }}
      />

      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Icon + Name */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-surface-2 border border-hairline flex items-center justify-center text-xl group-hover:border-primary/30 transition-colors flex-shrink-0">
              {portal.icon}
            </span>
            <div>
              <h3 className="font-semibold text-ink text-sm leading-tight group-hover:text-primary transition-colors">{displayName}</h3>
              <p className="text-[11px] text-ink-tertiary mt-0.5 truncate max-w-[150px]">
                {new URL(portal.url).hostname}
              </p>
            </div>
          </div>
          {/* Automation badge */}
          {portal.automatable ? (
            <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success/10 border border-success/20 text-success">
              <Zap className="w-2.5 h-2.5" />
              Auto
            </span>
          ) : (
            <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-3 border border-hairline text-ink-tertiary">
              <Globe className="w-2.5 h-2.5" />
              Manual
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-ink-subtle leading-relaxed line-clamp-2 flex-1">{portal.description}</p>

        {/* Status indicators */}
        <div className="flex flex-wrap gap-1.5">
          {portal.proxiable && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/5 border border-primary/15 text-primary/80 font-medium">
              Proxy iframe
            </span>
          )}
          {portal.automatable && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/5 border border-success/15 text-success font-medium">
              Playwright
            </span>
          )}
          {portal.category === "saudi" && !portal.automatable && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/5 border border-warning/15 text-warning font-medium">
              B2B Required
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-5 pb-4 flex gap-2">
        <button
          onClick={() => onOpen(portal)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/50 transition-all duration-150"
        >
          <Globe className="w-3.5 h-3.5" />
          Open in Hub
        </button>
        <button
          onClick={() => window.open(portal.url, "_blank")}
          className="p-2 rounded-lg border border-hairline text-ink-subtle hover:text-ink hover:bg-surface-2 transition-all duration-150"
          title="Open in new tab"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function PortalsPage() {
  const locale = useCurrentLocale();
  const t = getDictionary(locale);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [openPortal, setOpenPortal] = useState<Portal | null>(null);
  const [serviceStatus, setServiceStatus] = useState<"loading" | "ok" | "error">("loading");

  // Check portal service health
  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch(`${PORTAL_SERVICE_URL}/health`, { signal: AbortSignal.timeout(5000) });
        setServiceStatus(res.ok ? "ok" : "error");
      } catch {
        setServiceStatus("error");
      }
    }
    checkHealth();
  }, []);

  const filtered =
    activeCategory === "all"
      ? PORTALS
      : PORTALS.filter((p) => p.category === activeCategory);

  const grouped = {
    ethiopia: filtered.filter((p) => p.category === "ethiopia"),
    saudi: filtered.filter((p) => p.category === "saudi"),
    medical: filtered.filter((p) => p.category === "medical"),
    gcc: filtered.filter((p) => p.category === "gcc"),
  };

  const categoryLabel = (key: string) => {
    switch (key) {
      case "ethiopia": return t.portalHub.categoryEthiopia;
      case "saudi":    return t.portalHub.categorySaudi;
      case "medical":  return t.portalHub.categoryMedical;
      case "gcc":      return t.portalHub.categoryGcc;
      default:         return key;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-ink">{t.portalHub.title}</h1>
              <p className="text-sm text-ink-subtle">{t.portalHub.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Service Health Badge */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-hairline bg-surface-1 self-start sm:self-auto">
          {serviceStatus === "loading" && (
            <>
              <Loader2 className="w-3.5 h-3.5 text-ink-tertiary animate-spin" />
              <span className="text-xs text-ink-tertiary">Connecting to Portal Service…</span>
            </>
          )}
          {serviceStatus === "ok" && (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              <span className="text-xs text-success font-medium">Portal Service Online</span>
            </>
          )}
          {serviceStatus === "error" && (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-warning" />
              <span className="text-xs text-warning font-medium">Portal Service Offline</span>
            </>
          )}
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
        <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-xs text-ink-subtle leading-relaxed">{t.portalHub.proxyNote}</p>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
              activeCategory === cat.key
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-surface-1 border-hairline text-ink-subtle hover:text-ink hover:border-primary/30"
            }`}
          >
            {cat.labelKey ? t.portalHub[cat.labelKey] : "All Portals"}
          </button>
        ))}
        <div className="ml-auto text-xs text-ink-tertiary flex items-center">
          {filtered.length} portal{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Portal Grid — grouped by category */}
      {(["ethiopia", "saudi", "medical", "gcc"] as const).map((cat) => {
        if (grouped[cat].length === 0) return null;
        return (
          <div key={cat} className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-ink-tertiary">
                {categoryLabel(cat)}
              </h2>
              <div className="flex-1 h-px bg-hairline" />
              <span className="text-[10px] text-ink-tertiary">{grouped[cat].length}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {grouped[cat].map((portal) => (
                <PortalCard
                  key={portal.id}
                  portal={portal}
                  locale={locale}
                  onOpen={(p) => setOpenPortal(p)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Quick Automation Legend */}
      <div className="pt-4 border-t border-hairline">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-ink-tertiary mb-3">
          Automation Tiers
        </h3>
        <div className="flex flex-wrap gap-4 text-xs text-ink-subtle">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-success/10 border border-success/20 flex items-center justify-center">
              <Zap className="w-3 h-3 text-success" />
            </span>
            <span>Playwright automation — runs headless on SIRA portal service</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Globe className="w-3 h-3 text-primary" />
            </span>
            <span>Proxy iframe — stripped X-Frame-Options, embedded in hub</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-warning/10 border border-warning/20 flex items-center justify-center">
              <Shield className="w-3 h-3 text-warning" />
            </span>
            <span>B2B Agreement required with MOFA / Tasheer</span>
          </div>
        </div>
      </div>

      {/* Portal Frame Modal */}
      {openPortal && (
        <PortalFrame portal={openPortal} onClose={() => setOpenPortal(null)} />
      )}
    </div>
  );
}
