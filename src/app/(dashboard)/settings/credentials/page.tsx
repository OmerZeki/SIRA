"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Save, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, Globe } from "lucide-react";
import { portalVaultDefinitions } from "@/lib/portal-vault";
import { useCurrentLocale } from "@/components/sira/LanguageSwitcher";
import { getDictionary } from "@/lib/i18n";

export default function PortalVaultPage() {
  const locale = useCurrentLocale();
  const t = getDictionary(locale);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [config, setConfig] = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/agency/credentials");
        if (res.ok) {
          const data = await res.json();
          const initialForm: Record<string, string> = {};
          const initialConfig: Record<string, boolean> = {};
          const initialShow: Record<string, boolean> = {};
          for (const portal of portalVaultDefinitions) {
            initialForm[`${portal.formKey}Username`] = data[`${portal.formKey}Username`] || "";
            initialForm[`${portal.formKey}Password`] = "";
            initialConfig[`${portal.formKey}PasswordConfigured`] = data[`${portal.formKey}PasswordConfigured`] || false;
            initialShow[`${portal.formKey}Password`] = false;
          }
          setFormData(initialForm);
          setConfig(initialConfig);
          setShowPassword(initialShow);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleShow = (id: string) => {
    setShowPassword((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError("");

    try {
      const res = await fetch("/api/agency/credentials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to save credentials.");
      } else {
        setSuccess(true);
        // Reset password fields
        setFormData((prev) => {
          const next = { ...prev };
          for (const portal of portalVaultDefinitions) {
            next[`${portal.formKey}Password`] = "";
          }
          return next;
        });
        // Mark all with new passwords as configured
        setConfig((prev) => {
          const next = { ...prev };
          for (const portal of portalVaultDefinitions) {
            if (formData[`${portal.formKey}Password`]) {
              next[`${portal.formKey}PasswordConfigured`] = true;
            }
          }
          return next;
        });
      }
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-headline text-ink font-semibold flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-success" />
          {t.settings.credentialsTitle}
        </h2>
        <p className="text-xs text-ink-subtle mt-1">
          {t.settings.credentialsSubtitle}
        </p>
      </div>

      <div className="bg-surface-1 border border-hairline rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {portalVaultDefinitions.map((portal) => {
            const isConfigured = config[`${portal.formKey}PasswordConfigured`];
            return (
              <div key={portal.portalId} className="space-y-3 pb-5 border-b border-hairline last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <h3 className={`text-xs font-semibold uppercase tracking-wider ${portal.accentClassName} border px-2 py-1 rounded`}>
                    {portal.label}
                  </h3>
                  <a
                    href={portal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] text-ink-tertiary hover:text-primary transition-colors"
                  >
                    <Globe className="w-3 h-3" />
                    {t.common.visitPortal}
                  </a>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-ink-tertiary mb-1">{t.settings.username}</label>
                    <input
                      type="text"
                      name={`${portal.formKey}Username`}
                      value={formData[`${portal.formKey}Username`] || ""}
                      onChange={handleChange}
                      placeholder={`${portal.label} username`}
                      className="w-full input-text"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-ink-tertiary mb-1">
                      {t.settings.password} {isConfigured && <span className="text-success font-semibold">({t.settings.configured})</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword[`${portal.formKey}Password`] ? "text" : "password"}
                        name={`${portal.formKey}Password`}
                        value={formData[`${portal.formKey}Password`] || ""}
                        onChange={handleChange}
                        placeholder={isConfigured ? "••••••••" : "Enter Password"}
                        className="w-full input-text pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => toggleShow(`${portal.formKey}Password`)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink-muted"
                      >
                        {showPassword[`${portal.formKey}Password`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <button
            type="submit"
            disabled={saving}
            className="w-full btn-primary py-2.5 font-semibold flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t.settings.saving}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t.portal.saveVault}
              </>
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-error/10 border border-error/30 rounded-lg flex items-center gap-3 text-xs text-error">
          <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-success/10 border border-success/30 rounded-lg flex items-center gap-3 text-xs text-success">
          <CheckCircle2 className="w-4.5 h-4.5 flex-shrink-0" />
          <span>{t.portal.encrypted}</span>
        </div>
      )}
    </div>
  );
}
