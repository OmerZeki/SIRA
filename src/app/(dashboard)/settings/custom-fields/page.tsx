"use client";

import React, { useState, useEffect } from "react";
import { Sliders, Plus, Trash2, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useCurrentLocale } from "@/components/sira/LanguageSwitcher";
import { getDictionary } from "@/lib/i18n";

interface CustomField {
  name: string;
  label: string;
  type: "text" | "number" | "select";
  options?: string[];
}

export default function CustomFieldsPage() {
  const locale = useCurrentLocale();
  const t = getDictionary(locale);

  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/agency/custom-fields");
        if (res.ok) {
          const data = await res.json();
          setFields(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const addField = () => {
    const newField: CustomField = {
      name: `custom_field_${Date.now()}`,
      label: "New Custom Field",
      type: "text",
    };
    setFields((prev) => [...prev, newField]);
  };

  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, key: keyof CustomField, value: any) => {
    setFields((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    setError("");

    // Simple validation
    for (const f of fields) {
      if (!f.label.trim()) {
        setError("All fields must have a valid display label.");
        setSaving(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/agency/custom-fields", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to update custom fields config.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-headline text-ink font-semibold flex items-center gap-2">
            <Sliders className="w-5 h-5 text-primary" />
            {t.settings.customFieldsTitle}
          </h2>
          <p className="text-xs text-ink-subtle">
            {t.settings.customFieldsSubtitle}
          </p>
        </div>
        <button onClick={addField} className="btn-secondary py-2 text-xs flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          {t.settings.addCustomField}
        </button>
      </div>

      <div className="bg-surface-1 border border-hairline rounded-lg p-6 space-y-4">
        {fields.length === 0 ? (
          <div className="text-center py-10 text-xs text-ink-tertiary">
            No custom fields configured yet. Click &quot;Add Field&quot; to configure metadata keys.
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-surface-2 p-4 border border-hairline rounded-lg"
              >
                <div className="flex-1 w-full space-y-2 sm:space-y-0 sm:flex sm:gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-ink-tertiary uppercase tracking-wider mb-1">
                      {t.settings.fieldLabel}
                    </label>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => handleFieldChange(idx, "label", e.target.value)}
                      placeholder="e.g. Visa Status"
                      className="w-full input-text"
                    />
                  </div>
                  <div className="sm:w-36">
                    <label className="block text-[10px] font-bold text-ink-tertiary uppercase tracking-wider mb-1">
                      {t.settings.fieldType}
                    </label>
                    <select
                      value={field.type}
                      onChange={(e) => handleFieldChange(idx, "type", e.target.value)}
                      className="w-full input-text bg-surface-1"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="select">Dropdown</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => removeField(idx)}
                  className="p-2 mt-5 text-ink-tertiary hover:text-error transition rounded hover:bg-surface-3"
                  title="Remove Field"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {fields.length > 0 && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full btn-primary py-2.5 font-semibold flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t.settings.saving}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t.common.save}
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-error/10 border border-error/30 rounded-lg flex items-center gap-3 text-xs text-error">
          <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-success/10 border border-success/30 rounded-lg flex items-center gap-3 text-xs text-success">
          <CheckCircle2 className="w-4.5 h-4.5 flex-shrink-0" />
          <span>{t.settings.saveSuccess}</span>
        </div>
      )}
    </div>
  );
}
