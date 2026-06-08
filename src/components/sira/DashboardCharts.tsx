"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  Cell,
} from "recharts";
import { useCurrentLocale } from "@/components/sira/LanguageSwitcher";
import { getDictionary } from "@/lib/i18n";

interface DashboardChartsProps {
  stageData: Array<{ name: string; count: number; color: string }>;
  onboardingTrend: Array<{ week: string; count: number }>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-1 border border-hairline rounded-lg p-2.5 text-xs shadow-md">
        <p className="font-semibold text-ink-muted mb-1">{label}</p>
        {payload.map((pld: any, index: number) => (
          <p key={index} style={{ color: pld.color || pld.fill }} className="text-[11px]">
            {pld.name}: <span className="font-bold text-ink">{pld.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  stageData,
  onboardingTrend,
}) => {
  const locale = useCurrentLocale();
  const t = getDictionary(locale);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Candidates by Pipeline Stage Bar Chart */}
      <div className="bg-surface-1 border border-hairline rounded-lg p-5">
        <h4 className="text-sm font-semibold text-ink-muted mb-4">
          {t.dashboard.pipelineStageChart}
        </h4>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={stageData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline, #23252a)" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#62666d"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#62666d"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(94, 106, 210, 0.05)" }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {stageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Onboarding Rate Trend Line Chart */}
      <div className="bg-surface-1 border border-hairline rounded-lg p-5">
        <h4 className="text-sm font-semibold text-ink-muted mb-4">
          {t.dashboard.weeklyTrendChart}
        </h4>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={onboardingTrend}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hairline, #23252a)" vertical={false} />
              <XAxis
                dataKey="week"
                stroke="#62666d"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#62666d"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                fontSize={11}
                iconType="circle"
                wrapperStyle={{ color: "#8a8f98" }}
              />
              <Line
                name={t.dashboard.candidatesRegistered}
                type="monotone"
                dataKey="count"
                stroke="#5e6ad2"
                strokeWidth={2.5}
                dot={{ fill: "#5e6ad2", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
