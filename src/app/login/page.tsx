"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase-browser";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup" && password !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }

      if (mode === "signin") {
        const { error: authError } = await getSupabase().auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;
        router.push("/");
      } else {
        const { error: authError } = await getSupabase().auth.signUp({
          email,
          password,
        });
        if (authError) throw authError;
        router.push("/onboarding");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        {/* Brand */}
        <h1 className="text-2xl font-bold text-[#4CAF50] text-center">NourishAI</h1>
        <p className="text-[#7A756E] text-center mt-1 mb-6">Three taps to log a meal.</p>

        {/* Tabs */}
        <div className="flex justify-center gap-8 mb-6">
          <button
            onClick={() => { setMode("signin"); setError(""); }}
            className={`pb-1 font-semibold transition-colors ${
              mode === "signin"
                ? "text-[#4CAF50] border-b-2 border-[#4CAF50]"
                : "text-[#7A756E]"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode("signup"); setError(""); }}
            className={`pb-1 font-semibold transition-colors ${
              mode === "signup"
                ? "text-[#4CAF50] border-b-2 border-[#4CAF50]"
                : "text-[#7A756E]"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-[#E8E3DC] focus:border-[#4CAF50] focus:outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-[#E8E3DC] focus:border-[#4CAF50] focus:outline-none"
          />
          {mode === "signup" && (
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-[#E8E3DC] focus:border-[#4CAF50] focus:outline-none"
            />
          )}

          {error && <p className="text-[#E57373] text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-[#4CAF50] text-white w-full rounded-lg py-3 font-semibold hover:bg-[#43A047] transition-colors disabled:opacity-50"
          >
            {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Sign Up"}
          </button>
        </form>

        {/* Toggle link */}
        <p className="text-center text-sm text-[#7A756E] mt-6">
          {mode === "signin" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                onClick={() => { setMode("signup"); setError(""); }}
                className="text-[#4CAF50] font-semibold hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => { setMode("signin"); setError(""); }}
                className="text-[#4CAF50] font-semibold hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
