"use client";

import React, { useState } from "react";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function BatchImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError("");
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/import/excel", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to process import file.");
      } else {
        const data = await res.json();
        setResult(data);
      }
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h2 className="text-headline text-ink font-semibold">Batch Import Candidates</h2>
        <p className="text-xs text-ink-subtle">
          Upload an Excel (.xlsx) file to register or update multiple candidates simultaneously
        </p>
      </div>

      <div className="bg-surface-1 border border-hairline rounded-lg p-6 space-y-4">
        {/* Drag Drop Area */}
        <label className="border-2 border-dashed border-hairline hover:border-primary/50 transition-all rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer text-center group">
          <input
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            disabled={importing}
            className="hidden"
          />
          <Upload className="w-8 h-8 text-ink-tertiary group-hover:text-primary mb-3 transition-colors" />
          {file ? (
            <div>
              <p className="text-sm font-semibold text-ink">{file.name}</p>
              <p className="text-xs text-ink-tertiary">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold text-ink mb-0.5">Click to browse spreadsheet</p>
              <p className="text-[10px] text-ink-tertiary">Only standard .xlsx templates are supported</p>
            </div>
          )}
        </label>

        {/* Instructions / Template link */}
        <div className="p-3.5 bg-surface-2 border border-hairline rounded-lg text-xs space-y-1.5">
          <p className="font-semibold text-ink flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-primary" />
            Excel Template Instructions
          </p>
          <p className="text-ink-subtle text-[11px] leading-relaxed">
            Ensure your columns exactly match: <code>firstName</code>, <code>lastName</code>, <code>passportNumber</code>, <code>dateOfBirth</code>, <code>gender</code>, <code>nationality</code>, <code>workPosition</code>.
          </p>
        </div>

        {/* Submit */}
        {file && (
          <button
            onClick={handleImport}
            disabled={importing}
            className="w-full btn-primary py-2.5 font-semibold flex items-center justify-center gap-2"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing import...
              </>
            ) : (
              "Start Importing Candidates"
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-error/10 border border-error/30 rounded-lg flex items-start gap-3 text-xs text-error">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Import Failed</p>
            <p className="text-[11px] mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="bg-surface-1 border border-hairline rounded-lg p-5 space-y-3">
          <h3 className="text-sm font-semibold text-ink flex items-center gap-1.5">
            <CheckCircle2 className="w-4.5 h-4.5 text-success" />
            Import Results Summary
          </h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-success/5 border border-success/20 rounded p-3">
              <p className="text-lg font-bold text-success">{result.imported}</p>
              <p className="text-[10px] text-ink-tertiary uppercase font-semibold">Candidates Upserted</p>
            </div>
            <div className="bg-warning/5 border border-warning/20 rounded p-3">
              <p className="text-lg font-bold text-warning">{result.skipped}</p>
              <p className="text-[10px] text-ink-tertiary uppercase font-semibold">Rows Failed/Skipped</p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="space-y-1.5 pt-3 border-t border-hairline">
              <p className="text-[11px] font-bold text-ink-muted">Error Details:</p>
              <ul className="text-[10px] text-error font-mono space-y-1 max-h-36 overflow-y-auto bg-surface-2 p-2.5 rounded border border-hairline">
                {result.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
