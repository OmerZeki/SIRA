"use client";

import React, { useState, useEffect } from "react";
import { Cpu, RefreshCw, AlertTriangle, CheckCircle2, Hourglass, Loader2 } from "lucide-react";
import { useCurrentLocale } from "@/components/sira/LanguageSwitcher";
import { getDictionary } from "@/lib/i18n";

interface Job {
  id: string;
  platform: string;
  status: string;
  enqueuedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  applicant: {
    firstName: string;
    lastName: string;
    passportNumber: string;
  };
}

export default function AutomationQueuePage() {
  const locale = useCurrentLocale();
  const t = getDictionary(locale);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadJobs = async () => {
    try {
      const res = await fetch("/api/automation/jobs?limit=50");
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadJobs();
    const interval = setInterval(loadJobs, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadJobs();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-success/10 text-success border border-success/20">
            <CheckCircle2 className="w-3 h-3" />
            {t.automation.statusCompleted}
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-error/10 text-error border border-error/20">
            <AlertTriangle className="w-3 h-3" />
            {t.automation.statusFailed}
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
            <Loader2 className="w-3 h-3 animate-spin" />
            {t.automation.statusProcessing}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-surface-3 text-ink-muted border border-hairline">
            <Hourglass className="w-3 h-3" />
            {t.automation.statusPending}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-headline text-ink font-semibold flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" />
            {t.automation.title}
          </h2>
          <p className="text-xs text-ink-subtle">
            {t.automation.subtitle}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-secondary flex items-center gap-1.5 text-xs py-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {t.common.save === "Save" ? "Refresh" : t.common.loading}
        </button>
      </div>

      <div className="bg-surface-1 border border-hairline rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 text-xs text-ink-tertiary">
            {t.automation.noJobs}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-hairline text-[11px] font-semibold text-ink-tertiary uppercase tracking-wider bg-canvas/30">
                  <th className="px-4 py-3 text-left">{t.automation.candidate}</th>
                  <th className="px-4 py-3 text-left">{t.candidates.tablePassport}</th>
                  <th className="px-4 py-3 text-left">{t.automation.platform}</th>
                  <th className="px-4 py-3 text-left">{t.automation.status}</th>
                  <th className="px-4 py-3 text-left">{t.automation.enqueued}</th>
                  <th className="px-4 py-3 text-left">{t.automation.logs}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-surface-2/40 transition-colors">
                    <td className="px-4 py-3.5 text-xs font-semibold text-ink">
                      {job.applicant.firstName} {job.applicant.lastName}
                    </td>
                    <td className="px-4 py-3.5 text-xs font-mono text-ink-muted">
                      {job.applicant.passportNumber}
                    </td>
                    <td className="px-4 py-3.5 text-xs">
                      <span className="font-semibold text-ink-muted">{job.platform}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs">
                      {getStatusBadge(job.status)}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-ink-tertiary">
                      {new Date(job.enqueuedAt).toLocaleString(locale === "ar" ? "ar-SA" : locale === "am" ? "am-ET" : "en-US")}
                    </td>
                    <td className="px-4 py-3.5 text-xs max-w-xs truncate font-mono text-[10px]">
                      {job.status === "FAILED" ? (
                        <span className="text-error" title={job.errorMessage || ""}>
                          {job.errorMessage}
                        </span>
                      ) : job.status === "COMPLETED" ? (
                        <span className="text-success">{t.automation.statusCompleted} ✓</span>
                      ) : (
                        <span className="text-ink-tertiary">{t.common.loading}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
