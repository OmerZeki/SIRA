"use client";

import React, { useState, useEffect, useRef } from "react";
import { Settings, Save, Loader2, CheckCircle2, AlertCircle, Upload, Trash2, Image as ImageIcon } from "lucide-react";
import { useCurrentLocale } from "@/components/sira/LanguageSwitcher";
import { getDictionary } from "@/lib/i18n";

export default function AgencyProfilePage() {
  const locale = useCurrentLocale();
  const t = getDictionary(locale);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    licenseNumber: "",
    phone: "",
    address: "",
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [logoStatus, setLogoStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/agency/profile");
        if (res.ok) {
          const data = await res.json();
          setFormData({
            name: data.name || "",
            email: data.email || "",
            licenseNumber: data.licenseNumber || "",
            phone: data.phone || "",
            address: data.address || "",
          });
          setLogoUrl(data.logoUrl || null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/agency/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to update profile settings.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    setLogoStatus(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/agency/logo", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      const data = await res.json();
      setLogoUrl(data.logoUrl);
      setLogoStatus({ type: "success", message: t.settings.logoUploadSuccess });
    } catch (err: any) {
      setLogoStatus({ type: "error", message: err.message || t.settings.logoUploadFailed });
    } finally {
      setLogoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleLogoRemove = async () => {
    setLogoStatus(null);

    try {
      const res = await fetch("/api/agency/logo", { method: "DELETE" });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Remove failed");
      }

      setLogoUrl(null);
      setLogoStatus({ type: "success", message: t.settings.logoRemoveSuccess });
    } catch (err: any) {
      setLogoStatus({ type: "error", message: err.message || t.settings.logoRemoveFailed });
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
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h2 className="text-headline text-ink font-semibold flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          {t.settings.title}
        </h2>
        <p className="text-xs text-ink-subtle">
          {t.settings.subtitle}
        </p>
      </div>

      {/* Logo Upload Section */}
      <div className="bg-surface-1 border border-hairline rounded-lg p-6">
        <h3 className="text-sm font-semibold text-ink mb-1">{t.settings.logoSection}</h3>
        <p className="text-xs text-ink-subtle mb-4">{t.settings.logoSubtitle}</p>

        <div className="flex items-center gap-5">
          {/* Logo Preview */}
          <div className="w-20 h-20 rounded-lg border-2 border-dashed border-hairline-strong bg-surface-2 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Agency Logo"
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <ImageIcon className="w-8 h-8 text-ink-tertiary" />
            )}
          </div>

          <div className="flex-1 space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleLogoUpload}
              className="hidden"
              id="logo-upload"
            />

            <div className="flex items-center gap-2">
              <label
                htmlFor={logoUploading ? undefined : "logo-upload"}
                className={`btn-secondary text-xs font-medium px-3 py-1.5 rounded-md cursor-pointer inline-flex items-center gap-1.5 ${logoUploading ? "pointer-events-none opacity-60" : ""}`}
              >
                {logoUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {t.documents.uploading}
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    {t.settings.logoUpload}
                  </>
                )}
              </label>

              {logoUrl && (
                <button
                  onClick={handleLogoRemove}
                  className="btn-secondary text-xs font-medium px-3 py-1.5 rounded-md inline-flex items-center gap-1.5 text-error hover:bg-error/10 border-error/30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t.settings.logoRemove}
                </button>
              )}
            </div>

            <p className="text-[10px] text-ink-tertiary">{t.settings.logoSupportedFormats}</p>
          </div>
        </div>

        {logoStatus && (
          <div className={`mt-3 p-2.5 rounded-lg flex items-center gap-2 text-xs ${
            logoStatus.type === "success"
              ? "bg-success/10 border border-success/30 text-success"
              : "bg-error/10 border border-error/30 text-error"
          }`}>
            {logoStatus.type === "success" ? (
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            )}
            <span>{logoStatus.message}</span>
          </div>
        )}
      </div>

      {/* Profile Form */}
      <div className="bg-surface-1 border border-hairline rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">{t.settings.agencyName} *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
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
              required
              className="w-full input-text"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">{t.settings.licenseNumber}</label>
            <input
              type="text"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleChange}
              className="w-full input-text"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">{t.settings.phone}</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full input-text"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">{t.settings.address}</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className="w-full input-text resize-none"
            />
          </div>

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
                {t.common.save}
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
          <span>{t.settings.saveSuccess}</span>
        </div>
      )}
    </div>
  );
}
