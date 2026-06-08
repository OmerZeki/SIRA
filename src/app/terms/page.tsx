"use client";

import { PublicLayout } from "@/components/sira/PublicLayout";
import { useCurrentLocale } from "@/components/sira/LanguageSwitcher";
import { getDictionary } from "@/lib/i18n";

export default function TermsPage() {
  const locale = useCurrentLocale();
  const t = getDictionary(locale);

  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">{t.static.terms}</h1>
        <p className="text-xs text-ink-tertiary mb-10">
          {t.static.lastUpdated}: June 2024
        </p>

        <div className="space-y-8 text-sm text-ink-subtle leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-ink mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the SIRA platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink mb-2">2. Service Description</h2>
            <p>
              SIRA is a recruitment automation platform that enables licensed Ethiopian recruitment agencies to manage candidate profiles, perform automated document processing, and interact with government portals such as LMIS and Musaned.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink mb-2">3. User Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>You must be a licensed recruitment agency to use the platform.</li>
              <li>You are responsible for providing accurate candidate data.</li>
              <li>You must comply with all applicable laws in Ethiopia and destination countries.</li>
              <li>You must not misuse or attempt to circumvent any portal automation features.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink mb-2">4. Data Usage</h2>
            <p>
              You grant SIRA the right to process candidate data solely for the purpose of facilitating recruitment workflows, including automated submissions to authorized government portals.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink mb-2">5. Limitation of Liability</h2>
            <p>
              SIRA is provided on an &quot;as is&quot; basis. While we strive for accuracy and reliability, we are not liable for errors in OCR processing, portal automation failures, or changes in third-party portal interfaces. Agencies remain responsible for verifying all submissions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink mb-2">6. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account if you violate these terms or engage in unauthorized activities.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-ink mb-2">7. Governing Law</h2>
            <p>
              These terms shall be governed by and construed in accordance with the laws of Ethiopia.
            </p>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
