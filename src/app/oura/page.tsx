"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase-browser";
import type { OuraData } from "@/lib/types";
import OuraUpload from "@/components/OuraUpload";

export default function OuraPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (data: OuraData) => {
    setSaving(true);
    setError(null);
    try {
      const supabase = getSupabase();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      const res = await fetch("/api/oura/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save Oura data");
      await new Promise((resolve) => setTimeout(resolve, 1500));
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-[#7A756E] hover:text-[#2D2A26] transition-colors"
      >
        &larr; Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold text-[#2D2A26]">Oura Ring Data</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <OuraUpload onSave={handleSave} />

      {saving && (
        <div className="flex items-center justify-center gap-2 text-sm text-[#7A756E]">
          <div className="w-4 h-4 border-2 border-[#4CAF50] border-t-transparent rounded-full animate-spin" />
          Saving...
        </div>
      )}
    </div>
  );
}
