"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft, Mail } from "lucide-react";
import { LanguageSwitcher, useCurrentLocale } from "@/components/sira/LanguageSwitcher";
import { getDictionary, withLocale } from "@/lib/i18n";

export default function ForgotPasswordPage() {
  const locale = useCurrentLocale();
  const t = getDictionary(locale);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t.auth.unexpectedError);
      } else {
        setSent(true);
      }
    } catch {
      setError(t.auth.unexpectedError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-4">
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#5e6ad2 1px, transparent 1px), linear-gradient(90deg, #5e6ad2 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative w-full max-w-sm">
        <div className="absolute -top-8 right-0">
          <LanguageSwitcher />
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="w-10 h-10 rounded-lg bg-[#5e6ad2]/10 border border-[#5e6ad2]/30 flex items-center justify-center font-bold text-[#828fff] text-xl">
              ሥ
            </span>
            <span className="font-bold text-2xl tracking-widest text-ink">SIRA</span>
          </div>
        </div>

        <div className="bg-surface-1 border border-hairline rounded-xl p-8 shadow-2xl">
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="w-10 h-10 text-success" />
              <p className="text-sm font-semibold text-ink">{t.auth.resetLinkSent}</p>
              <Link
                href={withLocale("/login", locale)}
                className="mt-2 text-xs font-medium text-primary hover:text-primary-hover flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {t.auth.signIn}
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-[#5e6ad2]/10 border border-[#5e6ad2]/20 flex items-center justify-center text-primary">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-ink">{t.auth.resetPasswordTitle}</h1>
                  <p className="text-xs text-ink-subtle">{t.auth.resetPasswordSubtitle}</p>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-md flex items-start gap-2 text-xs text-error">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-ink-muted mb-1.5">
                    {t.auth.email}
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.auth.emailPlaceholder}
                    required
                    className="w-full input-text"
                    autoComplete="email"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-2.5 font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t.auth.sendingResetLink}
                    </>
                  ) : (
                    t.auth.sendResetLink
                  )}
                </button>
              </form>

              <p className="text-center text-xs text-ink-tertiary mt-6">
                <Link href={withLocale("/login", locale)} className="text-primary hover:text-primary-hover font-medium flex items-center justify-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  {t.auth.signIn}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
