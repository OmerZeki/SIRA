"use client";

import { PublicLayout } from "@/components/sira/PublicLayout";
import { useCurrentLocale } from "@/components/sira/LanguageSwitcher";
import { getDictionary } from "@/lib/i18n";

export default function PrivacyPage() {
  const locale = useCurrentLocale();
  const t = getDictionary(locale);

  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">{t.static.privacy}</h1>
        <p className="text-xs text-ink-tertiary mb-10">
          {t.static.lastUpdated}: June 2024
        </p>

        <div className="space-y-8 text-sm text-ink-subtle leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-ink mb-2">1. Introduction</h2>
            <p>
              SIRA (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our recruitment platform. By using SIRA, you agree to the terms outlined in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink mb-2">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Account Information:</strong> Agency name, email, password hash, and profile details.</li>
              <li><strong>Candidate Data:</strong> Passport details, personal information, photos, and documents uploaded by your agency.</li>
              <li><strong>Portal Credentials:</strong> Encrypted usernames and passwords for third-party portals (e.g., LMIS, Musaned).</li>
              <li><strong>Usage Data:</strong> IP address, browser type, and pages visited.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink mb-2">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>To provide and maintain our recruitment automation services.</li>
              <li>To process and manage candidate data and portal submissions.</li>
              <li>To improve our platform, including AI-powered features like OCR.</li>
              <li>To communicate important updates and service information.</li>
              <li>To comply with legal obligations and regulatory requirements.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink mb-2">4. Data Security</h2>
            <p>
              We implement industry-standard security measures, including AES-256-GCM encryption for sensitive credentials, TLS for data in transit, and strict access controls. All candidate and agency data is stored in secure cloud databases.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink mb-2">5. Data Sharing</h2>
            <p>
              We do not sell your data to third parties. We only share data with government portals (e.g., LMIS, Musaned) as required for candidate processing, and with service providers necessary for platform operations (cloud hosting, email delivery).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink mb-2">6. Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your personal data. To exercise these rights, please contact us through the Contact Us page.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink mb-2">7. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes via email or through the platform.
            </p>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
