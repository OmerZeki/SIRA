"use client";

import React, { useState, useRef } from "react";
import { Upload, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { useCurrentLocale } from "@/components/sira/LanguageSwitcher";
import { getDictionary } from "@/lib/i18n";

interface PassportDropZoneProps {
  onOcrComplete: (fields: any) => void;
}

export const PassportDropZone: React.FC<PassportDropZoneProps> = ({ onOcrComplete }) => {
  const locale = useCurrentLocale();
  const t = getDictionary(locale);
  const [isDragActive, setIsDragActive] = useState(false);
  const [status, setStatus] = useState<"idle" | "compressing" | "uploading" | "processing" | "success" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [provider, setProvider] = useState<string>("");
  const [ocrPreview, setOcrPreview] = useState<{ english?: string; amharic?: string; arabic?: string }>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewSections = [
    { key: "english", label: t.ocr.previewEnglish },
    { key: "amharic", label: t.ocr.previewAmharic },
    { key: "arabic", label: t.ocr.previewArabic },
  ] as const;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  // Compress image on client side using Canvas API
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
          const maxEdge = 2000;

          // Downscale if over 2000px
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
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error("Canvas conversion to Blob failed"));
              }
            },
            "image/jpeg",
            0.85 // 85% quality
          );
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const processFile = async (file: File) => {
    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/heic", "application/pdf"];
    if (!validTypes.includes(file.type) && !file.name.endsWith(".heic")) {
      setStatus("error");
      setErrorMessage(t.ocr.unsupportedFile);
      return;
    }

    try {
      setStatus("compressing");
      setProgress(20);
      
      let uploadBlob: Blob = file;
      if (file.type.startsWith("image/") && !file.name.endsWith(".heic")) {
        uploadBlob = await compressImage(file);
      }
      
      setStatus("uploading");
      setProgress(50);

      const formData = new FormData();
      formData.append("file", uploadBlob, file.name.replace(/\.[^/.]+$/, "") + ".jpg");

      setStatus("processing");
      setProgress(75);

      const response = await fetch("/api/ocr/passport", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json();
      
      setStatus("success");
      setProgress(100);
      setConfidence(result.confidenceScore);
      setProvider(result.provider || "");
      setOcrPreview(result.multilingualText || {});
      setWarnings(result.warnings || []);

      // Callback to fill form fields
      onOcrComplete(result);

      // Reset dropzone state after delay
      setTimeout(() => {
        setStatus("idle");
        setConfidence(null);
        setProvider("");
        setOcrPreview({});
        setWarnings([]);
      }, 5000);

    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage(err.message || t.ocr.genericError);
    }
  };

  return (
    <div className="w-full">
      <div
        className={`w-full h-44 rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-200 bg-surface-1 ${
          isDragActive
            ? "border-primary bg-primary/5 scale-[0.99]"
            : "border-hairline hover:border-primary/50 hover:bg-surface-2"
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,.heic,application/pdf"
          onChange={handleFileChange}
        />

        {status === "idle" && (
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 rounded-full bg-surface-2 border border-hairline text-ink-subtle">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">
                {t.ocr.dragDrop}{" "}
                <span className="text-primary font-semibold hover:text-primary-hover">{t.ocr.browseFiles}</span>
              </p>
              <p className="text-xs text-ink-tertiary mt-1">{t.ocr.supportsFormats}</p>
            </div>
          </div>
        )}

        {(status === "compressing" || status === "uploading" || status === "processing") && (
          <div className="flex flex-col items-center gap-3 w-full max-w-xs">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <div className="w-full">
              <div className="flex justify-between text-xs text-ink-muted mb-1">
                <span>
                  {status === "compressing" && t.ocr.optimizing}
                  {status === "uploading" && t.ocr.uploading}
                  {status === "processing" && t.ocr.parsing}
                </span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-1 bg-surface-3 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-success" />
            <p className="text-sm font-medium text-ink">{t.ocr.loadedSuccess}</p>
            {confidence !== null && (
              <div className="mt-1 flex flex-col items-center gap-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-ink-muted">{t.ocr.confidence}</span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      confidence >= 0.95
                        ? "bg-success/15 text-success"
                        : confidence >= 0.7
                        ? "bg-warning/15 text-warning"
                        : "bg-error/15 text-error"
                    }`}
                  >
                    {(confidence * 100).toFixed(0)}%
                  </span>
                  {provider && (
                    <span className="text-[10px] uppercase tracking-wider text-ink-tertiary">
                      {provider}
                    </span>
                  )}
                </div>
                {warnings.map((warning) => (
                  <p key={warning} className="text-[10px] text-warning max-w-xs">
                    {warning}
                  </p>
                ))}
                {(ocrPreview.english || ocrPreview.amharic || ocrPreview.arabic) && (
                  <div className="w-full max-w-sm rounded border border-hairline bg-surface-2 p-2 text-left">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary">
                      {t.ocr.languagePreview}
                    </p>
                    <div className="space-y-2 text-[10px] text-ink-subtle">
                      {previewSections.map((section) => {
                        const value = ocrPreview[section.key];
                        if (!value) return null;
                        return (
                          <div key={section.key} className="rounded border border-hairline bg-surface-1 px-2 py-1.5">
                            <p className="mb-1 text-[10px] font-semibold text-ink">{section.label}</p>
                            <p className="line-clamp-2 whitespace-pre-wrap">{value}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-2">
            <AlertTriangle className="w-8 h-8 text-error" />
            <p className="text-sm font-medium text-ink">{t.ocr.onboardingFailed}</p>
            <p className="text-xs text-error max-w-sm">{errorMessage}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setStatus("idle");
              }}
              className="mt-2 text-xs font-semibold text-primary hover:text-primary-hover underline"
            >
              {t.ocr.tryAgain}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PassportDropZone;
