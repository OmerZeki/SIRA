"use client";

import { PublicLayout } from "@/components/sira/PublicLayout";
import { useCurrentLocale } from "@/components/sira/LanguageSwitcher";
import { getDictionary } from "@/lib/i18n";
import { Cpu, FileBadge, ShieldCheck, Globe } from "lucide-react";

export default function AboutPage() {
  const locale = useCurrentLocale();
  const t = getDictionary(locale);

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-3">{t.static.about}</h1>
          <p className="text-sm text-ink-subtle max-w-xl mx-auto">
            SIRA is the premier recruitment automation platform for Ethiopian overseas employment agencies, bridging the gap between manual workflows and AI-powered efficiency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-surface-1 border border-hairline rounded-lg p-6">
            <FileBadge className="w-8 h-8 text-primary mb-3" />
            <h3 className="text-sm font-semibold text-ink mb-1">AI Passport OCR</h3>
            <p className="text-xs text-ink-subtle">
              Extract candidate details, photos, and MRZ data from passport scans in seconds with industry-leading accuracy.
            </p>
          </div>
          <div className="bg-surface-1 border border-hairline rounded-lg p-6">
            <Cpu className="w-8 h-8 text-primary mb-3" />
            <h3 className="text-sm font-semibold text-ink mb-1">Automated Portal Sync</h3>
            <p className="text-xs text-ink-subtle">
              Seamlessly connect with LMIS, Musaned, EasyEnjaz, and other portals with headless automation.
            </p>
          </div>
          <div className="bg-surface-1 border border-hairline rounded-lg p-6">
            <ShieldCheck className="w-8 h-8 text-primary mb-3" />
            <h3 className="text-sm font-semibold text-ink mb-1">Secure & Compliant</h3>
            <p className="text-xs text-ink-subtle">
              Military-grade AES-256-GCM encryption for credentials and full compliance with Ethiopian data protection laws.
            </p>
          </div>
          <div className="bg-surface-1 border border-hairline rounded-lg p-6">
            <Globe className="w-8 h-8 text-primary mb-3" />
            <h3 className="text-sm font-semibold text-ink mb-1">Multi-Portal Support</h3>
            <p className="text-xs text-ink-subtle">
              Connect with Wafid, Tasheer, MOFA, and other critical government portals for end-to-end candidate processing.
            </p>
          </div>
        </div>

        <div className="bg-surface-1 border border-hairline rounded-lg p-8 text-center">
          <h2 className="text-lg font-semibold text-ink mb-2">Our Mission</h2>
          <p className="text-sm text-ink-subtle max-w-2xl mx-auto">
            To transform Ethiopian overseas recruitment through intelligent automation—reducing paperwork, eliminating errors, and ensuring every candidate reaches their destination safely and efficiently.
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}
