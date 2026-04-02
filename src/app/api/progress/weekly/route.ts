import { NextResponse } from 'next/server';
import { getUserFromRequest, createServerSupabase } from '@/lib/supabase-server';
import type { WeeklyProgress } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    if (!start) {
      return NextResponse.json({ error: 'start query param required (YYYY-MM-DD)' }, { status: 400 });
    }

    const startDate = new Date(start);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    const endStr = endDate.toISOString().split('T')[0];

    const dayStart = `${start}T00:00:00Z`;
    const dayEnd = `${endStr}T23:59:59Z`;

    const supabase = createServerSupabase();

    const [logsRes, profileRes] = await Promise.all([
      supabase
        .from('food_logs')
        .select('total_calories, total_protein_g, total_carbs_g, total_fat_g, logged_at')
        .eq('user_id', user.id)
        .gte('logged_at', dayStart)
        .lte('logged_at', dayEnd)
        .order('logged_at', { ascending: true }),
      supabase
        .from('profiles')
        .select('daily_calorie_target')
        .eq('id', user.id)
        .single(),
    ]);

    const logs = logsRes.data ?? [];
    const target = profileRes.data?.daily_calorie_target ?? 1200;

    // Group logs by date
    const dailyMap: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {};
    for (const log of logs) {
      const date = new Date(log.logged_at).toISOString().split('T')[0];
      if (!dailyMap[date]) {
        dailyMap[date] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }
      dailyMap[date].calories += log.total_calories ?? 0;
      dailyMap[date].protein += log.total_protein_g ?? 0;
      dailyMap[date].carbs += log.total_carbs_g ?? 0;
      dailyMap[date].fat += log.total_fat_g ?? 0;
    }

    // Build 7-day array
    const days: WeeklyProgress['days'] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const day = dailyMap[dateStr];
      const calories = day?.calories ?? 0;
      const onTarget = calories > 0 && Math.abs(calories - target) / target <= 0.1;
      days.push({ date: dateStr, calories, target, on_target: onTarget });
    }

    // Averages (only days with data)
    const daysWithData = Object.values(dailyMap);
    const count = daysWithData.length || 1;
    const avg_protein = Math.round(daysWithData.reduce((s, d) => s + d.protein, 0) / count);
    const avg_carbs = Math.round(daysWithData.reduce((s, d) => s + d.carbs, 0) / count);
    const avg_fat = Math.round(daysWithData.reduce((s, d) => s + d.fat, 0) / count);

    // Streak: consecutive on-target days from most recent
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].on_target) {
        streak++;
      } else if (days[i].calories > 0) {
        break;
      }
    }

    const result: WeeklyProgress = {
      days,
      avg_protein,
      avg_carbs,
      avg_fat,
      streak,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('progress/weekly error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
