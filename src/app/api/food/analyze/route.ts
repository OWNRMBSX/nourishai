import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase-server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { image } = await request.json();
    if (!image) {
      return NextResponse.json({ error: 'image (base64) is required' }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are a nutrition analysis AI. Analyze this food photo and identify every food item visible.

Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
{
  "meal_name": "Brief descriptive name for the meal",
  "items": [
    {
      "name": "Food item name",
      "portion": "Estimated portion size (e.g., '1 cup', '150g', '1 medium')",
      "calories": 250,
      "protein_g": 20,
      "carbs_g": 30,
      "fat_g": 8,
      "confidence": 0.85
    }
  ]
}

Be accurate with nutritional estimates. Handle mixed plates by listing each component separately. Include drinks, sauces, and condiments. Confidence should reflect how certain you are (0.0 to 1.0).`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: image,
        },
      },
    ]);

    const text = result.response.text();
    // Strip markdown code blocks if present
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('food/analyze error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
