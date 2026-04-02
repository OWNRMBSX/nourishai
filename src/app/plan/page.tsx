"use client";

import { useState, useRef } from "react";
import Link from "next/link";

/* ---------- types ---------- */
interface PlanResult {
  daily_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  bmr: number;
  tdee: number;
  explanation: string;
  weekly_schedule: { day: string; meals: string[] }[];
  tips: string[];
  recovery_notes: string;
  sample_day: { meal: string; description: string; calories: number }[];
}

/* ---------- constants ---------- */
const ACTIVITY_OPTIONS = [
  {
    value: "sedentary",
    label: "Sedentary",
    desc: "Desk job, little exercise",
  },
  {
    value: "light",
    label: "Lightly Active",
    desc: "Light exercise 1-3 days/week",
  },
  {
    value: "moderate",
    label: "Moderately Active",
    desc: "Moderate exercise 3-5 days/week",
  },
  {
    value: "active",
    label: "Active",
    desc: "Hard exercise 6-7 days/week",
  },
  {
    value: "very_active",
    label: "Very Active",
    desc: "Intense training or physical job",
  },
];

const EXERCISE_TYPES = [
  "Strength Training",
  "Cardio",
  "HIIT",
  "Yoga",
  "Sports",
  "Walking",
];

const GOALS = [
  { value: "lose_fat", label: "Lose Fat" },
  { value: "build_muscle", label: "Build Muscle" },
  { value: "maintain", label: "Maintain" },
  { value: "recomposition", label: "Body Recomposition" },
];

const TIMELINES = ["4 weeks", "8 weeks", "12 weeks", "6 months"];

const DIET_RESTRICTIONS = [
  "None",
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Dairy-Free",
  "Keto",
  "Paleo",
];

/* ---------- component ---------- */
export default function PlanPage() {
  /* form state — imperial units */
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<"female" | "male">("male");
  const [heightFt, setHeightFt] = useState("5");
  const [heightIn, setHeightIn] = useState("7");
  const [weightLb, setWeightLb] = useState("");
  const [goalWeightLb, setGoalWeightLb] = useState("");

  const [activityLevel, setActivityLevel] = useState("moderate");
  const [exerciseTypes, setExerciseTypes] = useState<string[]>([]);
  const [exerciseFrequency, setExerciseFrequency] = useState(3);

  const [primaryGoal, setPrimaryGoal] = useState("lose_fat");
  const [timeline, setTimeline] = useState("12 weeks");
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([
    "None",
  ]);
  const [healthNotes, setHealthNotes] = useState("");

  const [restingHR, setRestingHR] = useState("");
  const [avgSleep, setAvgSleep] = useState("");
  const [stressLevel, setStressLevel] = useState("");
  const [ouraScreenshot, setOuraScreenshot] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [error, setError] = useState("");

  const resultsRef = useRef<HTMLDivElement>(null);

  /* helpers */
  function toggleChip(
    value: string,
    list: string[],
    setter: (v: string[]) => void
  ) {
    if (list.includes(value)) {
      setter(list.filter((v) => v !== value));
    } else {
      setter([...list, value]);
    }
  }

  function toggleDiet(value: string) {
    if (value === "None") {
      setDietaryRestrictions(["None"]);
      return;
    }
    const without = dietaryRestrictions.filter((d) => d !== "None");
    if (without.includes(value)) {
      const next = without.filter((d) => d !== value);
      setDietaryRestrictions(next.length === 0 ? ["None"] : next);
    } else {
      setDietaryRestrictions([...without, value]);
    }
  }

  function handleOuraUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setOuraScreenshot(base64);
    };
    reader.readAsDataURL(file);
  }

  async function handleGenerate() {
    if (!age || !heightFt || !weightLb) {
      setError("Please fill in age, height, and weight.");
      return;
    }
    setError("");
    setLoading(true);
    setPlan(null);

    // Convert imperial to metric for the API
    const heightCm = Math.round((Number(heightFt) * 12 + Number(heightIn || 0)) * 2.54);
    const weightKg = Math.round(Number(weightLb) / 2.20462 * 10) / 10;
    const goalKg = goalWeightLb ? Math.round(Number(goalWeightLb) / 2.20462 * 10) / 10 : weightKg;

    try {
      const res = await fetch("/api/plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || undefined,
          age: Number(age),
          sex,
          height_cm: heightCm,
          weight_kg: weightKg,
          goal_weight_kg: goalKg,
          activity_level: activityLevel,
          exercise_types: exerciseTypes,
          exercise_frequency: exerciseFrequency,
          primary_goal: primaryGoal,
          timeline,
          dietary_restrictions: dietaryRestrictions.filter((d) => d !== "None"),
          health_notes: healthNotes || undefined,
          resting_heart_rate: restingHR ? Number(restingHR) : undefined,
          avg_sleep_hours: avgSleep ? Number(avgSleep) : undefined,
          stress_level: stressLevel || undefined,
          oura_screenshot: ouraScreenshot || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to generate plan");
      }

      const data: PlanResult = await res.json();
      setPlan(data);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  /* macro bar helper */
  function MacroBar({
    label,
    grams,
    color,
    total,
  }: {
    label: string;
    grams: number;
    color: string;
    total: number;
  }) {
    const pct = total > 0 ? Math.round((grams / total) * 100) : 0;
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-[#2D2A26]">{label}</span>
          <span className="text-[#7A756E]">
            {grams}g ({pct}%)
          </span>
        </div>
        <div className="h-3 rounded-full bg-[#F0EDE8] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      </div>
    );
  }

  /* ---- RENDER ---- */
  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-[#E8E3DC] shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-[#4CAF50]">
            NourishAI
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-[#4CAF50] hover:underline"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#4CAF50]/5 via-[#FAF8F5] to-[#4CAF50]/10 py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4CAF50]/10 text-[#4CAF50] text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse" />
            Free &middot; No account needed
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#2D2A26] leading-tight">
            Get Your Free Personalized
            <br />
            <span className="text-[#4CAF50]">Nutrition Plan</span>
          </h1>
          <p className="mt-4 text-lg text-[#7A756E] max-w-xl mx-auto">
            Powered by AI. Based on your unique body and goals. Takes about 60
            seconds.
          </p>
        </div>
      </section>

      {/* Form */}
      <main className="max-w-3xl mx-auto px-4 pb-24 -mt-4">
        {/* Section 1 — Basic Stats */}
        <div className="card mb-6">
          <h2 className="text-lg font-bold text-[#2D2A26] mb-4 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#4CAF50] text-white text-sm font-bold">
              1
            </span>
            Basic Stats
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-[#7A756E] mb-1">
                Name{" "}
                <span className="text-xs text-[#B0ABA3]">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-[#E8E3DC] bg-white px-3 py-2.5 text-sm text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/30 focus:border-[#4CAF50]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#7A756E] mb-1">
                Age *
              </label>
              <input
                type="number"
                placeholder="25"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full rounded-lg border border-[#E8E3DC] bg-white px-3 py-2.5 text-sm text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/30 focus:border-[#4CAF50]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#7A756E] mb-1">
                Sex *
              </label>
              <div className="flex gap-3">
                {(["male", "female"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSex(s)}
                    className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                      sex === s
                        ? "border-[#4CAF50] bg-[#4CAF50]/10 text-[#4CAF50]"
                        : "border-[#E8E3DC] text-[#7A756E] hover:border-[#B0ABA3]"
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-[#7A756E] mb-1">
                Height *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type="number"
                    placeholder="5"
                    value={heightFt}
                    onChange={(e) => setHeightFt(e.target.value)}
                    className="w-full rounded-lg border border-[#E8E3DC] bg-white px-3 py-2.5 text-sm text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/30 focus:border-[#4CAF50]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A756E] text-sm">ft</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="7"
                    value={heightIn}
                    onChange={(e) => setHeightIn(e.target.value)}
                    className="w-full rounded-lg border border-[#E8E3DC] bg-white px-3 py-2.5 text-sm text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/30 focus:border-[#4CAF50]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A756E] text-sm">in</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#7A756E] mb-1">
                Current Weight (lb) *
              </label>
              <input
                type="number"
                placeholder="150"
                value={weightLb}
                onChange={(e) => setWeightLb(e.target.value)}
                className="w-full rounded-lg border border-[#E8E3DC] bg-white px-3 py-2.5 text-sm text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/30 focus:border-[#4CAF50]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#7A756E] mb-1">
                Goal Weight (lb)
              </label>
              <input
                type="number"
                placeholder="140"
                value={goalWeightLb}
                onChange={(e) => setGoalWeightLb(e.target.value)}
                className="w-full rounded-lg border border-[#E8E3DC] bg-white px-3 py-2.5 text-sm text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/30 focus:border-[#4CAF50]"
              />
            </div>
          </div>
        </div>

        {/* Section 2 — Activity & Lifestyle */}
        <div className="card mb-6">
          <h2 className="text-lg font-bold text-[#2D2A26] mb-4 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#4CAF50] text-white text-sm font-bold">
              2
            </span>
            Activity &amp; Lifestyle
          </h2>

          <label className="block text-sm font-medium text-[#7A756E] mb-2">
            Activity Level
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
            {ACTIVITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setActivityLevel(opt.value)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  activityLevel === opt.value
                    ? "border-[#4CAF50] bg-[#4CAF50]/10"
                    : "border-[#E8E3DC] hover:border-[#B0ABA3]"
                }`}
              >
                <div
                  className={`text-sm font-semibold ${
                    activityLevel === opt.value
                      ? "text-[#4CAF50]"
                      : "text-[#2D2A26]"
                  }`}
                >
                  {opt.label}
                </div>
                <div className="text-xs text-[#B0ABA3] mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>

          <label className="block text-sm font-medium text-[#7A756E] mb-2">
            Exercise Types
          </label>
          <div className="flex flex-wrap gap-2 mb-5">
            {EXERCISE_TYPES.map((et) => (
              <button
                key={et}
                type="button"
                onClick={() => toggleChip(et, exerciseTypes, setExerciseTypes)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${
                  exerciseTypes.includes(et)
                    ? "border-[#4CAF50] bg-[#4CAF50]/10 text-[#4CAF50]"
                    : "border-[#E8E3DC] text-[#7A756E] hover:border-[#B0ABA3]"
                }`}
              >
                {et}
              </button>
            ))}
          </div>

          <label className="block text-sm font-medium text-[#7A756E] mb-2">
            Exercise Frequency:{" "}
            <span className="text-[#4CAF50] font-bold">
              {exerciseFrequency} days/week
            </span>
          </label>
          <input
            type="range"
            min={1}
            max={7}
            value={exerciseFrequency}
            onChange={(e) => setExerciseFrequency(Number(e.target.value))}
            className="w-full accent-[#4CAF50]"
          />
          <div className="flex justify-between text-xs text-[#B0ABA3] mt-1">
            <span>1</span>
            <span>7</span>
          </div>
        </div>

        {/* Section 3 — Goals & Preferences */}
        <div className="card mb-6">
          <h2 className="text-lg font-bold text-[#2D2A26] mb-4 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#4CAF50] text-white text-sm font-bold">
              3
            </span>
            Goals &amp; Preferences
          </h2>

          <label className="block text-sm font-medium text-[#7A756E] mb-2">
            Primary Goal
          </label>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {GOALS.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => setPrimaryGoal(g.value)}
                className={`rounded-lg border p-3 text-sm font-medium transition-colors ${
                  primaryGoal === g.value
                    ? "border-[#4CAF50] bg-[#4CAF50]/10 text-[#4CAF50]"
                    : "border-[#E8E3DC] text-[#7A756E] hover:border-[#B0ABA3]"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-[#7A756E] mb-1">
                Timeline
              </label>
              <select
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                className="w-full rounded-lg border border-[#E8E3DC] bg-white px-3 py-2.5 text-sm text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/30 focus:border-[#4CAF50]"
              >
                {TIMELINES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="block text-sm font-medium text-[#7A756E] mb-2">
            Dietary Restrictions
          </label>
          <div className="flex flex-wrap gap-2 mb-5">
            {DIET_RESTRICTIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDiet(d)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${
                  dietaryRestrictions.includes(d)
                    ? "border-[#4CAF50] bg-[#4CAF50]/10 text-[#4CAF50]"
                    : "border-[#E8E3DC] text-[#7A756E] hover:border-[#B0ABA3]"
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <label className="block text-sm font-medium text-[#7A756E] mb-1">
            Health Conditions / Notes{" "}
            <span className="text-xs text-[#B0ABA3]">(optional)</span>
          </label>
          <textarea
            rows={3}
            placeholder="E.g., knee injury, diabetes, food allergies..."
            value={healthNotes}
            onChange={(e) => setHealthNotes(e.target.value)}
            className="w-full rounded-lg border border-[#E8E3DC] bg-white px-3 py-2.5 text-sm text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/30 focus:border-[#4CAF50] resize-none"
          />
        </div>

        {/* Section 4 — Biometric Data (optional) */}
        <div className="card mb-8">
          <h2 className="text-lg font-bold text-[#2D2A26] mb-1 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#4CAF50] text-white text-sm font-bold">
              4
            </span>
            Biometric Data
          </h2>
          <p className="text-xs text-[#B0ABA3] mb-4 ml-9">
            Optional — helps us personalize recovery recommendations
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-[#7A756E] mb-1">
                Resting HR (bpm)
              </label>
              <input
                type="number"
                placeholder="65"
                value={restingHR}
                onChange={(e) => setRestingHR(e.target.value)}
                className="w-full rounded-lg border border-[#E8E3DC] bg-white px-3 py-2.5 text-sm text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/30 focus:border-[#4CAF50]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#7A756E] mb-1">
                Avg Sleep (hours)
              </label>
              <input
                type="number"
                step="0.5"
                placeholder="7.5"
                value={avgSleep}
                onChange={(e) => setAvgSleep(e.target.value)}
                className="w-full rounded-lg border border-[#E8E3DC] bg-white px-3 py-2.5 text-sm text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/30 focus:border-[#4CAF50]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#7A756E] mb-1">
                Stress Level
              </label>
              <select
                value={stressLevel}
                onChange={(e) => setStressLevel(e.target.value)}
                className="w-full rounded-lg border border-[#E8E3DC] bg-white px-3 py-2.5 text-sm text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-[#4CAF50]/30 focus:border-[#4CAF50]"
              >
                <option value="">Select...</option>
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <label className="block text-sm font-medium text-[#7A756E] mb-2">
            Oura Ring Screenshot{" "}
            <span className="text-xs text-[#B0ABA3]">(optional)</span>
          </label>
          <label className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#E8E3DC] hover:border-[#4CAF50] transition-colors p-6 cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleOuraUpload}
              className="hidden"
            />
            {ouraScreenshot ? (
              <span className="text-sm text-[#4CAF50] font-medium">
                Screenshot uploaded
              </span>
            ) : (
              <span className="text-sm text-[#B0ABA3]">
                Click to upload a screenshot
              </span>
            )}
          </label>
        </div>

        {/* Generate Button */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <button
          type="button"
          disabled={loading}
          onClick={handleGenerate}
          className="w-full py-4 rounded-xl bg-[#4CAF50] hover:bg-[#43A047] active:bg-[#388E3C] text-white font-bold text-lg shadow-lg shadow-[#4CAF50]/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="inline-flex items-center gap-3">
              <svg
                className="w-5 h-5 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Generating your personalized plan...
            </span>
          ) : (
            "Generate My Plan"
          )}
        </button>

        {/* ---------- RESULTS ---------- */}
        {plan && (
          <div ref={resultsRef} className="mt-12 space-y-6">
            <h2 className="text-2xl font-extrabold text-[#2D2A26] text-center">
              {name ? `${name}'s` : "Your"} Custom Plan
            </h2>

            {/* Daily Calories */}
            <div className="card text-center">
              <p className="text-sm text-[#7A756E] mb-1">
                Daily Calorie Target
              </p>
              <p className="text-5xl font-extrabold text-[#4CAF50]">
                {plan.daily_calories.toLocaleString()}
              </p>
              <p className="text-sm text-[#7A756E] mt-1">kcal / day</p>
              <div className="flex justify-center gap-6 mt-4 text-xs text-[#B0ABA3]">
                <span>
                  BMR: <strong className="text-[#2D2A26]">{plan.bmr}</strong>
                </span>
                <span>
                  TDEE: <strong className="text-[#2D2A26]">{plan.tdee}</strong>
                </span>
              </div>
              <p className="text-sm text-[#7A756E] mt-4 max-w-lg mx-auto leading-relaxed">
                {plan.explanation}
              </p>
            </div>

            {/* Macro Breakdown */}
            <div className="card">
              <h3 className="text-lg font-bold text-[#2D2A26] mb-4">
                Macro Breakdown
              </h3>
              <div className="space-y-3">
                <MacroBar
                  label="Protein"
                  grams={plan.protein_g}
                  color="#4CAF50"
                  total={plan.protein_g + plan.carbs_g + plan.fat_g}
                />
                <MacroBar
                  label="Carbs"
                  grams={plan.carbs_g}
                  color="#FF9800"
                  total={plan.protein_g + plan.carbs_g + plan.fat_g}
                />
                <MacroBar
                  label="Fat"
                  grams={plan.fat_g}
                  color="#2196F3"
                  total={plan.protein_g + plan.carbs_g + plan.fat_g}
                />
              </div>
            </div>

            {/* Weekly Schedule */}
            <div className="card">
              <h3 className="text-lg font-bold text-[#2D2A26] mb-4">
                Weekly Schedule
              </h3>
              <div className="space-y-3">
                {plan.weekly_schedule.map((d) => (
                  <details
                    key={d.day}
                    className="group rounded-lg border border-[#E8E3DC] overflow-hidden"
                  >
                    <summary className="flex items-center justify-between cursor-pointer px-4 py-3 bg-[#FAF8F5] hover:bg-[#F0EDE8] transition-colors">
                      <span className="font-semibold text-sm text-[#2D2A26]">
                        {d.day}
                      </span>
                      <svg
                        className="w-4 h-4 text-[#B0ABA3] transition-transform group-open:rotate-180"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </summary>
                    <ul className="px-4 py-3 space-y-1.5">
                      {d.meals.map((meal, i) => (
                        <li
                          key={i}
                          className="text-sm text-[#7A756E] flex gap-2"
                        >
                          <span className="text-[#4CAF50] mt-0.5">&#8226;</span>
                          {meal}
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="card">
              <h3 className="text-lg font-bold text-[#2D2A26] mb-4">
                Personalized Tips
              </h3>
              <ul className="space-y-3">
                {plan.tips.map((tip, i) => (
                  <li key={i} className="flex gap-3 text-sm text-[#7A756E]">
                    <span className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#4CAF50]/10 text-[#4CAF50] text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recovery Notes */}
            {plan.recovery_notes && (
              <div className="card border-l-4 border-l-[#2196F3]">
                <h3 className="text-lg font-bold text-[#2D2A26] mb-2">
                  Recovery &amp; Sleep
                </h3>
                <p className="text-sm text-[#7A756E] leading-relaxed">
                  {plan.recovery_notes}
                </p>
              </div>
            )}

            {/* Sample Day */}
            <div className="card">
              <h3 className="text-lg font-bold text-[#2D2A26] mb-4">
                Sample Day
              </h3>
              <div className="space-y-4">
                {plan.sample_day.map((item) => (
                  <div
                    key={item.meal}
                    className="flex items-start justify-between gap-4 pb-3 border-b border-[#F0EDE8] last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#2D2A26]">
                        {item.meal}
                      </p>
                      <p className="text-sm text-[#7A756E] mt-0.5">
                        {item.description}
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-sm font-bold text-[#4CAF50]">
                      {item.calories} kcal
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-3 rounded-xl border-2 border-[#4CAF50] text-[#4CAF50] font-semibold text-sm hover:bg-[#4CAF50]/5 transition-colors"
              >
                Download as PDF
              </button>
              <Link
                href="/login"
                className="flex-1 py-3 rounded-xl bg-[#4CAF50] text-white font-semibold text-sm text-center hover:bg-[#43A047] transition-colors shadow-lg shadow-[#4CAF50]/25"
              >
                Start Tracking with NourishAI
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
