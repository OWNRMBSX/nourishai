import { NextResponse } from 'next/server';
import { getUserFromRequest, createServerSupabase } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const supabase = createServerSupabase();

    const { data, error } = await supabase
      .from('food_logs')
      .insert({
        user_id: user.id,
        photo_url: body.photo_url ?? null,
        items: body.items,
        total_calories: body.total_calories,
        total_protein_g: body.total_protein_g,
        total_carbs_g: body.total_carbs_g,
        total_fat_g: body.total_fat_g,
        meal_name: body.meal_name,
        source: body.source ?? 'manual',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('food/log POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    if (!date) {
      return NextResponse.json({ error: 'date query param required (YYYY-MM-DD)' }, { status: 400 });
    }

    const dayStart = `${date}T00:00:00Z`;
    const dayEnd = `${date}T23:59:59Z`;

    const supabase = createServerSupabase();

    const [mealsRes, waterRes, ouraRes, profileRes] = await Promise.all([
      supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', dayStart)
        .lte('logged_at', dayEnd)
        .order('logged_at', { ascending: true }),
      supabase
        .from('water_logs')
        .select('amount_ml')
        .eq('user_id', user.id)
        .gte('logged_at', dayStart)
        .lte('logged_at', dayEnd),
      supabase
        .from('oura_daily')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
        .maybeSingle(),
      supabase
        .from('profiles')
        .select('daily_calorie_target')
        .eq('id', user.id)
        .single(),
    ]);

    const meals = mealsRes.data ?? [];
    const waterEntries = waterRes.data ?? [];
    const oura = ouraRes.data;
    const profile = profileRes.data;

    const total_calories = meals.reduce((s, m) => s + (m.total_calories ?? 0), 0);
    const total_protein_g = meals.reduce((s, m) => s + (m.total_protein_g ?? 0), 0);
    const total_carbs_g = meals.reduce((s, m) => s + (m.total_carbs_g ?? 0), 0);
    const total_fat_g = meals.reduce((s, m) => s + (m.total_fat_g ?? 0), 0);
    const water_ml = waterEntries.reduce((s, w) => s + (w.amount_ml ?? 0), 0);
    const active_calories_burned = oura?.active_calories ?? 0;
    const base_target = profile?.daily_calorie_target ?? 1200;
    const adjusted_calorie_target = base_target + active_calories_burned;

    const summary = {
      date,
      total_calories,
      total_protein_g,
      total_carbs_g,
      total_fat_g,
      water_ml,
      active_calories_burned,
      adjusted_calorie_target,
      meals,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('food/log GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
