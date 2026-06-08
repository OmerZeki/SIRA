"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CandidateForm } from "@/components/sira/CandidateForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewCandidatePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/applicants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Failed to save: ${err.error || "Unknown error"}`);
        return;
      }

      const candidate = await res.json();
      router.push(`/candidates/${candidate.id}`);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/candidates" className="p-2 rounded-md hover:bg-surface-1 text-ink-subtle hover:text-ink transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-headline text-ink font-semibold">Onboard New Candidate</h2>
          <p className="text-xs text-ink-subtle">Scan passport or fill form — then submit</p>
        </div>
      </div>

      <CandidateForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
