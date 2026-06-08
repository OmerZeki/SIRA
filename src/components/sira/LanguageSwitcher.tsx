"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  DEFAULT_LOCALE,
  LOCALES,
  Locale,
  getLocaleFromPath,
  localeNames,
  withLocale,
} from "@/lib/i18n";

function setLocaleCookie(locale: Locale) {
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
}

export function useCurrentLocale(): Locale {
  const pathname = usePathname();
  return getLocaleFromPath(pathname ?? "/") ?? DEFAULT_LOCALE;
}

export function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = useCurrentLocale();

  const switchLocale = (locale: Locale) => {
    setLocaleCookie(locale);
    router.push(withLocale(pathname ?? "/", locale));
  };

  return (
    <label className="flex items-center gap-2 text-xs text-ink-muted">
      <span className="sr-only">Language</span>
      <select
        value={currentLocale}
        onChange={(event) => switchLocale(event.target.value as Locale)}
        className="bg-surface-2 border border-hairline rounded-md px-2 py-1 text-xs text-ink outline-none focus:border-primary"
      >
        {LOCALES.map((locale) => (
          <option key={locale} value={locale}>
            {localeNames[locale]}
          </option>
        ))}
      </select>
    </label>
  );
}

export default LanguageSwitcher;
