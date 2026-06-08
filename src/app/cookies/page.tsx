"use client";

import { PublicLayout } from "@/components/sira/PublicLayout";
import { useCurrentLocale } from "@/components/sira/LanguageSwitcher";
import { getDictionary } from "@/lib/i18n";

export default function CookiesPage() {
  const locale = useCurrentLocale();
  const t = getDictionary(locale);

  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">{t.static.cookies}</h1>
        <p className="text-xs text-ink-tertiary mb-10">
          {t.static.lastUpdated}: June 2024
        </p>

        <div className="space-y-8 text-sm text-ink-subtle leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-ink mb-2">1. What Are Cookies</h2>
            <p>
              Cookies are small text files placed on your device to store certain information about your preferences and activities. They help us provide a better user experience.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink mb-2">2. How We Use Cookies</h2>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Essential Cookies:</strong> Required for basic platform functionality such as authentication and session management.</li>
              <li><strong>Preference Cookies:</strong> Store your language preference and display settings.</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how users interact with the platform so we can improve it.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink mb-2">3. Managing Cookies</h2>
            <p>
              Most web browsers allow you to control cookies through their settings. You may choose to block or delete cookies, but please note that some features of the platform may not function properly without them.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink mb-2">4. Third-Party Cookies</h2>
            <p>
              We do not use third-party advertising cookies. Any third-party cookies are limited to authentication and essential service providers (e.g., Cloudinary for file uploads).
            </p>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
