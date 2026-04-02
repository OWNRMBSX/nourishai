import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase-server';
import type { FoodItem } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    if (!query) {
      return NextResponse.json({ error: 'q query param required' }, { status: 400 });
    }

    const apiKey = process.env.USDA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'USDA API key not configured' }, { status: 500 });
    }

    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(query)}&pageSize=10`;
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: 'USDA API error' }, { status: 502 });
    }

    const data = await res.json();

    const items: FoodItem[] = (data.foods ?? []).map((food: any) => {
      const nutrients = food.foodNutrients ?? [];
      const get = (id: number) =>
        nutrients.find((n: any) => n.nutrientId === id)?.value ?? 0;

      return {
        name: food.description ?? 'Unknown',
        portion: food.servingSize
          ? `${food.servingSize}${food.servingSizeUnit ?? 'g'}`
          : '100g',
        calories: Math.round(get(1008)),
        protein_g: Math.round(get(1003) * 10) / 10,
        carbs_g: Math.round(get(1005) * 10) / 10,
        fat_g: Math.round(get(1004) * 10) / 10,
        confidence: 1.0,
      };
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('food/search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
