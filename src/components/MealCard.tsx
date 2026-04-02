"use client";

import { useState } from "react";
import type { FoodLog } from "@/lib/types";

interface MealCardProps {
  meal: FoodLog;
  onRate?: (id: string, rating: "up" | "down") => void;
}

const sourceEmoji: Record<string, string> = {
  photo: "\uD83D\uDCF7",
  manual: "\u270D\uFE0F",
  barcode: "\uD83D\uDCF6",
};

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function MealCard({ meal, onRate }: MealCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-[#E8E3DC] rounded-xl shadow-sm overflow-hidden">
      <button
        type="button"
        className="w-full p-4 flex items-center justify-between text-left"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[#2D2A26]">{meal.meal_name}</span>
          <span className="text-xs bg-[#FAF8F5] border border-[#E8E3DC] rounded-full px-2 py-0.5 text-[#7A756E]">
            {meal.total_calories} cal
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#7A756E]">
          <span>{formatTime(meal.logged_at)}</span>
          <span>{sourceEmoji[meal.source] ?? ""}</span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 space-y-3">
            <div className="divide-y divide-[#E8E3DC]">
              {meal.items.map((item, i) => (
                <div key={i} className="py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#2D2A26]">{item.name}</span>
                    <span className="text-xs text-[#B5AFA7]">{item.portion}</span>
                    {item.confidence < 0.7 && (
                      <span className="text-xs bg-[#FFB74D]/20 text-[#FFB74D] rounded px-1.5 py-0.5">
                        Low conf.
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#7A756E]">
                    <span>{item.calories} cal</span>
                    <span className="text-[#7E57C2]">P {item.protein_g}g</span>
                    <span className="text-[#FFB74D]">C {item.carbs_g}g</span>
                    <span className="text-[#4FC3F7]">F {item.fat_g}g</span>
                  </div>
                </div>
              ))}
            </div>

            {onRate && (
              <div className="flex items-center gap-2 pt-2 border-t border-[#E8E3DC]">
                <span className="text-xs text-[#7A756E] mr-1">Rate this log:</span>
                <button
                  type="button"
                  onClick={() => onRate(meal.id, "up")}
                  className={`p-1.5 rounded-lg transition-colors ${
                    meal.user_rating === "up"
                      ? "bg-[#4CAF50]/15 text-[#4CAF50]"
                      : "hover:bg-[#FAF8F5] text-[#B5AFA7]"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => onRate(meal.id, "down")}
                  className={`p-1.5 rounded-lg transition-colors ${
                    meal.user_rating === "down"
                      ? "bg-[#E57373]/15 text-[#E57373]"
                      : "hover:bg-[#FAF8F5] text-[#B5AFA7]"
                  }`}
                >
                  <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
