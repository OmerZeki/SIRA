"use client";

import React, { useState, useEffect } from "react";
import { Download, FileSpreadsheet, FileText, Loader2, CheckCircle2 } from "lucide-react";

export default function ExportCenterPage() {
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<"excel" | "word" | "pdf">("excel");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/applicants?limit=1");
        if (res.ok) {
          const json = await res.json();
          setTotalCandidates(json.total || 0);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    setSuccess(false);
    try {
      const res = await fetch(`/api/export/${selectedFormat}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: selectedStatus || undefined,
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const extension = selectedFormat === "excel" ? "xlsx" : selectedFormat === "word" ? "doc" : "pdf";
        a.download = `SIRA_Candidates_Export_${new Date().toISOString().split("T")[0]}.${extension}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setSuccess(true);
      } else {
        alert(`Failed to export candidates as ${selectedFormat}.`);
      }
    } catch {
      alert("An unexpected network error occurred.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h2 className="text-headline text-ink font-semibold">Export Center</h2>
        <p className="text-xs text-ink-subtle">
          Generate custom reports and download candidate data in standard Excel format
        </p>
      </div>

      <div className="bg-surface-1 border border-hairline rounded-lg p-6 space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-hairline">
          <div>
            <p className="text-xs text-ink-tertiary uppercase tracking-wider font-semibold">Total Available Records</p>
            <p className="text-3xl font-bold text-ink mt-1 font-display">
              {loading ? "..." : totalCandidates}
            </p>
          </div>
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {selectedFormat === "excel" ? <FileSpreadsheet className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Filter by Pipeline Stage</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full input-text"
            >
              <option value="">Export All Candidates</option>
              <option value="REGISTERED">Registered Only</option>
              <option value="MEDICAL_APPROVED">Medical Approved Only</option>
              <option value="LMIS_CLEAR">LMIS Clear Only</option>
              <option value="MUSANED_CONTRACTED">Musaned Contracted Only</option>
              <option value="ENJAZ_COMPLETED">Enjaz Completed Only</option>
              <option value="FLIGHT_READY">Flight Ready Only</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Download Format</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "excel", label: "Excel" },
                { value: "word", label: "Word" },
                { value: "pdf", label: "PDF" },
              ].map((format) => (
                <button
                  key={format.value}
                  type="button"
                  onClick={() => setSelectedFormat(format.value as "excel" | "word" | "pdf")}
                  className={`py-2 rounded-md border text-xs font-semibold transition ${
                    selectedFormat === format.value
                      ? "border-primary text-primary bg-primary/10"
                      : "border-hairline text-ink-muted hover:text-ink"
                  }`}
                >
                  {format.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={exporting || loading}
            className="w-full btn-primary py-2.5 font-semibold flex items-center justify-center gap-2"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating report...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export Candidates to {selectedFormat === "excel" ? "Excel" : selectedFormat === "word" ? "Word" : "PDF"}
              </>
            )}
          </button>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-success/10 border border-success/30 rounded-lg flex items-center gap-3 text-xs text-success">
          <CheckCircle2 className="w-4.5 h-4.5 flex-shrink-0" />
          <span>{selectedFormat === "excel" ? "Excel" : selectedFormat === "word" ? "Word" : "PDF"} report generated and downloaded successfully.</span>
        </div>
      )}
    </div>
  );
}
