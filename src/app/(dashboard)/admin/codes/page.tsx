"use client";

import React, { useState, useEffect } from "react";
import { Key, Plus, Copy, CheckCircle2, AlertCircle, Loader2, Clock, Building2, Mail, Phone, CalendarDays } from "lucide-react";
import { useCurrentLocale } from "@/components/sira/LanguageSwitcher";
import { getDictionary } from "@/lib/i18n";

interface AgencyInfo {
  id: string;
  name: string;
  email: string;
  licenseNumber: string | null;
  phone: string | null;
  createdAt: string;
}

interface RegistrationCode {
  id: string;
  code: string;
  description: string | null;
  isActive: boolean;
  usedAt: string | null;
  expiresAt: string;
  createdAt: string;
  agency: AgencyInfo | null;
}

function getDaysRemaining(expiresAt: string): { days: number; months: number; expired: boolean } {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry.getTime() - now.getTime();
  
  if (diffMs <= 0) return { days: 0, months: 0, expired: true };
  
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const months = Math.floor(days / 30);
  return { days, months, expired: false };
}

export default function AdminCodesPage() {
  const locale = useCurrentLocale();
  const t = getDictionary(locale);

  const [codes, setCodes] = useState<RegistrationCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [description, setDescription] = useState("");
  const [validityDays, setValidityDays] = useState(365);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadCodes();
  }, []);

  async function loadCodes() {
    try {
      const res = await fetch("/api/admin/codes?includeExpired=true");
      if (res.ok) {
        setCodes(await res.json());
      } else if (res.status === 401 || res.status === 403) {
        setError("You don't have permission to manage registration codes.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function generateCode() {
    setGenerating(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, validityDays }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || t.admin.generateFailed);
      }

      const newCode = await res.json();
      setCodes((prev) => [newCode, ...prev]);
      setSuccess(t.admin.codeGenerated.replace("{code}", newCode.code));
      setDescription("");
      setValidityDays(365);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  function copyToClipboard(code: string, id: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function getStatus(code: RegistrationCode): { label: string; className: string } {
    if (code.usedAt) return { label: t.admin.codeUsed, className: "text-amber-400 bg-amber-400/10" };
    if (new Date(code.expiresAt) < new Date()) return { label: t.admin.codeExpired, className: "text-error bg-error/10" };
    if (!code.isActive) return { label: t.admin.codeDisabled, className: "text-warning bg-warning/10" };
    return { label: t.admin.codeActive, className: "text-success bg-success/10" };
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(locale === "en" ? "en-US" : locale === "ar" ? "ar-SA" : "am-ET");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-headline text-ink font-semibold flex items-center gap-2">
          <Key className="w-5 h-5 text-primary" />
          {t.admin.codesTitle}
        </h2>
        <p className="text-xs text-ink-subtle">
          {t.admin.codesSubtitle}
        </p>
      </div>

      {/* Generate Code Card */}
      <div className="bg-surface-1 border border-hairline rounded-lg p-6">
        <h3 className="text-sm font-semibold text-ink mb-3">{t.admin.generateTitle}</h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">{t.admin.descriptionLabel}</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.admin.descriptionPlaceholder}
              className="w-full input-text"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">{t.admin.validityLabel}</label>
            <input
              type="number"
              value={validityDays}
              onChange={(e) => setValidityDays(Math.max(1, parseInt(e.target.value) || 365))}
              min={1}
              max={3650}
              className="w-full input-text"
            />
            <p className="text-[10px] text-ink-tertiary mt-1">
              {t.admin.validityHint.replace("{days}", String(validityDays))}
            </p>
          </div>

          <button
            onClick={generateCode}
            disabled={generating}
            className="btn-primary text-sm font-medium px-4 py-2 inline-flex items-center gap-2"
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {t.admin.generating}</>
            ) : (
              <><Plus className="w-4 h-4" /> {t.admin.generateBtn}</>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-error/10 border border-error/30 rounded-md flex items-start gap-2 text-xs text-error">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="mt-3 p-3 bg-success/10 border border-success/30 rounded-md flex items-start gap-2 text-xs text-success">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {success}
          </div>
        )}
      </div>

      {/* Codes List */}
      <div className="bg-surface-1 border border-hairline rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-hairline flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">
            {t.admin.allCodes.replace("{count}", String(codes.length))}
          </h3>
        </div>

        {codes.length === 0 ? (
          <div className="p-8 text-center text-xs text-ink-tertiary">
            {t.admin.noCodes}
          </div>
        ) : (
          <div className="divide-y divide-hairline">
            {codes.map((code) => {
              const status = getStatus(code);
              const remaining = getDaysRemaining(code.expiresAt);

              return (
                <div key={code.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Code info */}
                    <div className="flex-1 min-w-0">
                      {/* Code + Badge + Copy button */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <code className="text-sm font-mono font-bold text-ink tracking-wider">
                          {code.code}
                        </code>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${status.className}`}>
                          {status.label}
                        </span>
                        <button
                          onClick={() => copyToClipboard(code.code, code.id)}
                          className="p-1 rounded hover:bg-surface-2 text-ink-tertiary hover:text-ink transition"
                          title={t.admin.copyCode}
                        >
                          {copiedId === code.id ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Description */}
                      {code.description && (
                        <p className="text-xs text-ink-muted mb-2">{code.description}</p>
                      )}

                      {/* Dates row */}
                      <div className="flex items-center gap-3 text-[10px] text-ink-tertiary flex-wrap">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {t.admin.createdLabel}: {formatDate(code.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {t.admin.expiresLabel}: {formatDate(code.expiresAt)}
                        </span>
                        {code.usedAt && (
                          <span>
                            {t.admin.usedLabel}: {formatDate(code.usedAt)}
                          </span>
                        )}
                        {/* Time remaining indicator */}
                        {!code.usedAt && !remaining.expired && (
                          <span className={`font-semibold ${
                            remaining.days <= 30 ? "text-amber-400" : "text-ink-muted"
                          }`}>
                            {remaining.months > 0 ? `${remaining.months}m ${remaining.days % 30}d` : `${remaining.days}d`} remaining
                          </span>
                        )}
                        {remaining.expired && !code.usedAt && (
                          <span className="text-error font-semibold">Expired</span>
                        )}
                      </div>

                      {/* Agency info (for used codes) */}
                      {code.agency && (
                        <div className="mt-3 pt-2 border-t border-hairline/50">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Building2 className="w-3 h-3 text-primary" />
                            <span className="text-xs font-semibold text-ink">{code.agency.name}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-ink-tertiary">
                            {code.agency.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-2.5 h-2.5" />
                                {code.agency.email}
                              </span>
                            )}
                            {code.agency.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5" />
                                {code.agency.phone}
                              </span>
                            )}
                            {code.agency.licenseNumber && (
                              <span>License: {code.agency.licenseNumber}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
