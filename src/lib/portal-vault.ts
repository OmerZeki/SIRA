import type { PortalId } from "@/lib/portals";

export interface PortalVaultDefinition {
  portalId: PortalId;
  formKey: string;
  agencyField: string;
  label: string;
  url: string;
  accentClassName: string;
}

export const portalVaultDefinitions: PortalVaultDefinition[] = [
  {
    portalId: "ethiopian_lmis",
    formKey: "lmis",
    agencyField: "lmisCredentials",
    label: "Ethiopian LMIS",
    url: "https://lmis.gov.et",
    accentClassName: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  {
    portalId: "wafid",
    formKey: "wafid",
    agencyField: "wafidCredentials",
    label: "Wafid Medical",
    url: "https://wafid.com/en/medical-status-search/",
    accentClassName: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  },
  {
    portalId: "tawtheeq_musaned",
    formKey: "musaned",
    agencyField: "musanedSroCredentials",
    label: "Tawtheeq Musaned",
    url: "https://tawtheeq.musaned.com.sa/",
    accentClassName: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  {
    portalId: "easyenjaz",
    formKey: "easyEnjaz",
    agencyField: "easyEnjazCredentials",
    label: "EasyEnjaz",
    url: "https://www.easyenjaz.net/",
    accentClassName: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  },
  {
    portalId: "tasheer",
    formKey: "tasheer",
    agencyField: "tasheerCredentials",
    label: "Tasheer Visa Center",
    url: "https://vc.tasheer.com/home",
    accentClassName: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  },
  {
    portalId: "mofa",
    formKey: "mofa",
    agencyField: "mofaCredentials",
    label: "Saudi MOFA",
    url: "https://visa.mofa.gov.sa/",
    accentClassName: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  },
];

export function getPortalVaultDefinitionById(portalId: string) {
  return portalVaultDefinitions.find((definition) => definition.portalId === portalId) ?? null;
}
