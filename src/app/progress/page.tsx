"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase-browser";
import type { WeeklyProgress } from "@/lib/types";
import WeeklyChart from "@/components/WeeklyChart";

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatRangeLabel(start: Date): string {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", opts)} - ${end.toLocaleDateString("en-US", opts)}`;
}

export default function ProgressPage() {
  const router = useRouter();
  const [weekStart, setWeekStart] = useState(() => getMondayOfWeek(new Date()));
  const [progress, setProgress] = useState<WeeklyProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentMonday = getMondayOfWeek(new Date());
  const isCurrentWeek = weekStart.getTime() === currentMonday.getTime();

  const fetchProgress = useCallback(
    async (start: Date) => {
      setLoading(true);
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
        const res = await fetch(
          `/api/progress/weekly?start=${formatDateStr(start)}`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }
        );
        if (!res.ok) throw new Error("Failed to load progress");
        const data: WeeklyProgress = await res.json();
        setProgress(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    fetchProgress(weekStart);
  }, [weekStart, fetchProgress]);

  const goToPrevWeek = () => {
    const prev = new Date(weekStart);
    prev.setDate(prev.getDate() - 7);
    setWeekStart(prev);
  };

  const goToNextWeek = () => {
    if (!isCurrentWeek) {
      const next = new Date(weekStart);
      next.setDate(next.getDate() + 7);
      setWeekStart(next);
    }
  };

  const avgCalories =
    progress && progress.days.length > 0
      ? Math.round(
          progress.days.reduce((s, d) => s + d.calories, 0) /
            progress.days.length
        )
      : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#2D2A26] mb-6">
        Weekly Progress
      </h1>

      {/* Week navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={goToPrevWeek}
          className="w-10 h-10 flex items-center justify-center rounded-full border border-[#E8E3DC] hover:bg-[#F5F2EE] transition-colors"
          aria-label="Previous week"
        >
          <svg
            className="w-5 h-5 text-[#2D2A26]"
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
        </button>

        <span className="text-sm font-medium text-[#2D2A26]">
          {formatRangeLabel(weekStart)}
        </span>

        <button
          type="button"
          onClick={goToNextWeek}
          disabled={isCurrentWeek}
          className="w-10 h-10 flex items-center justify-center rounded-full border border-[#E8E3DC] hover:bg-[#F5F2EE] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next week"
        >
          <svg
            className="w-5 h-5 text-[#2D2A26]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-[#4CAF50] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : progress && progress.days.length > 0 ? (
        <>
          {/* Chart */}
          <div className="bg-white border border-[#E8E3DC] rounded-xl p-4 mb-6">
            <WeeklyChart days={progress.days} />
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-[#E8E3DC] rounded-xl p-4 text-center">
              <p className="text-xs text-[#7A756E] mb-1">Avg Daily Calories</p>
              <p className="text-2xl font-bold text-[#2D2A26]">{avgCalories}</p>
            </div>
            <div className="bg-white border border-[#E8E3DC] rounded-xl p-4 text-center">
              <p className="text-xs text-[#7A756E] mb-1">Avg Protein</p>
              <p className="text-2xl font-bold text-[#2D2A26]">
                {Math.round(progress.avg_protein)}
                <span className="text-sm font-normal text-[#7A756E]">g</span>
              </p>
            </div>
            <div className="bg-white border border-[#E8E3DC] rounded-xl p-4 text-center">
              <p className="text-xs text-[#7A756E] mb-1">Current Streak</p>
              <p className="text-2xl font-bold text-[#2D2A26]">
                {progress.streak}
                <span className="text-sm font-normal text-[#7A756E]">
                  {" "}
                  days
                </span>{" "}
                <span role="img" aria-label="fire">
                  🔥
                </span>
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <p className="text-[#7A756E] text-sm">
            No data for this week yet. Start logging meals!
          </p>
        </div>
      )}
    </div>
  );
}
