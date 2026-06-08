"use client";

import React, { useState } from "react";
import { Camera, FileText, Trash2, CheckCircle2, Loader2, Wand2 } from "lucide-react";
import { useCurrentLocale } from "@/components/sira/LanguageSwitcher";
import { getDictionary } from "@/lib/i18n";

interface DocSlot {
  key: string;
  labelKey: keyof ReturnType<typeof getDictionary>["documents"];
  labelAmh: string;
  required: boolean;
  type: "image" | "file";
  accept: string;
}

const DOCUMENT_SLOTS: DocSlot[] = [
  {
    key: "passportScan",
    labelKey: "passportScan",
    labelAmh: "የፓስፖርት ስካን",
    required: true,
    type: "image",
    accept: "image/jpeg,image/png,application/pdf",
  },
  {
    key: "fullBodyPhoto",
    labelKey: "fullBodyPhoto",
    labelAmh: "ሙሉ ምስል",
    required: true,
    type: "image",
    accept: "image/jpeg,image/png",
  },
  {
    key: "passportPhoto",
    labelKey: "passportPhoto",
    labelAmh: "የፓስፖርት ፎቶ",
    required: true,
    type: "image",
    accept: "image/jpeg,image/png",
  },
  {
    key: "medicalReport",
    labelKey: "medicalReport",
    labelAmh: "የሕክምና ሪፖርት",
    required: false,
    type: "file",
    accept: "image/jpeg,image/png,application/pdf",
  },
  {
    key: "cocCertificate",
    labelKey: "cocCertificate",
    labelAmh: "የCOC ሰርቲፊኬት",
    required: false,
    type: "file",
    accept: "application/pdf",
  },
  {
    key: "cv",
    labelKey: "cv",
    labelAmh: "ሲቪ",
    required: false,
    type: "file",
    accept: "application/pdf",
  },
];

interface DocumentCanvasProps {
  values: Record<string, any>;
  onChange: (key: string, url: string | null) => void;
}

export const DocumentCanvas: React.FC<DocumentCanvasProps> = ({ values, onChange }) => {
  const locale = useCurrentLocale();
  const t = getDictionary(locale);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [bgRemoving, setBgRemoving] = useState<Record<string, boolean>>({});

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxEdge = 1600;

          if (width > maxEdge || height > maxEdge) {
            if (width > height) {
              height = Math.round((height * maxEdge) / width);
              width = maxEdge;
            } else {
              width = Math.round((width * maxEdge) / height);
              height = maxEdge;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error("Canvas failure"))),
            "image/webp",
            0.8
          );
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUpload = async (slotKey: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading((prev) => ({ ...prev, [slotKey]: true }));

    try {
      let uploadBlob: Blob = file;
      let filename = file.name;

      if (file.type.startsWith("image/") && !file.name.endsWith(".pdf")) {
        uploadBlob = await compressImage(file);
        filename = `${file.name.substring(0, file.name.lastIndexOf("."))}.webp`;
      }

      const formData = new FormData();
      formData.append("file", uploadBlob, filename);
      formData.append("slot", slotKey);

      const response = await fetch("/api/upload/document", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const { url } = await response.json();
      onChange(slotKey, url);
    } catch (error) {
      console.error(error);
      alert(t.documents.uploadFailed);
    } finally {
      setUploading((prev) => ({ ...prev, [slotKey]: false }));
    }
  };

  const handleRemoveBg = async (slotKey: string) => {
    const currentUrl = values[slotKey + "Url"];
    if (!currentUrl) return;

    setBgRemoving((prev) => ({ ...prev, [slotKey]: true }));

    try {
      const response = await fetch("/api/upload/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: currentUrl, slot: slotKey }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const { url } = await response.json();
      onChange(slotKey, url);
    } catch (error) {
      console.error(error);
      alert(t.documents.removeBgFailed);
    } finally {
      setBgRemoving((prev) => ({ ...prev, [slotKey]: false }));
    }
  };

  const handleClear = (slotKey: string) => {
    if (confirm(t.documents.confirmRemove)) {
      onChange(slotKey, null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {DOCUMENT_SLOTS.map((slot) => {
        const docUrl = values[slot.key + "Url"];
        const isUploading = uploading[slot.key];
        const isBgRemoving = bgRemoving[slot.key];
        const label = t.documents[slot.labelKey];

        return (
          <div
            key={slot.key}
            className="bg-surface-1 border border-hairline rounded-lg p-4 flex flex-col justify-between h-48 relative overflow-hidden"
          >
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-sm font-semibold text-ink flex items-center gap-1.5">
                    {label}
                    {slot.required && <span className="text-primary text-xs font-bold">*</span>}
                  </h4>
                  <span className="text-xs text-ink-tertiary font-mono">{slot.labelAmh}</span>
                </div>
                {docUrl && <CheckCircle2 className="w-4 h-4 text-success" />}
              </div>
            </div>

            <div className="my-2 flex-grow flex items-center justify-center border border-dashed border-hairline rounded bg-surface-2 overflow-hidden max-h-24">
              {isUploading ? (
                <div className="flex flex-col items-center gap-1">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  <span className="text-[10px] text-ink-subtle">{t.documents.uploading}</span>
                </div>
              ) : docUrl ? (
                slot.type === "image" && !docUrl.endsWith(".pdf") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={docUrl} alt={label} className="w-full h-full object-contain" />
                ) : (
                  <div className="flex items-center gap-2 text-primary">
                    <FileText className="w-6 h-6" />
                    <span className="text-xs text-ink truncate max-w-[150px] font-mono">
                      {docUrl.split("/").pop()}
                    </span>
                  </div>
                )
              ) : (
                <div className="text-center text-ink-tertiary p-2 flex flex-col items-center">
                  {slot.type === "image" ? (
                    <Camera className="w-5 h-5 mb-1 text-ink-subtle" />
                  ) : (
                    <FileText className="w-5 h-5 mb-1 text-ink-subtle" />
                  )}
                  <span className="text-[10px]">{t.documents.empty}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-hairline">
              {docUrl ? (
                <>
                  {slot.key === "passportPhoto" && (
                    <button
                      type="button"
                      disabled={isBgRemoving}
                      onClick={() => handleRemoveBg(slot.key)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-hover disabled:opacity-50"
                    >
                      {isBgRemoving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Wand2 className="w-3.5 h-3.5" />
                      )}
                      {t.documents.removeBg}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleClear(slot.key)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-error hover:text-red-400 ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t.documents.remove}
                  </button>
                </>
              ) : (
                <label className="w-full text-center py-1 bg-surface-2 border border-hairline rounded text-xs font-medium text-ink-muted hover:bg-surface-3 cursor-pointer transition">
                  {t.documents.upload}
                  <input
                    type="file"
                    accept={slot.accept}
                    className="hidden"
                    onChange={(event) => handleUpload(slot.key, event)}
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DocumentCanvas;
