import { NextResponse } from 'next/server';
import { getUserFromRequest, createServerSupabase } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount_ml } = await request.json();
    if (typeof amount_ml !== 'number' || amount_ml <= 0) {
      return NextResponse.json({ error: 'amount_ml must be a positive number' }, { status: 400 });
    }

    const supabase = createServerSupabase();

    const { error: insertError } = await supabase
      .from('water_logs')
      .insert({ user_id: user.id, amount_ml });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    const dayStart = `${today}T00:00:00Z`;
    const dayEnd = `${today}T23:59:59Z`;

    const { data: entries } = await supabase
      .from('water_logs')
      .select('amount_ml')
      .eq('user_id', user.id)
      .gte('logged_at', dayStart)
      .lte('logged_at', dayEnd);

    const total_ml = (entries ?? []).reduce((s, w) => s + (w.amount_ml ?? 0), 0);

    return NextResponse.json({ total_ml });
  } catch (error) {
    console.error('water error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
