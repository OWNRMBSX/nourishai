"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase-browser";
import type { FoodItem } from "@/lib/types";
import PhotoUpload from "@/components/PhotoUpload";
import FoodResultCard from "@/components/FoodResultCard";

export default function LogPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"photo" | "manual">("photo");
  const [analysisResult, setAnalysisResult] = useState<{
    items: FoodItem[];
    meal_name: string;
  } | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [manualItems, setManualItems] = useState<FoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [multipliers, setMultipliers] = useState<number[]>([]);
  const [logging, setLogging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quickAddName, setQuickAddName] = useState("");
  const [quickAddCalories, setQuickAddCalories] = useState("");
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getAuthHeaders = useCallback(async (): Promise<
    Record<string, string>
  > => {
    const { data } = await getSupabase().auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  /* ── Photo tab handlers ── */

  const handleCapture = async (base64: string) => {
    setError(null);
    setAnalysisLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/food/analyze", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });
      if (!res.ok) throw new Error("Analysis failed");
      const data = await res.json();
      setAnalysisResult({ items: data.items, meal_name: data.meal_name });
      setMultipliers(data.items.map(() => 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleAdjustPortion = (index: number, multiplier: number) => {
    setMultipliers((prev) => {
      const next = [...prev];
      next[index] = multiplier;
      return next;
    });
  };

  const getAppliedItems = (): FoodItem[] => {
    if (!analysisResult) return [];
    return analysisResult.items.map((item, i) => ({
      ...item,
      calories: Math.round(item.calories * multipliers[i]),
      protein_g: Math.round(item.protein_g * multipliers[i] * 10) / 10,
      carbs_g: Math.round(item.carbs_g * multipliers[i] * 10) / 10,
      fat_g: Math.round(item.fat_g * multipliers[i] * 10) / 10,
    }));
  };

  const handleConfirmPhoto = async () => {
    if (!analysisResult) return;
    setLogging(true);
    setError(null);
    const appliedItems = getAppliedItems();
    const total_calories = appliedItems.reduce((s, i) => s + i.calories, 0);
    const total_protein_g = appliedItems.reduce((s, i) => s + i.protein_g, 0);
    const total_carbs_g = appliedItems.reduce((s, i) => s + i.carbs_g, 0);
    const total_fat_g = appliedItems.reduce((s, i) => s + i.fat_g, 0);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/food/log", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          items: appliedItems,
          total_calories,
          total_protein_g,
          total_carbs_g,
          total_fat_g,
          meal_name: analysisResult.meal_name,
          source: "photo",
        }),
      });
      if (!res.ok) throw new Error("Failed to log meal");
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log meal");
    } finally {
      setLogging(false);
    }
  };

  const handleCancelPhoto = () => {
    setAnalysisResult(null);
    setMultipliers([]);
    setError(null);
  };

  /* ── Manual tab handlers ── */

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(
          `/api/food/search?q=${encodeURIComponent(value)}`,
          { headers }
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch {
        /* silently ignore search errors */
      }
    }, 300);
  };

  const addManualItem = (item: FoodItem) => {
    setManualItems((prev) => [...prev, item]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeManualItem = (index: number) => {
    setManualItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQuickAdd = () => {
    const cals = parseInt(quickAddCalories, 10);
    if (!quickAddName.trim() || isNaN(cals) || cals <= 0) return;
    const item: FoodItem = {
      name: quickAddName.trim(),
      portion: "1 serving",
      calories: cals,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      confidence: 1,
    };
    setManualItems((prev) => [...prev, item]);
    setQuickAddName("");
    setQuickAddCalories("");
  };

  const handleLogManual = async () => {
    if (manualItems.length === 0) return;
    setLogging(true);
    setError(null);
    const total_calories = manualItems.reduce((s, i) => s + i.calories, 0);
    const total_protein_g = manualItems.reduce((s, i) => s + i.protein_g, 0);
    const total_carbs_g = manualItems.reduce((s, i) => s + i.carbs_g, 0);
    const total_fat_g = manualItems.reduce((s, i) => s + i.fat_g, 0);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/food/log", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          items: manualItems,
          total_calories,
          total_protein_g,
          total_carbs_g,
          total_fat_g,
          meal_name: "Manual entry",
          source: "manual",
        }),
      });
      if (!res.ok) throw new Error("Failed to log meal");
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log meal");
    } finally {
      setLogging(false);
    }
  };

  /* ── Manual tab running totals ── */
  const manualTotalCal = manualItems.reduce((s, i) => s + i.calories, 0);
  const manualTotalProtein = manualItems.reduce((s, i) => s + i.protein_g, 0);
  const manualTotalCarbs = manualItems.reduce((s, i) => s + i.carbs_g, 0);
  const manualTotalFat = manualItems.reduce((s, i) => s + i.fat_g, 0);

  const appliedItems = getAppliedItems();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-[#7A756E] hover:text-[#2D2A26] transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold text-[#2D2A26]">Log Food</h1>

      {/* Tab switcher */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("photo")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === "photo"
              ? "bg-[#4CAF50] text-white"
              : "bg-white text-[#7A756E] border border-[#E8E3DC] hover:border-[#B5AFA7]"
          }`}
        >
          Photo
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("manual")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === "manual"
              ? "bg-[#4CAF50] text-white"
              : "bg-white text-[#7A756E] border border-[#E8E3DC] hover:border-[#B5AFA7]"
          }`}
        >
          Manual
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-[#E57373]/10 border border-[#E57373]/30 rounded-xl px-4 py-3">
          <p className="text-sm text-[#E57373] font-medium">{error}</p>
        </div>
      )}

      {/* ── Photo Tab ── */}
      {activeTab === "photo" && (
        <div className="space-y-6">
          {!analysisResult && !analysisLoading && (
            <PhotoUpload onCapture={handleCapture} />
          )}

          {analysisLoading && (
            <FoodResultCard
              items={[]}
              mealName=""
              onAdjustPortion={() => {}}
              onConfirm={() => {}}
              onCancel={() => {}}
              loading
            />
          )}

          {analysisResult && !analysisLoading && (
            <FoodResultCard
              items={appliedItems}
              mealName={analysisResult.meal_name}
              onAdjustPortion={handleAdjustPortion}
              onConfirm={handleConfirmPhoto}
              onCancel={handleCancelPhoto}
              loading={logging}
            />
          )}
        </div>
      )}

      {/* ── Manual Tab ── */}
      {activeTab === "manual" && (
        <div className="space-y-6">
          {/* Search */}
          <div className="space-y-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search foods..."
              className="w-full px-4 py-3 rounded-xl border border-[#E8E3DC] text-sm text-[#2D2A26] placeholder-[#B5AFA7] focus:outline-none focus:border-[#4CAF50] transition-colors"
            />

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className="border border-[#E8E3DC] rounded-xl overflow-hidden divide-y divide-[#E8E3DC]">
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => addManualItem(item)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#FAF8F5] transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#2D2A26]">
                        {item.name}
                      </p>
                      <p className="text-xs text-[#7A756E]">{item.portion}</p>
                    </div>
                    <span className="text-sm text-[#7A756E]">
                      {item.calories} cal
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Added Items */}
          {manualItems.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[#2D2A26]">
                Added Items
              </h3>
              <div className="space-y-2">
                {manualItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-[#E8E3DC] rounded-xl px-4 py-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#2D2A26]">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-[#7A756E] mt-0.5">
                        <span>{item.calories} cal</span>
                        <span className="text-[#7E57C2]">
                          P {item.protein_g}g
                        </span>
                        <span className="text-[#FFB74D]">
                          C {item.carbs_g}g
                        </span>
                        <span className="text-[#4FC3F7]">
                          F {item.fat_g}g
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeManualItem(idx)}
                      className="text-[#E57373] hover:text-[#EF5350] text-sm font-medium transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              {/* Running totals */}
              <div className="bg-white border border-[#E8E3DC] rounded-xl p-4 border-l-4 border-l-[#4CAF50]">
                <p className="text-sm font-semibold text-[#2D2A26] mb-1">
                  Total
                </p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-bold text-[#2D2A26]">
                    {Math.round(manualTotalCal)} cal
                  </span>
                  <span className="text-[#7E57C2]">
                    P {Math.round(manualTotalProtein)}g
                  </span>
                  <span className="text-[#FFB74D]">
                    C {Math.round(manualTotalCarbs)}g
                  </span>
                  <span className="text-[#4FC3F7]">
                    F {Math.round(manualTotalFat)}g
                  </span>
                </div>
              </div>

              {/* Log Meal button */}
              <button
                type="button"
                onClick={handleLogManual}
                disabled={manualItems.length === 0 || logging}
                className="w-full bg-[#4CAF50] text-white font-medium rounded-xl py-3 hover:bg-[#81C784] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {logging ? "Logging..." : "Log Meal"}
              </button>
            </div>
          )}

          {/* Quick Add */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[#2D2A26]">Quick Add</h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={quickAddName}
                onChange={(e) => setQuickAddName(e.target.value)}
                placeholder="Food name"
                className="flex-1 px-3 py-2.5 rounded-xl border border-[#E8E3DC] text-sm text-[#2D2A26] placeholder-[#B5AFA7] focus:outline-none focus:border-[#4CAF50] transition-colors"
              />
              <input
                type="number"
                value={quickAddCalories}
                onChange={(e) => setQuickAddCalories(e.target.value)}
                placeholder="Cal"
                className="w-20 px-3 py-2.5 rounded-xl border border-[#E8E3DC] text-sm text-[#2D2A26] placeholder-[#B5AFA7] focus:outline-none focus:border-[#4CAF50] transition-colors"
              />
              <button
                type="button"
                onClick={handleQuickAdd}
                className="px-4 py-2.5 bg-[#4CAF50] text-white text-sm font-medium rounded-xl hover:bg-[#81C784] transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
