"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle2, Key } from "lucide-react";
import { LanguageSwitcher, useCurrentLocale } from "@/components/sira/LanguageSwitcher";
import { ThemeToggle } from "@/components/sira/ThemeToggle";
import { getDictionary, withLocale } from "@/lib/i18n";

export default function RegisterPage() {
  const router = useRouter();
  const locale = useCurrentLocale();
  const t = getDictionary(locale);
  const [formData, setFormData] = useState({
    agencyName: "",
    email: "",
    password: "",
    confirmPassword: "",
    licenseNumber: "",
    registrationCode: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError(t.auth.passwordsMismatch);
      return;
    }

    if (formData.password.length < 8) {
      setError(t.auth.passwordMinLength);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyName: formData.agencyName,
          email: formData.email,
          password: formData.password,
          licenseNumber: formData.licenseNumber || null,
          registrationCode: formData.registrationCode,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t.auth.registrationFailed);
      } else {
        setSuccess(true);
        setTimeout(() => router.push(withLocale("/login", locale)), 3000);
      }
    } catch {
      setError(t.auth.unexpectedError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-4 py-10">
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#5e6ad2 1px, transparent 1px), linear-gradient(90deg, #5e6ad2 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="relative w-full max-w-sm">
        <div className="absolute -top-8 right-0 flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="w-10 h-10 rounded-lg bg-[#5e6ad2]/10 border border-[#5e6ad2]/30 flex items-center justify-center font-bold text-[#828fff] text-xl">
              ሥ
            </span>
            <span className="font-bold text-2xl tracking-widest text-ink">SIRA</span>
          </div>
          <p className="text-sm text-ink-subtle">{t.auth.createAgencyAccount}</p>
        </div>

        <div className="bg-surface-1 border border-hairline rounded-xl p-8">
          <h1 className="text-lg font-semibold text-ink mb-1 text-center">{t.auth.registerAgency}</h1>              <p className="text-xs text-ink-subtle text-center mb-6">
                {t.auth.startInMinutes}
              </p>

              {/* Registration Code Info Banner */}
              <div className="mb-6 p-3 bg-[#5e6ad2]/5 border border-[#5e6ad2]/20 rounded-lg flex items-start gap-2.5">
                <Key className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-ink">{t.static.needCode}</p>
                  <p className="text-[10px] text-ink-tertiary mt-0.5">
                    {t.static.payInstructions}{" "}
                    <Link href={withLocale("/contact", locale)} className="text-primary hover:text-primary-hover font-medium underline">
                      {t.static.contactFirst}
                    </Link>
                  </p>
                </div>
              </div>

          {success ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="w-10 h-10 text-success" />
              <p className="text-sm font-semibold text-ink">{t.auth.agencyRegistered}</p>
              <p className="text-xs text-ink-subtle">{t.auth.redirectingToLogin}</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-md flex items-start gap-2 text-xs text-error">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1.5">{t.auth.agencyName} *</label>
                  <input
                    type="text"
                    name="agencyName"
                    value={formData.agencyName}
                    onChange={handleChange}
                    placeholder={t.auth.agencyNamePlaceholder}
                    required
                    className="w-full input-text"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1.5">{t.auth.email} *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t.auth.ownerEmailPlaceholder}
                    required
                    className="w-full input-text"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1.5">{t.auth.registrationCode} *</label>
                  <input
                    type="text"
                    name="registrationCode"
                    value={formData.registrationCode}
                    onChange={handleChange}
                    placeholder={t.auth.registrationCodePlaceholder}
                    required
                    className="w-full input-text"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1.5">{t.auth.licenseNumber}</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    placeholder={t.auth.licensePlaceholder}
                    className="w-full input-text"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1.5">{t.auth.password} *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={t.auth.passwordPlaceholder}
                      required
                      className="w-full input-text pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink-muted"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1.5">{t.auth.confirmPassword} *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder={t.auth.confirmPasswordPlaceholder}
                    required
                    className="w-full input-text"
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
                      {t.auth.creatingAgency}
                    </>
                  ) : (
                    t.auth.createSiraAgency
                  )}
                </button>
              </form>

              <p className="text-center text-xs text-ink-tertiary mt-6">
                {t.auth.alreadyRegistered}{" "}
                <Link href={withLocale("/login", locale)} className="text-primary hover:text-primary-hover font-medium">
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
