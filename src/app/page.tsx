"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase-browser";
import type { DailySummary, UserProfile } from "@/lib/types";
import CalorieRing from "@/components/CalorieRing";
import MacroBar from "@/components/MacroBar";
import MealCard from "@/components/MealCard";
import WaterTracker from "@/components/WaterTracker";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function DashboardPage() {
  const router = useRouter();
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const { data } = await getSupabase().auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchData = useCallback(async () => {
    const { data } = await getSupabase().auth.getSession();
    if (!data.session) {
      router.push("/login");
      return;
    }

    const headers = await getAuthHeaders();

    try {
      const [summaryRes, profileRes] = await Promise.all([
        fetch(`/api/food/log?date=${todayISO()}`, { headers }),
        fetch("/api/profile", { headers }),
      ]);

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setDailySummary(summaryData);
      }

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [router, getAuthHeaders]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRate = async (id: string, rating: "up" | "down") => {
    const headers = await getAuthHeaders();
    await fetch(`/api/food/${id}/rate`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ rating }),
    });
    fetchData();
  };

  const handleAddWater = async () => {
    const headers = await getAuthHeaders();
    await fetch("/api/water", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ amount_ml: 250 }),
    });
    fetchData();
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[#E8E3DC] rounded w-2/3" />
          <div className="h-4 bg-[#E8E3DC] rounded w-1/3" />
        </div>
        <div className="flex justify-center py-8">
          <div className="w-[200px] h-[200px] rounded-full bg-[#E8E3DC] animate-pulse" />
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-[#E8E3DC] rounded" />
          <div className="h-6 bg-[#E8E3DC] rounded" />
          <div className="h-6 bg-[#E8E3DC] rounded" />
        </div>
        <div className="h-20 bg-[#E8E3DC] rounded-xl animate-pulse" />
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-[#E8E3DC] rounded w-1/3" />
          <div className="h-24 bg-[#E8E3DC] rounded-xl" />
        </div>
      </div>
    );
  }

  const calorieTarget =
    dailySummary?.adjusted_calorie_target ||
    profile?.daily_calorie_target ||
    2000;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-[#2D2A26]">
          {getGreeting()}, {profile?.name || "there"}
        </h1>
        <p className="text-sm text-[#7A756E]">{formatDate()}</p>
      </div>

      {/* Active calories banner */}
      {dailySummary && dailySummary.active_calories_burned > 0 && (
        <div className="bg-[#4CAF50]/10 border border-[#4CAF50]/30 rounded-xl px-4 py-3">
          <p className="text-sm text-[#4CAF50] font-medium">
            You&apos;ve burned {dailySummary.active_calories_burned} extra
            calories today. Target adjusted to{" "}
            {dailySummary.adjusted_calorie_target}.
          </p>
        </div>
      )}

      {/* Calorie Ring */}
      <div className="flex justify-center">
        <CalorieRing
          consumed={dailySummary?.total_calories ?? 0}
          target={calorieTarget}
        />
      </div>

      {/* Macro Bars */}
      <div className="space-y-4">
        <MacroBar
          label="Protein"
          current={dailySummary?.total_protein_g ?? 0}
          target={profile?.protein_target_g ?? 150}
          color="#7E57C2"
        />
        <MacroBar
          label="Carbs"
          current={dailySummary?.total_carbs_g ?? 0}
          target={profile?.carbs_target_g ?? 250}
          color="#FFB74D"
        />
        <MacroBar
          label="Fat"
          current={dailySummary?.total_fat_g ?? 0}
          target={profile?.fat_target_g ?? 65}
          color="#4FC3F7"
        />
      </div>

      {/* Water Tracker */}
      <WaterTracker
        currentMl={dailySummary?.water_ml ?? 0}
        goalMl={profile?.water_goal_ml ?? 2500}
        onAdd={handleAddWater}
      />

      {/* Today's Meals */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-[#2D2A26]">
          Today&apos;s Meals
        </h2>
        {dailySummary?.meals && dailySummary.meals.length > 0 ? (
          dailySummary.meals.map((meal) => (
            <MealCard key={meal.id} meal={meal} onRate={handleRate} />
          ))
        ) : (
          <div className="bg-white border border-[#E8E3DC] rounded-xl shadow-sm p-6 text-center">
            <p className="text-[#7A756E]">Ready to log your first meal?</p>
            <Link
              href="/log"
              className="inline-block mt-3 text-sm font-medium text-[#4CAF50] hover:underline"
            >
              Start logging
            </Link>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <Link
        href="/log"
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#4CAF50] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#81C784] transition-colors z-50"
        aria-label="Log food"
      >
        <svg
          className="w-7 h-7"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </Link>
    </div>
  );
}
