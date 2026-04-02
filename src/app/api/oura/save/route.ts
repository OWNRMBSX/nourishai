import { NextResponse } from 'next/server';
import { getUserFromRequest, createServerSupabase } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const today = new Date().toISOString().split('T')[0];

    const supabase = createServerSupabase();

    const { data, error } = await supabase
      .from('oura_daily')
      .upsert(
        {
          user_id: user.id,
          date: today,
          active_calories: body.active_calories ?? 0,
          total_calories_burned: body.total_calories_burned ?? 0,
          sleep_score: body.sleep_score ?? 0,
          sleep_duration_hours: body.sleep_duration_hours ?? 0,
          readiness_score: body.readiness_score ?? 0,
          resting_heart_rate: body.resting_heart_rate ?? 0,
          hrv: body.hrv ?? 0,
        },
        { onConflict: 'user_id,date' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('oura/save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
