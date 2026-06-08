"use client";

import Link from "next/link";
import { LanguageSwitcher, useCurrentLocale } from "@/components/sira/LanguageSwitcher";
import { ThemeToggle } from "@/components/sira/ThemeToggle";
import { getDictionary, withLocale } from "@/lib/i18n";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const locale = useCurrentLocale();
  const t = getDictionary(locale);

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <header className="h-14 border-b border-hairline bg-canvas sticky top-0 z-40 flex items-center justify-between px-4 lg:px-6">
        <Link href={withLocale("/", locale)} className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded bg-[#5e6ad2]/10 border border-[#5e6ad2]/30 flex items-center justify-center font-bold text-[#828fff] text-lg font-display">
            ሥ
          </span>
          <span className="font-bold text-sm tracking-widest text-ink font-display">SIRA</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href={withLocale("/about", locale)} className="text-xs text-ink-subtle hover:text-ink transition">
            {t.static.about}
          </Link>
          <Link href={withLocale("/contact", locale)} className="text-xs text-ink-subtle hover:text-ink transition">
            {t.static.contact}
          </Link>
          <Link href={withLocale("/login", locale)} className="text-xs text-ink-subtle hover:text-ink transition">
            {t.auth.signIn}
          </Link>
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-hairline bg-canvas px-4 py-6 lg:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-ink-tertiary">
            SIRA {t.brand.platform} 2024. {t.footer.rights}
          </p>
          <div className="flex items-center gap-4">
            <Link href={withLocale("/privacy", locale)} className="text-xs text-ink-tertiary hover:text-ink transition">
              {t.static.privacy}
            </Link>
            <Link href={withLocale("/terms", locale)} className="text-xs text-ink-tertiary hover:text-ink transition">
              {t.static.terms}
            </Link>
            <Link href={withLocale("/cookies", locale)} className="text-xs text-ink-tertiary hover:text-ink transition">
              {t.static.cookies}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
