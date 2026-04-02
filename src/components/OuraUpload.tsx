"use client";

import { useState, useRef } from "react";
import type { OuraData } from "@/lib/types";

interface OuraUploadProps {
  onSave: (data: OuraData) => void;
}

type Step = "upload" | "loading" | "results" | "saved";

const metricConfig: { key: keyof OuraData; label: string; icon: string; unit: string }[] = [
  { key: "active_calories", label: "Active Cal", icon: "\uD83D\uDD25", unit: " cal" },
  { key: "total_calories_burned", label: "Total Burn", icon: "\u26A1", unit: " cal" },
  { key: "sleep_score", label: "Sleep Score", icon: "\uD83D\uDCA4", unit: "" },
  { key: "sleep_duration_hours", label: "Sleep Duration", icon: "\uD83D\uDECC", unit: " hrs" },
  { key: "readiness_score", label: "Readiness", icon: "\uD83C\uDFAF", unit: "" },
  { key: "resting_heart_rate", label: "RHR", icon: "\u2764\uFE0F", unit: " bpm" },
  { key: "hrv", label: "HRV", icon: "\uD83D\uDCC8", unit: " ms" },
];

export default function OuraUpload({ onSave }: OuraUploadProps) {
  const [step, setStep] = useState<Step>("upload");
  const [ouraData, setOuraData] = useState<OuraData | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setStep("loading");
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch("/api/oura/screenshot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });
        const data: OuraData = await res.json();
        setOuraData(data);
        setStep("results");
      } catch {
        setStep("upload");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleSave = () => {
    if (ouraData) {
      onSave(ouraData);
      setStep("saved");
    }
  };

  if (step === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-10 h-10 border-4 border-[#4CAF50] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#7A756E]">Analyzing your Oura data...</p>
      </div>
    );
  }

  if (step === "saved") {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-16 h-16 rounded-full bg-[#4CAF50]/15 flex items-center justify-center">
          <svg className="w-8 h-8 text-[#4CAF50]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-semibold text-[#2D2A26]">Data saved!</p>
      </div>
    );
  }

  if (step === "results" && ouraData) {
    return (
      <div className="space-y-4">
        {ouraData.readiness_score < 60 && (
          <div className="bg-[#FFB74D]/10 border border-[#FFB74D]/30 rounded-xl p-3 text-sm text-[#FFB74D] text-center font-medium">
            Recovery day recommended -- your readiness is below 60
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {metricConfig.map(({ key, label, icon, unit }) => (
            <div
              key={key}
              className="bg-white border border-[#E8E3DC] rounded-xl p-3 text-center"
            >
              <span className="text-2xl">{icon}</span>
              <p className="text-xs text-[#7A756E] mt-1">{label}</p>
              <p className="text-lg font-bold text-[#2D2A26]">
                {key === "sleep_duration_hours"
                  ? ouraData[key].toFixed(1)
                  : Math.round(ouraData[key])}
                <span className="text-xs text-[#7A756E] font-normal">{unit}</span>
              </p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="w-full bg-[#4CAF50] text-white font-medium rounded-xl py-3 hover:bg-[#81C784] transition-colors"
        >
          Save &amp; Apply
        </button>
      </div>
    );
  }

  // Upload step
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      className="min-h-[200px] flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#E8E3DC] hover:border-[#B5AFA7] cursor-pointer transition-colors"
    >
      <svg
        className="w-12 h-12 text-[#B5AFA7]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <p className="text-sm font-medium text-[#2D2A26]">Upload your Oura screenshot</p>
      <p className="text-xs text-[#B5AFA7]">
        Take a screenshot of your Oura app home screen
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
