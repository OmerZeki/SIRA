"use client";

import React, { useState } from "react";
import { Sparkles, Loader2, Check, AlertCircle } from "lucide-react";

interface NotesParserProps {
  onParseComplete: (fields: any) => void;
}

export const NotesParser: React.FC<NotesParserProps> = ({ onParseComplete }) => {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [parsedSummary, setParsedSummary] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  const handleParse = async () => {
    if (!notes.trim()) return;

    setLoading(true);
    setStatus("idle");
    setParsedSummary([]);

    try {
      const response = await fetch("/api/ai/parse-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json();
      onParseComplete(result);
      setStatus("success");

      // Build fields summary list
      const extracted: string[] = [];
      if (result.maritalStatus) extracted.push(`Marital Status: ${result.maritalStatus}`);
      if (result.childrenCount !== null) extracted.push(`Children: ${result.childrenCount}`);
      if (result.experienceYears !== null) extracted.push(`Experience: ${result.experienceYears} Years`);
      if (result.religion) extracted.push(`Religion: ${result.religion}`);
      if (result.monthlySalaryExpected) extracted.push(`Expected Salary: ${result.monthlySalaryExpected} USD`);
      if (result.languageArabic && result.languageArabic !== "NONE") extracted.push(`Arabic: ${result.languageArabic}`);
      
      const skillCount = Object.values(result.skills || {}).filter(Boolean).length;
      if (skillCount > 0) extracted.push(`Extracted ${skillCount} Skill Tags`);

      setParsedSummary(extracted);
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err.message || "Could not parse notes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-surface-1 border border-hairline rounded-lg p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
        <h4 className="text-sm font-semibold text-ink">AI Notes Enrichment</h4>
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Paste agent notes or candidate details (Amharic or English)...&#10;Example: 'Married with 2 kids, 3 years cleaning in Dubai, Christian, speaks basic Arabic, wants 300 USD salary'"
        rows={3}
        className="w-full bg-surface-2 border border-hairline rounded-md px-3 py-2 text-sm text-ink placeholder-ink-tertiary focus:outline-none focus:border-hairline-strong focus:ring-2 focus:ring-primary/30 resize-none"
      />

      <div className="flex items-center justify-between mt-3 gap-2">
        <span className="text-xs text-ink-subtle">
          AI will auto-fill checkboxes, marital status, language levels, and experience.
        </span>
        <button
          onClick={handleParse}
          disabled={loading || !notes.trim()}
          className="btn-primary flex items-center gap-1.5 py-1.5 text-xs select-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Parsing Notes...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              Parse Notes
            </>
          )}
        </button>
      </div>

      {status === "success" && (
        <div className="mt-4 p-3 bg-success/10 border border-success/30 rounded text-xs text-ink-muted">
          <div className="flex items-center gap-1.5 font-semibold text-success mb-1.5">
            <Check className="w-4 h-4" />
            AI Parsing Complete!
          </div>
          {parsedSummary.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {parsedSummary.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-success" />
                  {item}
                </div>
              ))}
            </div>
          ) : (
            <p>Notes analyzed, but no structured profile fields were matched.</p>
          )}
        </div>
      )}

      {status === "error" && (
        <div className="mt-4 p-3 bg-error/10 border border-error/30 rounded text-xs text-error flex items-start gap-1.5">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Failed to analyze notes</p>
            <p className="opacity-90">{errorMsg}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesParser;
