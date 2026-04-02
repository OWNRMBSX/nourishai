"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase-browser";
import type { UserProfile } from "@/lib/types";
import { calculateTDEE } from "@/lib/tdee";

const ACTIVITY_LEVELS: { value: UserProfile["activity_level"]; label: string }[] = [
  { value: "sedentary", label: "Sedentary" },
  { value: "light", label: "Light" },
  { value: "moderate", label: "Moderate" },
  { value: "active", label: "Active" },
  { value: "very_active", label: "Very Active" },
];

const RESTRICTION_OPTIONS = [
  "vegetarian",
  "vegan",
  "gluten-free",
  "dairy-free",
  "nut-free",
];

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tdeeResult, setTdeeResult] = useState<{
    bmr: number;
    tdee: number;
    deficit: number;
  } | null>(null);

  const fetchProfile = useCallback(async () => {
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
      const res = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error("Failed to load profile");
      const data: UserProfile = await res.json();
      setProfile(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const startEditing = () => {
    if (profile) {
      setEditData({ ...profile });
      setEditing(true);
    }
  };

  const cancelEditing = () => {
    setEditData({});
    setEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const supabase = getSupabase();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(editData),
      });
      if (!res.ok) throw new Error("Failed to save profile");
      const updated: UserProfile = await res.json();
      setProfile(updated);
      setEditing(false);
      setEditData({});
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleCalculateTDEE = () => {
    const src = editing ? editData : profile;
    if (!src) return;
    const result = calculateTDEE(
      src.current_weight_kg ?? 70,
      src.height_cm ?? 170,
      src.age ?? 30,
      src.sex ?? "male",
      src.activity_level ?? "moderate"
    );
    setTdeeResult(result);
  };

  const applyDeficit = () => {
    if (tdeeResult) {
      setEditData((prev) => ({
        ...prev,
        daily_calorie_target: tdeeResult.deficit,
      }));
      if (!editing) startEditing();
    }
  };

  const updateEditField = (field: keyof UserProfile, value: unknown) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleRestriction = (restriction: string) => {
    const current = (editData.dietary_restrictions as string[]) ?? [];
    const updated = current.includes(restriction)
      ? current.filter((r) => r !== restriction)
      : [...current, restriction];
    updateEditField("dietary_restrictions", updated);
  };

  const handleSignOut = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-[#4CAF50] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>
    );
  }

  const displayData = editing ? editData : profile;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#2D2A26]">
          Profile &amp; Settings
        </h1>
        {!editing ? (
          <button
            type="button"
            onClick={startEditing}
            className="text-sm font-medium text-[#4CAF50] hover:text-[#81C784] transition-colors"
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={cancelEditing}
              className="text-sm font-medium text-[#7A756E] hover:text-[#2D2A26] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="text-sm font-medium bg-[#4CAF50] text-white px-4 py-1.5 rounded-lg hover:bg-[#81C784] transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Personal Info */}
      <div className="bg-white border border-[#E8E3DC] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-[#7A756E] uppercase tracking-wide mb-4">
          Personal Info
        </h2>
        <div className="space-y-3">
          {editing ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-[#7A756E]">Name</span>
                  <input
                    type="text"
                    value={editData.name ?? ""}
                    onChange={(e) => updateEditField("name", e.target.value)}
                    className="mt-1 w-full border border-[#E8E3DC] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-[#4CAF50]"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-[#7A756E]">Email</span>
                  <input
                    type="email"
                    value={editData.email ?? ""}
                    onChange={(e) => updateEditField("email", e.target.value)}
                    className="mt-1 w-full border border-[#E8E3DC] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-[#4CAF50]"
                  />
                </label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <label className="block">
                  <span className="text-xs text-[#7A756E]">Age</span>
                  <input
                    type="number"
                    value={editData.age ?? ""}
                    onChange={(e) =>
                      updateEditField("age", Number(e.target.value))
                    }
                    className="mt-1 w-full border border-[#E8E3DC] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-[#4CAF50]"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-[#7A756E]">Sex</span>
                  <select
                    value={editData.sex ?? ""}
                    onChange={(e) =>
                      updateEditField(
                        "sex",
                        e.target.value as "female" | "male"
                      )
                    }
                    className="mt-1 w-full border border-[#E8E3DC] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-[#4CAF50]"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-[#7A756E]">Height (cm)</span>
                  <input
                    type="number"
                    value={editData.height_cm ?? ""}
                    onChange={(e) =>
                      updateEditField("height_cm", Number(e.target.value))
                    }
                    className="mt-1 w-full border border-[#E8E3DC] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-[#4CAF50]"
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-[#7A756E]">
                    Current Weight (kg)
                  </span>
                  <input
                    type="number"
                    value={editData.current_weight_kg ?? ""}
                    onChange={(e) =>
                      updateEditField(
                        "current_weight_kg",
                        Number(e.target.value)
                      )
                    }
                    className="mt-1 w-full border border-[#E8E3DC] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-[#4CAF50]"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-[#7A756E]">
                    Goal Weight (kg)
                  </span>
                  <input
                    type="number"
                    value={editData.goal_weight_kg ?? ""}
                    onChange={(e) =>
                      updateEditField(
                        "goal_weight_kg",
                        Number(e.target.value)
                      )
                    }
                    className="mt-1 w-full border border-[#E8E3DC] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-[#4CAF50]"
                  />
                </label>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-[#7A756E]">Name</span>
                <span className="text-[#2D2A26] font-medium">
                  {profile.name}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#7A756E]">Email</span>
                <span className="text-[#2D2A26] font-medium">
                  {profile.email}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#7A756E]">Age</span>
                <span className="text-[#2D2A26] font-medium">
                  {profile.age}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#7A756E]">Sex</span>
                <span className="text-[#2D2A26] font-medium capitalize">
                  {profile.sex}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#7A756E]">Height</span>
                <span className="text-[#2D2A26] font-medium">
                  {profile.height_cm} cm
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#7A756E]">Current Weight</span>
                <span className="text-[#2D2A26] font-medium">
                  {profile.current_weight_kg} kg
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#7A756E]">Goal Weight</span>
                <span className="text-[#2D2A26] font-medium">
                  {profile.goal_weight_kg} kg
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Daily Targets */}
      <div className="bg-white border border-[#E8E3DC] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-[#7A756E] uppercase tracking-wide mb-4">
          Daily Targets
        </h2>
        {editing ? (
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-[#7A756E]">Calories</span>
              <input
                type="number"
                value={editData.daily_calorie_target ?? ""}
                onChange={(e) =>
                  updateEditField(
                    "daily_calorie_target",
                    Number(e.target.value)
                  )
                }
                className="mt-1 w-full border border-[#E8E3DC] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-[#4CAF50]"
              />
            </label>
            <label className="block">
              <span className="text-xs text-[#7A756E]">Protein (g)</span>
              <input
                type="number"
                value={editData.protein_target_g ?? ""}
                onChange={(e) =>
                  updateEditField("protein_target_g", Number(e.target.value))
                }
                className="mt-1 w-full border border-[#E8E3DC] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-[#4CAF50]"
              />
            </label>
            <label className="block">
              <span className="text-xs text-[#7A756E]">Carbs (g)</span>
              <input
                type="number"
                value={editData.carbs_target_g ?? ""}
                onChange={(e) =>
                  updateEditField("carbs_target_g", Number(e.target.value))
                }
                className="mt-1 w-full border border-[#E8E3DC] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-[#4CAF50]"
              />
            </label>
            <label className="block">
              <span className="text-xs text-[#7A756E]">Fat (g)</span>
              <input
                type="number"
                value={editData.fat_target_g ?? ""}
                onChange={(e) =>
                  updateEditField("fat_target_g", Number(e.target.value))
                }
                className="mt-1 w-full border border-[#E8E3DC] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-[#4CAF50]"
              />
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#F5F2EE] rounded-lg p-3 text-center">
              <p className="text-xs text-[#7A756E]">Calories</p>
              <p className="text-lg font-bold text-[#2D2A26]">
                {profile.daily_calorie_target}
              </p>
            </div>
            <div className="bg-[#F5F2EE] rounded-lg p-3 text-center">
              <p className="text-xs text-[#7A756E]">Protein</p>
              <p className="text-lg font-bold text-[#2D2A26]">
                {profile.protein_target_g}g
              </p>
            </div>
            <div className="bg-[#F5F2EE] rounded-lg p-3 text-center">
              <p className="text-xs text-[#7A756E]">Carbs</p>
              <p className="text-lg font-bold text-[#2D2A26]">
                {profile.carbs_target_g}g
              </p>
            </div>
            <div className="bg-[#F5F2EE] rounded-lg p-3 text-center">
              <p className="text-xs text-[#7A756E]">Fat</p>
              <p className="text-lg font-bold text-[#2D2A26]">
                {profile.fat_target_g}g
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Activity Level */}
      <div className="bg-white border border-[#E8E3DC] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-[#7A756E] uppercase tracking-wide mb-4">
          Activity Level
        </h2>
        {editing ? (
          <div className="flex flex-wrap gap-2">
            {ACTIVITY_LEVELS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => updateEditField("activity_level", value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  editData.activity_level === value
                    ? "bg-[#4CAF50] text-white"
                    : "bg-[#F5F2EE] text-[#2D2A26] hover:bg-[#E8E3DC]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        ) : (
          <span className="inline-block bg-[#4CAF50]/15 text-[#4CAF50] text-sm font-medium px-3 py-1 rounded-full capitalize">
            {profile.activity_level.replace("_", " ")}
          </span>
        )}
      </div>

      {/* Dietary Restrictions */}
      <div className="bg-white border border-[#E8E3DC] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-[#7A756E] uppercase tracking-wide mb-4">
          Dietary Restrictions
        </h2>
        {editing ? (
          <div className="flex flex-wrap gap-2">
            {RESTRICTION_OPTIONS.map((restriction) => {
              const active = (
                (editData.dietary_restrictions as string[]) ?? []
              ).includes(restriction);
              return (
                <button
                  key={restriction}
                  type="button"
                  onClick={() => toggleRestriction(restriction)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    active
                      ? "bg-[#4CAF50] text-white"
                      : "bg-[#F5F2EE] text-[#2D2A26] hover:bg-[#E8E3DC]"
                  }`}
                >
                  {restriction}
                </button>
              );
            })}
          </div>
        ) : profile.dietary_restrictions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profile.dietary_restrictions.map((r) => (
              <span
                key={r}
                className="bg-[#F5F2EE] text-[#2D2A26] text-sm font-medium px-3 py-1 rounded-full"
              >
                {r}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#7A756E]">None set</p>
        )}
      </div>

      {/* Water Goal */}
      <div className="bg-white border border-[#E8E3DC] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-[#7A756E] uppercase tracking-wide mb-4">
          Water Goal
        </h2>
        {editing ? (
          <label className="block">
            <span className="text-xs text-[#7A756E]">Water Goal (ml)</span>
            <input
              type="number"
              value={editData.water_goal_ml ?? ""}
              onChange={(e) =>
                updateEditField("water_goal_ml", Number(e.target.value))
              }
              className="mt-1 w-full border border-[#E8E3DC] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-[#4CAF50]"
            />
          </label>
        ) : (
          <p className="text-lg font-bold text-[#2D2A26]">
            {Math.round(profile.water_goal_ml / 250)}{" "}
            <span className="text-sm font-normal text-[#7A756E]">glasses</span>
          </p>
        )}
      </div>

      {/* Oura Ring */}
      <div className="bg-white border border-[#E8E3DC] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-[#7A756E] uppercase tracking-wide mb-4">
          Oura Ring
        </h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                profile.oura_connected ? "bg-[#4CAF50]" : "bg-[#B5AFA7]"
              }`}
            />
            <span className="text-sm text-[#2D2A26]">
              {profile.oura_connected ? "Connected" : "Not connected"}
            </span>
          </div>
          <Link
            href="/oura"
            className="text-sm font-medium text-[#4CAF50] hover:text-[#81C784] transition-colors"
          >
            Upload Screenshot
          </Link>
        </div>
      </div>

      {/* TDEE Calculator */}
      <div className="bg-white border border-[#E8E3DC] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-[#7A756E] uppercase tracking-wide mb-4">
          TDEE Calculator
        </h2>
        <button
          type="button"
          onClick={handleCalculateTDEE}
          className="w-full bg-[#F5F2EE] text-[#2D2A26] font-medium rounded-lg py-2.5 hover:bg-[#E8E3DC] transition-colors text-sm"
        >
          Calculate TDEE
        </button>
        {tdeeResult && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#F5F2EE] rounded-lg p-3 text-center">
                <p className="text-xs text-[#7A756E]">BMR</p>
                <p className="text-lg font-bold text-[#2D2A26]">
                  {tdeeResult.bmr}
                </p>
              </div>
              <div className="bg-[#F5F2EE] rounded-lg p-3 text-center">
                <p className="text-xs text-[#7A756E]">TDEE</p>
                <p className="text-lg font-bold text-[#2D2A26]">
                  {tdeeResult.tdee}
                </p>
              </div>
              <div className="bg-[#F5F2EE] rounded-lg p-3 text-center">
                <p className="text-xs text-[#7A756E]">Deficit</p>
                <p className="text-lg font-bold text-[#4CAF50]">
                  {tdeeResult.deficit}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={applyDeficit}
              className="w-full bg-[#4CAF50] text-white font-medium rounded-lg py-2.5 hover:bg-[#81C784] transition-colors text-sm"
            >
              Apply Deficit as Calorie Target
            </button>
          </div>
        )}
      </div>

      {/* Sign Out */}
      <button
        type="button"
        onClick={handleSignOut}
        className="w-full border border-red-300 text-red-500 font-medium rounded-xl py-3 hover:bg-red-50 transition-colors text-sm"
      >
        Sign Out
      </button>
    </div>
  );
}
