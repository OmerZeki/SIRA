"use client";

import Link from "next/link";
import { ArrowRight, Cpu, FileBadge, ShieldCheck, Zap } from "lucide-react";
import { LanguageSwitcher, useCurrentLocale } from "@/components/sira/LanguageSwitcher";
import { ThemeToggle } from "@/components/sira/ThemeToggle";
import { getDictionary, withLocale } from "@/lib/i18n";

export default function Home() {
  const locale = useCurrentLocale();
  const t = getDictionary(locale);

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#5e6ad2 1px, transparent 1px), linear-gradient(90deg, #5e6ad2 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Decorative gradient blur */}
      <div className="absolute top-[-20%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] bg-[#5e6ad2]/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto h-20 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-lg bg-[#5e6ad2]/10 border border-[#5e6ad2]/30 flex items-center justify-center font-bold text-[#828fff] text-xl font-display">
            ሥ
          </span>
          <span className="font-bold text-xl tracking-widest text-ink font-display">SIRA</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
          <Link href={withLocale("/login", locale)} className="text-sm font-medium text-ink-subtle hover:text-ink transition">
            {t.landing.signIn}
          </Link>
          <Link href={withLocale("/register", locale)} className="btn-primary py-2 px-4 text-xs font-semibold">
            {t.landing.getStarted}
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto px-6 flex flex-col items-center justify-center text-center py-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5e6ad2]/10 border border-[#5e6ad2]/20 text-[11px] text-[#828fff] font-medium tracking-wide mb-6 uppercase">
          <Zap className="w-3.5 h-3.5 animate-pulse" />
          {t.landing.heroTagline}
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-ink max-w-3xl leading-[1.1] font-display">
          {t.landing.heroTitlePart1}<span className="bg-gradient-to-r from-[#828fff] to-[#5e6ad2] bg-clip-text text-transparent">{t.landing.heroTitlePart2}</span>.
        </h1>

        <p className="mt-6 text-sm md:text-base text-ink-subtle max-w-xl leading-relaxed">
          {t.landing.heroSubtitle}
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center w-full max-w-xs sm:max-w-none">
          <Link href={withLocale("/register", locale)} className="btn-primary py-3 px-6 text-sm font-semibold flex items-center justify-center gap-2">
            {t.landing.registerAgency}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href={withLocale("/login", locale)} className="btn-secondary py-3 px-6 text-sm font-semibold flex items-center justify-center border border-hairline hover:border-hairline-strong transition">
            {t.landing.agencySignIn}
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mt-24">
          {[
            {
              icon: FileBadge,
              title: t.landing.featureOcrTitle,
              desc: t.landing.featureOcrDesc,
            },
            {
              icon: Cpu,
              title: t.landing.featureSyncTitle,
              desc: t.landing.featureSyncDesc,
            },
            {
              icon: ShieldCheck,
              title: t.landing.featureVaultTitle,
              desc: t.landing.featureVaultDesc,
            },
          ].map((feat, idx) => (
            <div key={idx} className="bg-surface-1 border border-hairline rounded-xl p-6 text-left hover:border-hairline-strong transition-all">
              <div className="w-10 h-10 rounded-lg bg-[#5e6ad2]/10 border border-[#5e6ad2]/20 flex items-center justify-center text-primary mb-4">
                <feat.icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-ink mb-2">{feat.title}</h3>
              <p className="text-xs text-ink-subtle leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto h-auto py-6 px-6 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-tertiary">
        <span>&copy; {new Date().getFullYear()} SIRA (ሥራ) Platform. All rights reserved.</span>
        <div className="flex gap-4">
          <Link href={withLocale("/terms", locale)} className="hover:text-ink transition">{t.static.terms}</Link>
          <Link href={withLocale("/privacy", locale)} className="hover:text-ink transition">{t.static.privacy}</Link>
          <Link href={withLocale("/cookies", locale)} className="hover:text-ink transition">{t.static.cookies}</Link>
          <Link href={withLocale("/contact", locale)} className="hover:text-ink transition">{t.static.contact}</Link>
        </div>
      </footer>
    </div>
  );
}
