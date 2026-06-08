"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { LanguageSwitcher, useCurrentLocale } from "@/components/sira/LanguageSwitcher";
import { getDictionary, withLocale } from "@/lib/i18n";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useCurrentLocale();
  const t = getDictionary(locale);

  const token = searchParams?.get("token") || "";
  const email = searchParams?.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token || !email) {
      setError(t.auth.passwordResetFailed);
      return;
    }

    if (password.length < 8) {
      setError(t.auth.passwordMinLength);
      return;
    }

    if (password !== confirmPassword) {
      setError(t.auth.passwordsMismatch);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t.auth.passwordResetFailed);
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

  if (!token || !email) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-4">
        <div className="bg-surface-1 border border-hairline rounded-xl p-8 max-w-sm w-full text-center">
          <AlertCircle className="w-10 h-10 text-error mx-auto mb-4" />
          <p className="text-sm text-ink font-semibold mb-2">{t.auth.passwordResetFailed}</p>
          <Link href={withLocale("/login", locale)} className="text-xs text-primary hover:text-primary-hover font-medium">
            {t.auth.signIn}
          </Link>
        </div>
      </div>
    );
  }

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
          {success ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="w-10 h-10 text-success" />
              <p className="text-sm font-semibold text-ink">{t.auth.passwordResetSuccess}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-[#5e6ad2]/10 border border-[#5e6ad2]/20 flex items-center justify-center text-primary">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-ink">{t.auth.resetPassword}</h1>
                  <p className="text-xs text-ink-subtle">{t.auth.resetPasswordTitle}</p>
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
                  <label htmlFor="password" className="block text-xs font-semibold text-ink-muted mb-1.5">
                    {t.auth.newPassword}
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t.auth.passwordPlaceholder}
                      required
                      className="w-full input-text pr-10"
                      autoComplete="new-password"
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
                  <label htmlFor="confirmPassword" className="block text-xs font-semibold text-ink-muted mb-1.5">
                    {t.auth.confirmNewPassword}
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t.auth.confirmPasswordPlaceholder}
                    required
                    className="w-full input-text"
                    autoComplete="new-password"
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
                      {t.auth.resettingPassword}
                    </>
                  ) : (
                    t.auth.resetPassword
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
