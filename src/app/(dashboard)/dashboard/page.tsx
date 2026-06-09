import React from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardCharts } from "@/components/sira/DashboardCharts";
import { Users, FileBadge, CheckSquare, Plane, AlertTriangle, AlertCircle, Calendar } from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import { getDictionary, isLocale, DEFAULT_LOCALE } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const agencyId = session?.user?.agencyId;

  // Resolve locale
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
  const t = getDictionary(locale);

  // Try to load real counts from DB for this agency only
  let totalCandidates = 0;
  let newThisMonth = 0;
  let lmisPendingCount = 0;
  let musanedPendingCount = 0;
  let flightReadyCount = 0;
  let expiringSoonCount = 0;

  let recentExpiring: any[] = [];
  let stuckCandidates: any[] = [];
  let automationFailures: any[] = [];

  if (agencyId) {
    try {
      totalCandidates = await prisma.applicant.count({ where: { agencyId } });

      // New this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      newThisMonth = await prisma.applicant.count({
        where: { agencyId, createdAt: { gte: startOfMonth } },
      });

      // Pipeline counts
      lmisPendingCount = await prisma.applicant.count({
        where: { agencyId, status: "MEDICAL_APPROVED" }, // Stuck at stage before LMIS
      });

      musanedPendingCount = await prisma.applicant.count({
        where: { agencyId, status: "LMIS_CLEAR" }, // Stuck at stage before Musaned
      });

      flightReadyCount = await prisma.applicant.count({
        where: { agencyId, status: "FLIGHT_READY" },
      });

      // Expiry in <90 days
      const ninetyDays = new Date();
      ninetyDays.setDate(ninetyDays.getDate() + 90);
      expiringSoonCount = await prisma.applicant.count({
        where: { agencyId, dateOfExpiry: { lt: ninetyDays } },
      });

      recentExpiring = await prisma.applicant.findMany({
        where: { agencyId, dateOfExpiry: { lt: ninetyDays } },
        take: 5,
        orderBy: { dateOfExpiry: "asc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          passportNumber: true,
          dateOfExpiry: true,
        },
      });

      // Stuck in status > 14 days
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      stuckCandidates = await prisma.applicant.findMany({
        where: {
          agencyId,
          updatedAt: { lt: fourteenDaysAgo },
          status: { notIn: ["FLIGHT_READY", "REJECTED"] },
        },
        take: 5,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          status: true,
          updatedAt: true,
        },
      });

      // Get automation failures
      automationFailures = await prisma.automationJob.findMany({
        where: { agencyId, status: "FAILED" },
        take: 5,
        orderBy: { enqueuedAt: "desc" },
        select: {
          id: true,
          jobType: true,
          errorMessage: true,
          applicant: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    } catch (dbError) {
      console.error("Database fetch error:", dbError);
    }
  }

  // Chart data queries for stage breakdown
  let stageRegistered = 0;
  let stageMedicalApproved = 0;
  let stageLmisClears = 0;
  let stageMusanedContracted = 0;
  let stageEnjazCompleted = 0;
  let stageFlightReady = 0;

  if (agencyId) {
    try {
      stageRegistered = await prisma.applicant.count({ where: { agencyId, status: "REGISTERED" } });
      stageMedicalApproved = await prisma.applicant.count({ where: { agencyId, status: "MEDICAL_APPROVED" } });
      stageLmisClears = await prisma.applicant.count({ where: { agencyId, status: "LMIS_CLEAR" } });
      stageMusanedContracted = await prisma.applicant.count({ where: { agencyId, status: "MUSANED_CONTRACTED" } });
      stageEnjazCompleted = await prisma.applicant.count({ where: { agencyId, status: "ENJAZ_COMPLETED" } });
      stageFlightReady = await prisma.applicant.count({ where: { agencyId, status: "FLIGHT_READY" } });
    } catch (error) {
      console.error("Error fetching stage counts:", error);
    }
  }

  // Chart structures - Map names from dictionary
  const stageData = [
    { name: t.status.REGISTERED, count: stageRegistered, color: "#5e6ad2" },
    { name: t.status.MEDICAL_APPROVED, count: stageMedicalApproved, color: "#0ea5e9" },
    { name: t.status.LMIS_CLEAR, count: stageLmisClears, color: "#a855f7" },
    { name: t.status.MUSANED_CONTRACTED, count: stageMusanedContracted, color: "#f59e0b" },
    { name: t.status.ENJAZ_COMPLETED, count: stageEnjazCompleted, color: "#10b981" },
    { name: t.status.FLIGHT_READY, count: stageFlightReady, color: "#27a644" },
  ];

  // Fetch real onboarding trend over the last 6 weeks
  const onboardingTrend = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const end = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const count = agencyId
      ? await prisma.applicant.count({
          where: {
            agencyId,
            createdAt: {
              gte: start,
              lt: end,
            },
          },
        })
      : 0;
    
    // Create label like W1, W2, etc. or localized Week
    onboardingTrend.push({
      week: `Week ${6 - i}`,
      count,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-display-md text-ink font-semibold">{t.dashboard.overview}</h2>
          <p className="text-xs text-ink-subtle">
            {t.dashboard.subtitle}
          </p>
        </div>
        <Link href="/candidates/new" className="btn-primary flex items-center gap-1.5 py-2 text-xs">
          {t.dashboard.onboardBtn}
        </Link>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: t.dashboard.totalCandidates, val: totalCandidates, icon: Users, desc: t.dashboard.totalCandidatesDesc },
          { label: t.dashboard.newThisMonth, val: newThisMonth, icon: Calendar, desc: t.dashboard.newThisMonthDesc },
          { label: t.dashboard.lmisPending, val: lmisPendingCount, icon: FileBadge, desc: t.dashboard.lmisPendingDesc },
          { label: t.dashboard.musanedPending, val: musanedPendingCount, icon: CheckSquare, desc: t.dashboard.musanedPendingDesc },
          { label: t.dashboard.flightReady, val: flightReadyCount, icon: Plane, desc: t.dashboard.flightReadyDesc },
          { label: t.dashboard.expiringPassports, val: expiringSoonCount, icon: AlertCircle, desc: t.dashboard.expiringPassportsDesc, highlight: expiringSoonCount > 0 },
        ].map((kpi, idx) => (
          <div
            key={idx}
            className={`p-4 bg-surface-1 border rounded-lg flex flex-col justify-between h-28 ${
              kpi.highlight ? "border-error/30 bg-error/5" : "border-hairline"
            }`}
          >
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-semibold text-ink-subtle uppercase tracking-wider">
                {kpi.label}
              </span>
              <kpi.icon className={`w-4 h-4 ${kpi.highlight ? "text-error" : "text-primary"}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink font-display">{kpi.val}</p>
              <p className="text-[10px] text-ink-tertiary mt-0.5">{kpi.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recharts Analytics Charts */}
      <DashboardCharts stageData={stageData} onboardingTrend={onboardingTrend} />

      {/* Alert Center & Stuck Cases */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Passport Expiry warnings */}
        <div className="bg-surface-1 border border-hairline rounded-lg p-5">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-hairline">
            <h4 className="text-sm font-semibold text-ink flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-warning" />
              {t.dashboard.recentExpiringTitle}
            </h4>
            <span className="text-[10px] bg-warning/15 text-warning font-semibold px-2 py-0.5 rounded">
              {t.dashboard.expiresOn} &lt;90
            </span>
          </div>

          <div className="space-y-3">
            {recentExpiring.length === 0 ? (
              <p className="text-xs text-ink-tertiary py-2">{t.dashboard.noData}</p>
            ) : (
              recentExpiring.map((cand) => {
                const daysLeft = Math.round(
                  (new Date(cand.dateOfExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div
                    key={cand.id}
                    className="flex justify-between items-center text-xs p-2.5 rounded bg-surface-2 border border-hairline"
                  >
                    <div>
                      <p className="font-semibold text-ink">
                        {cand.firstName} {cand.lastName}
                      </p>
                      <p className="text-[10px] text-ink-subtle mt-0.5">PP: {cand.passportNumber}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        daysLeft < 30
                          ? "bg-error/15 text-error"
                          : daysLeft < 60
                          ? "bg-warning/15 text-warning"
                          : "bg-surface-3 text-ink-muted"
                      }`}
                    >
                      {daysLeft} {t.dashboard.daysAgo}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Stuck Candidates */}
        <div className="bg-surface-1 border border-hairline rounded-lg p-5">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-hairline">
            <h4 className="text-sm font-semibold text-ink flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#a855f7]" />
              {t.dashboard.stuckCandidatesTitle}
            </h4>
            <span className="text-[10px] bg-[#a855f7]/15 text-[#c084fc] font-semibold px-2 py-0.5 rounded">
              &gt;14 {t.dashboard.daysAgo}
            </span>
          </div>

          <div className="space-y-3">
            {stuckCandidates.length === 0 ? (
              <p className="text-xs text-ink-tertiary py-2">{t.dashboard.noData}</p>
            ) : (
              stuckCandidates.map((cand) => {
                const daysStuck = Math.round(
                  (Date.now() - new Date(cand.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div
                    key={cand.id}
                    className="flex justify-between items-center text-xs p-2.5 rounded bg-surface-2 border border-hairline"
                  >
                    <div>
                      <p className="font-semibold text-ink">
                        {cand.firstName} {cand.lastName}
                      </p>
                      <p className="text-[10px] text-ink-tertiary mt-0.5">Status: {t.status[cand.status as keyof typeof t.status] || cand.status}</p>
                    </div>
                    <span className="text-[10px] font-bold text-ink-muted bg-surface-3 px-2 py-0.5 rounded border border-hairline">
                      {daysStuck} {t.dashboard.daysAgo}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Playwright Worker Failures */}
        <div className="bg-surface-1 border border-hairline rounded-lg p-5">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-hairline">
            <h4 className="text-sm font-semibold text-ink flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-error" />
              {t.dashboard.automationFailuresTitle}
            </h4>
            <span className="text-[10px] bg-error/15 text-error font-semibold px-2 py-0.5 rounded">
              {t.automation.statusFailed}
            </span>
          </div>

          <div className="space-y-3">
            {automationFailures.length === 0 ? (
              <p className="text-xs text-ink-tertiary py-2">{t.dashboard.noData}</p>
            ) : (
              automationFailures.map((job) => (
                <div
                  key={job.id}
                  className="p-2.5 rounded bg-surface-2 border border-error/25 text-xs space-y-1"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[#f87171] uppercase tracking-wide text-[10px]">
                      {job.jobType.replace("_", " ")}
                    </span>
                    <span className="text-[10px] text-ink-tertiary">
                      {job.applicant.firstName} {job.applicant.lastName}
                    </span>
                  </div>
                  <p className="text-[10px] text-ink-muted italic leading-relaxed">
                    &quot;{job.errorMessage}&quot;
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
