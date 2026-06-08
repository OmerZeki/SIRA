"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, RefreshCw, Download, Send, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/sira/StatusBadge";
import { useCurrentLocale } from "@/components/sira/LanguageSwitcher";
import { getDictionary } from "@/lib/i18n";

function InfoField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold text-ink-tertiary uppercase tracking-wider mb-0.5">
        {label}
      </dt>
      <dd className="text-sm text-ink font-medium">{value || "—"}</dd>
    </div>
  );
}

export default function CandidateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "";
  const locale = useCurrentLocale();
  const t = getDictionary(locale);

  const [applicant, setApplicant] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [triggeringAutomation, setTriggeringAutomation] = useState<string | null>(null);
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  const portalActions = [
    { platform: "ethiopian_lmis", label: t.candidates.runLmis, tier: t.portal.background },
    { platform: "wafid", label: t.candidates.copyWafid, tier: t.portal.background },
    { platform: "tawtheeq_musaned", label: t.candidates.runMusaned, tier: t.portal.guided },
    { platform: "easyenjaz", label: t.candidates.copyEnjaz, tier: t.portal.guided },
    { platform: "tasheer", label: t.candidates.copyTasheer, tier: t.portal.guided },
    { platform: "mofa", label: t.candidates.copyMofa, tier: t.portal.copyPaste },
  ];

  const statuses = [
    "REGISTERED",
    "MEDICAL_APPROVED",
    "LMIS_CLEAR",
    "MUSANED_CONTRACTED",
    "ENJAZ_COMPLETED",
    "FLIGHT_READY",
    "ON_HOLD",
    "REJECTED",
  ];

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/applicants/${id}`);
        if (res.ok) {
          const data = await res.json();
          setApplicant(data);
          setStatus(data.status);
        } else if (res.status === 404) {
          router.push("/candidates");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router]);

  const saveStatus = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/applicants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setApplicant(updated);
      }
    } finally {
      setSaving(false);
    }
  };

  const triggerPortal = async (platform: string, label: string) => {
    setTriggeringAutomation(platform);
    try {
      const res = await fetch("/api/automation/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicantId: id, platform }),
      });
      if (res.ok) {
        alert(`${label} job created successfully.`);
      } else {
        const body = await res.json().catch(() => null);
        alert(body?.error || "Failed to create automation job.");
      }
    } finally {
      setTriggeringAutomation(null);
    }
  };

  const downloadCandidate = async (format: "excel" | "word" | "pdf") => {
    setDownloadingFormat(format);
    try {
      const response = await fetch(`/api/export/${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const extension = format === "excel" ? "xlsx" : format === "word" ? "doc" : "pdf";
        a.download = `${applicant.firstName}_${applicant.lastName}_profile.${extension}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert("Failed to export candidate.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to export candidate.");
    } finally {
      setDownloadingFormat(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!applicant) return null;

  const daysToExpiry = applicant.dateOfExpiry
    ? Math.round(
        (new Date(applicant.dateOfExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/candidates" className="p-2 rounded-md hover:bg-surface-1 text-ink-subtle transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-headline text-ink font-semibold">
              {applicant.firstName} {applicant.lastName}
            </h2>
            <p className="text-xs font-mono text-ink-tertiary mt-0.5">{applicant.passportNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={applicant.status} />
        </div>
      </div>

      {/* Expiry warning */}
      {daysToExpiry !== null && daysToExpiry < 60 && (
        <div className="p-3 bg-error/10 border border-error/30 rounded-lg flex items-center gap-2 text-xs text-error">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Passport expires in {daysToExpiry} days — candidate may be ineligible for processing.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Personal Info */}
          <div className="bg-surface-1 border border-hairline rounded-lg p-6">
            <h3 className="text-sm font-semibold text-ink mb-5 pb-3 border-b border-hairline">{t.candidates.personal}</h3>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <InfoField label={t.form.firstName} value={applicant.firstName} />
              <InfoField label={t.form.firstNameAmh} value={applicant.firstNameAmh} />
              <InfoField label={t.form.middleName} value={applicant.middleName} />
              <InfoField label={t.form.middleNameAmh} value={applicant.middleNameAmh} />
              <InfoField label={t.form.lastName} value={applicant.lastName} />
              <InfoField label={t.form.lastNameAmh} value={applicant.lastNameAmh} />
              <InfoField label={t.form.dateOfBirth} value={applicant.dateOfBirth ? new Date(applicant.dateOfBirth).toLocaleDateString() : null} />
              <InfoField label={t.form.gender} value={applicant.gender} />
              <InfoField label={t.form.nationality} value={applicant.nationality} />
              <InfoField label={t.form.placeOfBirth} value={applicant.placeOfBirth} />
              <InfoField label={t.form.height} value={applicant.height ? `${applicant.height} cm` : null} />
              <InfoField label={t.form.weight} value={applicant.weight ? `${applicant.weight} kg` : null} />
              <InfoField label={t.form.religion} value={applicant.religion} />
              <InfoField label={t.form.maritalStatus} value={applicant.maritalStatus} />
              <InfoField label={t.form.educationLevel} value={applicant.educationLevel} />
            </dl>
          </div>

          {/* Passport Info */}
          <div className="bg-surface-1 border border-hairline rounded-lg p-6">
            <h3 className="text-sm font-semibold text-ink mb-5 pb-3 border-b border-hairline">{t.candidates.biographical}</h3>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <InfoField label={t.form.passportNumber} value={applicant.passportNumber} />
              <InfoField label={t.form.dateOfIssue} value={applicant.dateOfIssue ? new Date(applicant.dateOfIssue).toLocaleDateString() : null} />
              <InfoField
                label={t.form.passportExpiry}
                value={applicant.dateOfExpiry ? new Date(applicant.dateOfExpiry).toLocaleDateString() : null}
              />
              <InfoField label={t.form.placeOfIssue} value={applicant.placeOfIssue} />
              <InfoField label="MRZ Line 1" value={applicant.mrzLine1} />
              <InfoField label="MRZ Line 2" value={applicant.mrzLine2} />
            </dl>
          </div>

          {/* Employment Info */}
          <div className="bg-surface-1 border border-hairline rounded-lg p-6">
            <h3 className="text-sm font-semibold text-ink mb-5 pb-3 border-b border-hairline">{t.candidates.professional}</h3>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <InfoField label={t.form.arabicLevel} value={applicant.arabicLevel} />
              <InfoField label={t.form.englishLevel} value={applicant.englishLevel} />
              <InfoField label={t.form.experienceYears} value={applicant.experienceYears?.toString()} />
              <InfoField label={t.form.monthlySalary} value={applicant.monthlySalary ? `$${applicant.monthlySalary}` : null} />
            </dl>
          </div>

          {/* Status History */}
          {applicant.statusHistory?.length > 0 && (
            <div className="bg-surface-1 border border-hairline rounded-lg p-6">
              <h3 className="text-sm font-semibold text-ink mb-4 pb-3 border-b border-hairline">Status History</h3>
              <div className="space-y-2">
                {applicant.statusHistory.map((h: any) => (
                  <div key={h.id} className="flex items-start gap-3 text-xs">
                    <span className="text-ink-tertiary w-32 flex-shrink-0">
                      {new Date(h.timestamp).toLocaleDateString()}
                    </span>
                    <span className="text-ink-muted">
                      {h.fromStatus ? (
                        <span>
                          <span className="text-ink-subtle">{t.status[h.fromStatus as keyof typeof t.status] || h.fromStatus}</span>
                          {" → "}
                          <span className="text-primary font-semibold">{t.status[h.toStatus as keyof typeof t.status] || h.toStatus}</span>
                        </span>
                      ) : (
                        <span className="text-primary font-semibold">{t.status[h.toStatus as keyof typeof t.status] || h.toStatus}</span>
                      )}
                    </span>
                    {h.changedByName && (
                      <span className="ml-auto text-ink-tertiary">by {h.changedByName}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — actions */}
        <div className="space-y-4">
          {/* Photo */}
          {applicant.passportPhotoUrl && (
            <div className="bg-surface-1 border border-hairline rounded-lg p-4 text-center">
              <h3 className="text-xs font-semibold text-ink-tertiary mb-3">Passport Photo</h3>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={applicant.passportPhotoUrl}
                alt="Passport photo"
                className="w-28 h-28 object-cover rounded-full mx-auto border-2 border-primary/30"
              />
            </div>
          )}

          {/* Change Status */}
          <div className="bg-surface-1 border border-hairline rounded-lg p-4">
            <h3 className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider mb-3">
              {t.candidates.tableStatus}
            </h3>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full input-text mb-3 bg-surface-1"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>{t.status[s as keyof typeof t.status] || s}</option>
              ))}
            </select>
            <button
              onClick={saveStatus}
              disabled={saving || status === applicant.status}
              className="w-full btn-primary py-2 text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {saving ? t.common.loading : t.settings.saving}
            </button>
          </div>

          {/* Export Portfolio */}
          <div className="bg-surface-1 border border-hairline rounded-lg p-4 space-y-2">
            <h3 className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider mb-3">
              Export Candidate Profile
            </h3>
            <button
              onClick={() => downloadCandidate("excel")}
              disabled={Boolean(downloadingFormat)}
              className="w-full btn-secondary py-2 text-xs flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              {downloadingFormat === "excel" ? t.common.loading : t.candidates.exportExcel}
            </button>
            <button
              onClick={() => downloadCandidate("word")}
              disabled={Boolean(downloadingFormat)}
              className="w-full btn-secondary py-2 text-xs flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              {downloadingFormat === "word" ? t.common.loading : t.candidates.exportWord}
            </button>
            <button
              onClick={() => downloadCandidate("pdf")}
              disabled={Boolean(downloadingFormat)}
              className="w-full btn-secondary py-2 text-xs flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              {downloadingFormat === "pdf" ? t.common.loading : t.candidates.exportPdf}
            </button>
          </div>

          {/* Automation */}
          <div className="bg-surface-1 border border-hairline rounded-lg p-4 space-y-2">
            <h3 className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider mb-3">
              {t.candidates.automationTiers}
            </h3>
            {portalActions.map((portal) => (
              <button
                key={portal.platform}
                onClick={() => triggerPortal(portal.platform, portal.label)}
                disabled={Boolean(triggeringAutomation)}
                className="w-full btn-secondary py-2 text-xs flex items-center justify-between gap-1.5 disabled:opacity-50"
              >
                <span className="flex items-center gap-1.5">
                  {triggeringAutomation === portal.platform ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  {portal.label}
                </span>
                <span className="text-[9px] text-ink-tertiary">{portal.tier}</span>
              </button>
            ))}
          </div>

          {/* Automation Jobs */}
          {applicant.automationJobs?.length > 0 && (
            <div className="bg-surface-1 border border-hairline rounded-lg p-4">
              <h3 className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider mb-3">
                {t.automation.logs}
              </h3>
              <div className="space-y-2">
                {applicant.automationJobs.map((job: any) => (
                  <div key={job.id} className="flex items-center justify-between text-[10px]">
                    <span className="text-ink-muted font-semibold">
                      {(job.resultData?.portalName || job.jobType || "Portal").toString()}
                    </span>
                    <span
                      className={`font-bold ${
                        job.status === "COMPLETED"
                          ? "text-success"
                          : job.status === "FAILED"
                          ? "text-error"
                          : "text-warning"
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {applicant.passportScanUrl && (
            <div className="bg-surface-1 border border-hairline rounded-lg p-4">
              <h3 className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider mb-3">
                {t.candidates.documents}
              </h3>
              <a
                href={applicant.passportScanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-primary hover:underline"
              >
                <Download className="w-3.5 h-3.5" />
                {t.documents.passportScan}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
