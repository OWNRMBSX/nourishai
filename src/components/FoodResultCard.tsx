"use client";

import type { FoodItem } from "@/lib/types";

interface FoodResultCardProps {
  items: FoodItem[];
  mealName: string;
  onAdjustPortion: (index: number, multiplier: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const portionOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function FoodResultCard({
  items,
  mealName,
  onAdjustPortion,
  onConfirm,
  onCancel,
  loading,
}: FoodResultCardProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-10 h-10 border-4 border-[#4CAF50] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#7A756E]">Analyzing your meal...</p>
      </div>
    );
  }

  const totalCalories = items.reduce((s, i) => s + i.calories, 0);
  const totalProtein = items.reduce((s, i) => s + i.protein_g, 0);
  const totalCarbs = items.reduce((s, i) => s + i.carbs_g, 0);
  const totalFat = items.reduce((s, i) => s + i.fat_g, 0);

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={mealName}
        readOnly
        className="text-xl font-semibold text-[#2D2A26] bg-transparent border-none outline-none w-full"
      />

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="bg-white border border-[#E8E3DC] rounded-xl p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-[#2D2A26]">{item.name}</p>
                <p className="text-sm text-[#7A756E]">{item.portion}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#2D2A26]">
                  {item.calories} cal
                </span>
                {item.confidence >= 0.7 ? (
                  <span className="text-xs bg-[#4CAF50]/15 text-[#4CAF50] rounded-full px-2 py-0.5 font-medium">
                    High
                  </span>
                ) : (
                  <span className="text-xs bg-[#FFB74D]/15 text-[#FFB74D] rounded-full px-2 py-0.5 font-medium">
                    Verify
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs bg-[#7E57C2]/15 text-[#7E57C2] rounded-full px-2 py-0.5">
                P {item.protein_g}g
              </span>
              <span className="text-xs bg-[#FFB74D]/15 text-[#FFB74D] rounded-full px-2 py-0.5">
                C {item.carbs_g}g
              </span>
              <span className="text-xs bg-[#4FC3F7]/15 text-[#4FC3F7] rounded-full px-2 py-0.5">
                F {item.fat_g}g
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {portionOptions.map((mult) => (
                <button
                  key={mult}
                  type="button"
                  onClick={() => onAdjustPortion(index, mult)}
                  className={`text-xs rounded-full px-2.5 py-1 font-medium transition-colors ${
                    mult === 1
                      ? "bg-[#4CAF50] text-white"
                      : "bg-[#FAF8F5] text-[#7A756E] border border-[#E8E3DC] hover:border-[#4CAF50] hover:text-[#4CAF50]"
                  }`}
                >
                  {mult}x
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Total summary */}
      <div className="bg-white border border-[#E8E3DC] rounded-xl p-4 border-l-4 border-l-[#4CAF50]">
        <p className="text-sm font-semibold text-[#2D2A26] mb-2">Total</p>
        <div className="flex items-center gap-4 text-sm">
          <span className="font-bold text-[#2D2A26]">{Math.round(totalCalories)} cal</span>
          <span className="text-[#7E57C2]">P {Math.round(totalProtein)}g</span>
          <span className="text-[#FFB74D]">C {Math.round(totalCarbs)}g</span>
          <span className="text-[#4FC3F7]">F {Math.round(totalFat)}g</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 bg-[#4CAF50] text-white font-medium rounded-xl py-3 hover:bg-[#81C784] transition-colors"
        >
          Log Meal
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-[#E8E3DC] text-[#7A756E] font-medium rounded-xl py-3 hover:bg-[#FAF8F5] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
