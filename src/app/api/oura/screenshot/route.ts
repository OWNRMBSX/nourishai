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

    const prompt = `You are an expert at reading Oura Ring app screenshots. Extract all available metrics from this screenshot.

Return ONLY valid JSON with this exact structure (no markdown, no code blocks). Use 0 for any metric not visible:
{
  "active_calories": 0,
  "total_calories_burned": 0,
  "sleep_score": 0,
  "sleep_duration_hours": 0.0,
  "readiness_score": 0,
  "resting_heart_rate": 0,
  "hrv": 0
}

Parse numbers carefully. Sleep duration should be in decimal hours (e.g., 7h 30m = 7.5).`;

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
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error('oura/screenshot error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
