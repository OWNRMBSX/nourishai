import { NextResponse } from 'next/server';
import { getUserFromRequest, createServerSupabase } from '@/lib/supabase-server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { user_rating } = await request.json();

    if (!['up', 'down', null].includes(user_rating)) {
      return NextResponse.json(
        { error: 'user_rating must be "up", "down", or null' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabase();

    const { data, error } = await supabase
      .from('food_logs')
      .update({ user_rating })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('food/[id]/rate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
