"use client";

import { useState } from "react";
import { PublicLayout } from "@/components/sira/PublicLayout";
import { useCurrentLocale } from "@/components/sira/LanguageSwitcher";
import { getDictionary } from "@/lib/i18n";
import { Send, Loader2, AlertCircle, CheckCircle2, Mail, Phone, MapPin, Key } from "lucide-react";

type RequestType = "general" | "code-request";

export default function ContactPage() {
  const locale = useCurrentLocale();
  const t = getDictionary(locale);

  const [requestType, setRequestType] = useState<RequestType>("general");
  const [form, setForm] = useState({ name: "", email: "", phone: "", agencyName: "", notes: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const payload = requestType === "code-request"
        ? { type: "code-request", name: form.name, email: form.email, phone: form.phone, agencyName: form.agencyName, notes: form.notes }
        : { type: "general", name: form.name, email: form.email, message: form.message };

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to send message.");
      } else {
        setSuccess(true);
        setForm({ name: "", email: "", phone: "", agencyName: "", notes: "", message: "" });
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">{t.static.contact}</h1>
          <p className="text-sm text-ink-subtle">{t.static.getInTouch}</p>
        </div>

        {/* Request Type Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-surface-1 border border-hairline rounded-lg p-1">
            <button
              onClick={() => { setRequestType("general"); setSuccess(false); setError(""); }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                requestType === "general"
                  ? "bg-[#5e6ad2]/10 text-primary shadow-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {t.static.generalInquiry}
            </button>
            <button
              onClick={() => { setRequestType("code-request"); setSuccess(false); setError(""); }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition flex items-center gap-1.5 ${
                requestType === "code-request"
                  ? "bg-[#5e6ad2]/10 text-primary shadow-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              {t.static.requestCode}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Info Sidebar */}
          <div className="space-y-6">
            {requestType === "code-request" && (
              <div className="bg-surface-1 border border-hairline rounded-lg p-5 mb-4">
                <h3 className="text-sm font-semibold text-ink flex items-center gap-2 mb-2">
                  <Key className="w-4 h-4 text-primary" />
                  {t.static.requestCodeDesc}
                </h3>
                <p className="text-xs text-ink-subtle leading-relaxed">
                  {t.static.payInstructions}
                </p>
              </div>
            )}

            <div className="flex items-start gap-4">
              <Mail className="w-5 h-5 text-primary mt-1" />
              <div>
                <h3 className="text-sm font-semibold text-ink">Email</h3>
                <p className="text-xs text-ink-subtle">support@sira.qzz.io</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Phone className="w-5 h-5 text-primary mt-1" />
              <div>
                <h3 className="text-sm font-semibold text-ink">Phone</h3>
                <p className="text-xs text-ink-subtle">+251966018912</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <MapPin className="w-5 h-5 text-primary mt-1" />
              <div>
                <h3 className="text-sm font-semibold text-ink">Address</h3>
                <p className="text-xs text-ink-subtle">Bole Sub-City, Addis Ababa, Ethiopia</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-surface-1 border border-hairline rounded-lg p-6 space-y-4">
            {requestType === "code-request" && (
              <>
                <h3 className="text-sm font-semibold text-ink mb-1">{t.static.requestCodeForm}</h3>
                <p className="text-xs text-ink-subtle mb-2">{t.static.requestCodeSubtitle}</p>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-ink-tertiary mb-1">{t.static.name} *</label>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="Your full name"
                className="w-full input-text"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-tertiary mb-1">Email *</label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="owner@agency.com"
                className="w-full input-text"
              />
            </div>

            {requestType === "code-request" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-ink-tertiary mb-1">{t.auth.agencyName} *</label>
                  <input
                    type="text"
                    name="agencyName"
                    required
                    value={form.agencyName}
                    onChange={handleChange}
                    placeholder="Addis Recruitment Agency"
                    className="w-full input-text"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-tertiary mb-1">{t.static.agencyPhone}</label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+251 91X XXX XXX"
                    className="w-full input-text"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-tertiary mb-1">{t.static.agencyNotes}</label>
                  <textarea
                    name="notes"
                    rows={3}
                    value={form.notes}
                    onChange={handleChange}
                    placeholder={t.static.agencyNotesPlaceholder}
                    className="w-full input-text"
                  />
                </div>
              </>
            )}

            {requestType === "general" && (
              <div>
                <label className="block text-xs font-semibold text-ink-tertiary mb-1">{t.static.message} *</label>
                <textarea
                  name="message"
                  required
                  rows={4}
                  value={form.message}
                  onChange={handleChange}
                  className="w-full input-text"
                  placeholder="Your message..."
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5 font-semibold flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {requestType === "code-request"
                ? (loading ? t.static.submitting : t.static.requestCodeSubmit)
                : t.static.sendMessage}
            </button>

            {error && (
              <div className="p-3 bg-error/10 border border-error/30 rounded-lg flex items-center gap-2 text-xs text-error">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-success/10 border border-success/30 rounded-lg flex items-center gap-2 text-xs text-success">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>
                  {requestType === "code-request" ? t.static.requestCodeSuccess : "Message sent successfully."}
                </span>
              </div>
            )}
          </form>
        </div>
      </div>
    </PublicLayout>
  );
}
