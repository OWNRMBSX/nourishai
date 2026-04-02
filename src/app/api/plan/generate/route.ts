import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface PlanRequestBody {
  name?: string;
  age: number;
  sex: 'female' | 'male';
  height_cm: number;
  weight_kg: number;
  goal_weight_kg: number;
  activity_level: string;
  exercise_types: string[];
  exercise_frequency: number;
  primary_goal: string;
  timeline: string;
  dietary_restrictions: string[];
  health_notes?: string;
  resting_heart_rate?: number;
  avg_sleep_hours?: number;
  stress_level?: string;
  oura_screenshot?: string;
}

function buildPrompt(body: PlanRequestBody): string {
  const hasBiometrics =
    body.resting_heart_rate || body.avg_sleep_hours || body.stress_level;

  const biometricSection = hasBiometrics
    ? `
Biometric Data:
- Resting heart rate: ${body.resting_heart_rate ?? 'not provided'} bpm
- Average sleep: ${body.avg_sleep_hours ?? 'not provided'} hours/night
- Stress level: ${body.stress_level ?? 'not provided'}
`
    : '';

  return `You are an expert sports nutritionist and fitness coach. Generate a comprehensive, personalized nutrition and fitness plan based on the following profile.

Client Profile:
- Name: ${body.name || 'Client'}
- Age: ${body.age} years old
- Sex: ${body.sex}
- Height: ${body.height_cm} cm
- Current Weight: ${body.weight_kg} kg
- Goal Weight: ${body.goal_weight_kg} kg
- Activity Level: ${body.activity_level}
- Exercise Types: ${body.exercise_types.join(', ') || 'none specified'}
- Exercise Frequency: ${body.exercise_frequency} days/week
- Primary Goal: ${body.primary_goal}
- Timeline: ${body.timeline}
- Dietary Restrictions: ${body.dietary_restrictions.join(', ') || 'none'}
- Health Notes: ${body.health_notes || 'none'}
${biometricSection}

Calculate BMR using Mifflin-St Jeor, then TDEE based on activity level. Adjust calories based on the primary goal:
- lose fat: 300-500 calorie deficit
- build muscle: 200-300 calorie surplus
- maintain: TDEE maintenance
- recomposition: slight deficit with high protein

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "daily_calories": <number>,
  "protein_g": <number>,
  "carbs_g": <number>,
  "fat_g": <number>,
  "bmr": <number>,
  "tdee": <number>,
  "explanation": "<string explaining why these targets were chosen>",
  "weekly_schedule": [
    { "day": "Monday", "meals": ["Meal 1 description", "Meal 2 description", "Meal 3 description"] },
    { "day": "Tuesday", "meals": ["...", "...", "..."] },
    { "day": "Wednesday", "meals": ["...", "...", "..."] },
    { "day": "Thursday", "meals": ["...", "...", "..."] },
    { "day": "Friday", "meals": ["...", "...", "..."] },
    { "day": "Saturday", "meals": ["...", "...", "..."] },
    { "day": "Sunday", "meals": ["...", "...", "..."] }
  ],
  "tips": ["<tip 1>", "<tip 2>", "<tip 3>", "<tip 4>", "<tip 5>"],
  "recovery_notes": "${hasBiometrics ? '<personalized recovery and sleep recommendations based on biometric data>' : ''}",
  "sample_day": [
    { "meal": "Breakfast", "description": "<specific meal with portions>", "calories": <number> },
    { "meal": "Lunch", "description": "<specific meal with portions>", "calories": <number> },
    { "meal": "Dinner", "description": "<specific meal with portions>", "calories": <number> },
    { "meal": "Snack", "description": "<specific snack with portions>", "calories": <number> }
  ]
}

Make the plan practical, culturally diverse in food options, and appropriate for the dietary restrictions specified. Protein target should be 1.6-2.2g per kg for muscle building, 1.2-1.6g per kg otherwise. Tips should be highly personalized and actionable.`;
}

async function tryGemini(prompt: string, ouraScreenshot?: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const parts: (string | { inlineData: { mimeType: string; data: string } })[] = [prompt];
  if (ouraScreenshot) {
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: ouraScreenshot } });
  }

  const result = await model.generateContent(parts);
  return result.response.text();
}

async function tryOpenAI(prompt: string): Promise<string> {
  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are an expert sports nutritionist. Return only valid JSON.' },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 4000,
  });

  return response.choices[0]?.message?.content || '';
}

export async function POST(request: Request) {
  try {
    const body: PlanRequestBody = await request.json();

    if (!body.age || !body.sex || !body.height_cm || !body.weight_kg) {
      return NextResponse.json(
        { error: 'age, sex, height_cm, and weight_kg are required' },
        { status: 400 }
      );
    }

    const prompt = buildPrompt(body);
    let text: string;

    // Try Gemini first (free), fall back to OpenAI
    try {
      text = await tryGemini(prompt, body.oura_screenshot);
    } catch (geminiError) {
      console.warn('Gemini failed, trying OpenAI fallback:', geminiError instanceof Error ? geminiError.message : geminiError);
      if (!process.env.OPENAI_API_KEY) {
        throw geminiError; // No fallback available
      }
      text = await tryOpenAI(prompt);
    }

    const cleaned = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('plan/generate error:', error);
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('429') || message.includes('quota')) {
      return NextResponse.json(
        { error: 'AI is temporarily busy due to high demand. Please try again in a minute.' },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to generate plan. Please try again.' },
      { status: 500 }
    );
  }
}
