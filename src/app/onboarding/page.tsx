"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase-browser";
import { calculateTDEE } from "@/lib/tdee";

const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Sedentary", description: "Little or no exercise, desk job" },
  { value: "light", label: "Lightly Active", description: "Light exercise 1-3 days/week" },
  { value: "moderate", label: "Moderately Active", description: "Moderate exercise 3-5 days/week" },
  { value: "active", label: "Active", description: "Hard exercise 6-7 days/week" },
  { value: "very_active", label: "Very Active", description: "Very hard exercise, physical job" },
];

const DIETARY_RESTRICTIONS = ["Vegetarian", "Vegan", "Gluten-free", "Dairy-free", "Nut-free"];

interface OnboardingData {
  name: string;
  age: number | "";
  sex: "female" | "male" | "";
  height_cm: number | "";
  current_weight_kg: number | "";
  goal_weight_kg: number | "";
  activity_level: string;
  daily_calorie_target: number | "";
  protein_target_g: number;
  carbs_target_g: number;
  fat_target_g: number;
  water_goal_ml: number;
  dietary_restrictions: string[];
}

const TOTAL_STEPS = 6;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<OnboardingData>({
    name: "",
    age: "",
    sex: "",
    height_cm: "",
    current_weight_kg: "",
    goal_weight_kg: "",
    activity_level: "",
    daily_calorie_target: "",
    protein_target_g: 130,
    carbs_target_g: 130,
    fat_target_g: 45,
    water_goal_ml: 3000,
    dietary_restrictions: [],
  });

  function update<K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function canContinue(): boolean {
    switch (step) {
      case 0:
        return true;
      case 1:
        return (
          data.name.trim() !== "" &&
          data.age !== "" &&
          data.sex !== "" &&
          data.height_cm !== "" &&
          data.current_weight_kg !== "" &&
          data.goal_weight_kg !== ""
        );
      case 2:
        return data.activity_level !== "";
      case 3:
        return data.daily_calorie_target !== "";
      case 4:
        return true;
      case 5:
        return true;
      default:
        return false;
    }
  }

  function getTDEE() {
    if (
      data.current_weight_kg === "" ||
      data.height_cm === "" ||
      data.age === "" ||
      data.sex === "" ||
      !data.activity_level
    ) {
      return null;
    }
    return calculateTDEE(
      Number(data.current_weight_kg),
      Number(data.height_cm),
      Number(data.age),
      data.sex as "female" | "male",
      data.activity_level
    );
  }

  function handleNext() {
    if (step === 2) {
      // Pre-fill calorie target with deficit when entering step 3
      const tdee = getTDEE();
      if (tdee && data.daily_calorie_target === "") {
        update("daily_calorie_target", tdee.deficit);
      }
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  async function finish() {
    setSaving(true);
    setError("");

    try {
      const { data: sessionData, error: sessionError } = await getSupabase().auth.getSession();
      if (sessionError || !sessionData.session) {
        router.push("/login");
        return;
      }

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to save profile.");
      }

      router.push("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  /* ---- Progress Dots ---- */
  function ProgressDots() {
    return (
      <div className="flex justify-center gap-2 mb-8">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all ${
              i === step
                ? "w-3 h-3 bg-[#4CAF50]"
                : i < step
                  ? "w-2.5 h-2.5 bg-[#4CAF50]"
                  : "w-2.5 h-2.5 border-2 border-[#C4BFB8] bg-transparent"
            }`}
          />
        ))}
      </div>
    );
  }

  /* ---- Step Renderers ---- */

  function StepWelcome() {
    return (
      <div className="flex flex-col items-center text-center gap-6">
        <div className="w-28 h-28 rounded-full bg-[#4CAF50]/10 flex items-center justify-center text-6xl">
          🥗
        </div>
        <h1 className="text-3xl font-bold text-[#4CAF50]">NourishAI</h1>
        <p className="text-[#7A756E] max-w-sm">
          Three taps to log a meal. Zero mental load. Total clarity on your day.
        </p>
        <button
          onClick={handleNext}
          className="bg-[#4CAF50] text-white w-full rounded-lg py-3 font-semibold hover:bg-[#43A047] transition-colors mt-4"
        >
          Let&apos;s Get Started
        </button>
      </div>
    );
  }

  function StepPersonalStats() {
    const inputClass =
      "w-full px-4 py-3 rounded-lg border border-[#E8E3DC] focus:border-[#4CAF50] focus:outline-none";
    return (
      <div className="space-y-5">
        <h2 className="text-xl font-bold text-[#2D2A26] text-center">Tell us about yourself</h2>
        <input
          type="text"
          placeholder="Name"
          value={data.name}
          onChange={(e) => update("name", e.target.value)}
          className={inputClass}
        />
        <input
          type="number"
          placeholder="Age"
          value={data.age}
          onChange={(e) => update("age", e.target.value === "" ? "" : Number(e.target.value))}
          className={inputClass}
        />
        <select
          value={data.sex}
          onChange={(e) => update("sex", e.target.value as "female" | "male" | "")}
          className={inputClass}
        >
          <option value="" disabled>
            Sex
          </option>
          <option value="female">Female</option>
          <option value="male">Male</option>
        </select>
        <input
          type="number"
          placeholder="Height (cm)"
          value={data.height_cm}
          onChange={(e) => update("height_cm", e.target.value === "" ? "" : Number(e.target.value))}
          className={inputClass}
        />
        <input
          type="number"
          placeholder="Current Weight (kg)"
          value={data.current_weight_kg}
          onChange={(e) =>
            update("current_weight_kg", e.target.value === "" ? "" : Number(e.target.value))
          }
          className={inputClass}
        />
        <input
          type="number"
          placeholder="Goal Weight (kg)"
          value={data.goal_weight_kg}
          onChange={(e) =>
            update("goal_weight_kg", e.target.value === "" ? "" : Number(e.target.value))
          }
          className={inputClass}
        />
      </div>
    );
  }

  function StepActivityLevel() {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#2D2A26] text-center">How active are you?</h2>
        <div className="flex flex-col gap-3">
          {ACTIVITY_LEVELS.map((level) => (
            <button
              key={level.value}
              onClick={() => update("activity_level", level.value)}
              className={`w-full text-left px-4 py-4 rounded-lg border-2 transition-colors ${
                data.activity_level === level.value
                  ? "border-[#4CAF50] bg-[#4CAF50]/5"
                  : "border-[#E8E3DC] bg-white"
              }`}
            >
              <div className="font-semibold text-[#2D2A26]">{level.label}</div>
              <div className="text-sm text-[#7A756E]">{level.description}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  function StepTargets() {
    const tdee = getTDEE();
    const inputClass =
      "w-full px-4 py-3 rounded-lg border border-[#E8E3DC] focus:border-[#4CAF50] focus:outline-none";

    return (
      <div className="space-y-5">
        <h2 className="text-xl font-bold text-[#2D2A26] text-center">Set your targets</h2>

        {tdee && (
          <div className="bg-[#F5F2EE] rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#7A756E]">BMR</span>
              <span className="font-semibold text-[#2D2A26]">{tdee.bmr} kcal</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A756E]">TDEE (maintenance)</span>
              <span className="font-semibold text-[#2D2A26]">{tdee.tdee} kcal</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#7A756E]">Suggested deficit</span>
              <span className="font-semibold text-[#4CAF50]">{tdee.deficit} kcal</span>
            </div>
          </div>
        )}

        {tdee && (
          <div className="flex gap-3">
            <button
              onClick={() => update("daily_calorie_target", tdee.deficit)}
              className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors ${
                data.daily_calorie_target === tdee.deficit
                  ? "bg-[#4CAF50] text-white"
                  : "bg-[#E8E3DC] text-[#2D2A26]"
              }`}
            >
              Use deficit
            </button>
            <button
              onClick={() => update("daily_calorie_target", tdee.tdee)}
              className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors ${
                data.daily_calorie_target === tdee.tdee
                  ? "bg-[#4CAF50] text-white"
                  : "bg-[#E8E3DC] text-[#2D2A26]"
              }`}
            >
              Use maintenance
            </button>
          </div>
        )}

        <div>
          <label className="block text-sm text-[#7A756E] mb-1">Daily Calorie Target (kcal)</label>
          <input
            type="number"
            value={data.daily_calorie_target}
            onChange={(e) =>
              update("daily_calorie_target", e.target.value === "" ? "" : Number(e.target.value))
            }
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm text-[#7A756E] mb-1">Protein (g)</label>
            <input
              type="number"
              value={data.protein_target_g}
              onChange={(e) => update("protein_target_g", Number(e.target.value) || 0)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-[#7A756E] mb-1">Carbs (g)</label>
            <input
              type="number"
              value={data.carbs_target_g}
              onChange={(e) => update("carbs_target_g", Number(e.target.value) || 0)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm text-[#7A756E] mb-1">Fat (g)</label>
            <input
              type="number"
              value={data.fat_target_g}
              onChange={(e) => update("fat_target_g", Number(e.target.value) || 0)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-[#7A756E] mb-1">Water Goal (ml)</label>
          <input
            type="number"
            value={data.water_goal_ml}
            onChange={(e) => update("water_goal_ml", Number(e.target.value) || 0)}
            className={inputClass}
          />
          <p className="text-xs text-[#7A756E] mt-1">
            ~{Math.round(data.water_goal_ml / 250)} glasses
          </p>
        </div>
      </div>
    );
  }

  function StepDietaryRestrictions() {
    function toggle(restriction: string) {
      if (restriction === "None") {
        update("dietary_restrictions", []);
        return;
      }
      const current = data.dietary_restrictions;
      if (current.includes(restriction)) {
        update(
          "dietary_restrictions",
          current.filter((r) => r !== restriction)
        );
      } else {
        update("dietary_restrictions", [...current, restriction]);
      }
    }

    return (
      <div className="space-y-5">
        <h2 className="text-xl font-bold text-[#2D2A26] text-center">Any dietary preferences?</h2>
        <p className="text-sm text-[#7A756E] text-center">
          This helps our AI give better estimates
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          {DIETARY_RESTRICTIONS.map((r) => (
            <button
              key={r}
              onClick={() => toggle(r)}
              className={`px-4 py-2 rounded-full font-medium text-sm transition-colors ${
                data.dietary_restrictions.includes(r)
                  ? "bg-[#4CAF50] text-white"
                  : "bg-[#F5F2EE] text-[#2D2A26] border border-[#E8E3DC]"
              }`}
            >
              {r}
            </button>
          ))}
          <button
            onClick={() => toggle("None")}
            className={`px-4 py-2 rounded-full font-medium text-sm transition-colors ${
              data.dietary_restrictions.length === 0
                ? "bg-[#4CAF50] text-white"
                : "bg-[#F5F2EE] text-[#2D2A26] border border-[#E8E3DC]"
            }`}
          >
            None
          </button>
        </div>
      </div>
    );
  }

  function StepAllSet() {
    const tdee = getTDEE();
    const activityLabel =
      ACTIVITY_LEVELS.find((l) => l.value === data.activity_level)?.label ?? data.activity_level;

    return (
      <div className="flex flex-col items-center text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-[#4CAF50] flex items-center justify-center">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[#2D2A26]">You&apos;re all set!</h2>

        <div className="w-full space-y-3">
          <div className="bg-[#F5F2EE] rounded-lg p-4 flex justify-between">
            <span className="text-[#7A756E]">Calorie Target</span>
            <span className="font-semibold text-[#2D2A26]">{data.daily_calorie_target} kcal</span>
          </div>
          <div className="bg-[#F5F2EE] rounded-lg p-4 flex justify-between">
            <span className="text-[#7A756E]">Macros</span>
            <span className="font-semibold text-[#2D2A26]">
              P {data.protein_target_g}g / C {data.carbs_target_g}g / F {data.fat_target_g}g
            </span>
          </div>
          <div className="bg-[#F5F2EE] rounded-lg p-4 flex justify-between">
            <span className="text-[#7A756E]">Activity</span>
            <span className="font-semibold text-[#2D2A26]">{activityLabel}</span>
          </div>
        </div>

        {error && <p className="text-[#E57373] text-sm">{error}</p>}

        <button
          onClick={finish}
          disabled={saving}
          className="bg-[#4CAF50] text-white w-full rounded-lg py-3 font-semibold hover:bg-[#43A047] transition-colors disabled:opacity-50 mt-2"
        >
          {saving ? "Saving..." : "Start Tracking"}
        </button>
      </div>
    );
  }

  /* ---- Render ---- */

  const steps = [StepWelcome, StepPersonalStats, StepActivityLevel, StepTargets, StepDietaryRestrictions, StepAllSet];
  const CurrentStep = steps[step];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#FAF8F5]">
      <div className="max-w-lg w-full">
        <ProgressDots />
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <CurrentStep />

          {/* Navigation buttons for steps 1-4 */}
          {step >= 1 && step <= 4 && (
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex-1 py-3 rounded-lg font-semibold border border-[#E8E3DC] text-[#7A756E] hover:bg-[#F5F2EE] transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={!canContinue()}
                className="flex-1 bg-[#4CAF50] text-white rounded-lg py-3 font-semibold hover:bg-[#43A047] transition-colors disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
