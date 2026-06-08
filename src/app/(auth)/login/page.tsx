"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { LanguageSwitcher, useCurrentLocale } from "@/components/sira/LanguageSwitcher";
import { ThemeToggle } from "@/components/sira/ThemeToggle";
import { getDictionary, withLocale } from "@/lib/i18n";

export default function LoginPage() {
  const router = useRouter();
  const locale = useCurrentLocale();
  const t = getDictionary(locale);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t.auth.invalidCredentials);
      } else {
        router.push(withLocale("/dashboard", locale));
      }
    } catch {
      setError(t.auth.unexpectedError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-4">
      {/* Background subtle grid */}
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
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="w-10 h-10 rounded-lg bg-[#5e6ad2]/10 border border-[#5e6ad2]/30 flex items-center justify-center font-bold text-[#828fff] text-xl">
              ሥ
            </span>
            <span className="font-bold text-2xl tracking-widest text-ink">SIRA</span>
          </div>
          <p className="text-sm text-ink-subtle">{t.auth.workspaceSubtitle}</p>
        </div>

        {/* Login Card */}
        <div className="bg-surface-1 border border-hairline rounded-xl p-8 shadow-2xl">
          <h1 className="text-lg font-semibold text-ink mb-1 text-center">{t.auth.welcomeBack}</h1>
          <p className="text-xs text-ink-subtle text-center mb-6">
            {t.auth.enterCredentials}
          </p>

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

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-ink-muted">
                  {t.auth.password}
                </label>
                <Link href={withLocale("/forgot-password", locale)} className="text-[11px] text-primary hover:text-primary-hover">
                  {t.auth.forgotPassword}
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full input-text pr-10"
                  autoComplete="current-password"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-2.5 font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                      {t.auth.signingIn}
                </>
              ) : (
                t.auth.signInToSira
              )}
            </button>
          </form>

          <p className="text-center text-xs text-ink-tertiary mt-6">
            {t.auth.newAgency}{" "}
            <Link href={withLocale("/register", locale)} className="text-primary hover:text-primary-hover font-medium">
              {t.auth.registerHere}
            </Link>
          </p>
        </div>

        <p className="text-center text-[11px] text-ink-tertiary mt-6">
          SIRA — ሥራ · {t.auth.platformLabel}
        </p>
      </div>
    </div>
  );
}
