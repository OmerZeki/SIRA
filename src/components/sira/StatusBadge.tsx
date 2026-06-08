"use client";

import React from "react";
import { ApplicantStatus } from "@prisma/client";
import { useCurrentLocale } from "@/components/sira/LanguageSwitcher";
import { getDictionary } from "@/lib/i18n";

interface StatusBadgeProps {
  status: ApplicantStatus;
  className?: string;
}

const statusConfig: Record<
  ApplicantStatus,
  { bg: string; text: string; dot: string }
> = {
  REGISTERED: {
    bg: "bg-[#5e6ad2]/10 border-[#5e6ad2]/30",
    text: "text-[#828fff]",
    dot: "bg-[#5e6ad2]",
  },
  MEDICAL_APPROVED: {
    bg: "bg-[#0ea5e9]/10 border-[#0ea5e9]/30",
    text: "text-[#38bdf8]",
    dot: "bg-[#0ea5e9]",
  },
  LMIS_CLEAR: {
    bg: "bg-[#a855f7]/10 border-[#a855f7]/30",
    text: "text-[#c084fc]",
    dot: "bg-[#a855f7]",
  },
  MUSANED_CONTRACTED: {
    bg: "bg-[#f59e0b]/10 border-[#f59e0b]/30",
    text: "text-[#fbbf24]",
    dot: "bg-[#f59e0b]",
  },
  ENJAZ_COMPLETED: {
    bg: "bg-[#10b981]/10 border-[#10b981]/30",
    text: "text-[#34d399]",
    dot: "bg-[#10b981]",
  },
  FLIGHT_READY: {
    bg: "bg-[#27a644]/10 border-[#27a644]/30",
    text: "text-[#4ade80]",
    dot: "bg-[#27a644]",
  },
  ON_HOLD: {
    bg: "bg-[#62666d]/10 border-[#62666d]/30",
    text: "text-[#a1a1aa]",
    dot: "bg-[#62666d]",
  },
  REJECTED: {
    bg: "bg-[#dc2626]/10 border-[#dc2626]/30",
    text: "text-[#f87171]",
    dot: "bg-[#dc2626]",
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = "" }) => {
  const locale = useCurrentLocale();
  const t = getDictionary(locale);
  const config = statusConfig[status] || statusConfig.REGISTERED;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-medium ${config.bg} ${config.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {t.status[status]}
    </span>
  );
};

export default StatusBadge;
