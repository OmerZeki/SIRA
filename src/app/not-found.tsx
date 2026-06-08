import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#5e6ad2 1px, transparent 1px), linear-gradient(90deg, #5e6ad2 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Decorative gradient blur */}
      <div className="absolute w-[400px] h-[400px] bg-[#5e6ad2]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 text-center space-y-6 max-w-md px-6">
        <span className="w-16 h-16 rounded-2xl bg-[#5e6ad2]/10 border border-[#5e6ad2]/20 flex items-center justify-center font-bold text-[#828fff] text-3xl font-display mx-auto mb-2">
          ሥ
        </span>
        <h1 className="text-display-md font-bold text-ink">404</h1>
        <h2 className="text-xl font-semibold text-ink-muted">Page Not Found</h2>
        <p className="text-sm text-ink-subtle leading-relaxed">
          The page you are looking for does not exist or has been moved. Work positions, applicants, and recruiter utilities are accessible from your agency dashboard.
        </p>
        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 btn-secondary py-2.5 px-5 text-sm font-semibold border border-hairline hover:border-hairline-strong transition"
          >
            <ArrowLeft className="w-4 h-4 text-ink-subtle" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
