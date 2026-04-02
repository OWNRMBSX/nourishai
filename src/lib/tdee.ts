const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calculateTDEE(
  weight_kg: number,
  height_cm: number,
  age: number,
  sex: 'female' | 'male',
  activity_level: string
): { bmr: number; tdee: number; deficit: number } {
  const bmr =
    sex === 'male'
      ? 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
      : 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;

  const multiplier = ACTIVITY_MULTIPLIERS[activity_level] ?? 1.2;
  const tdee = Math.round(bmr * multiplier);

  return {
    bmr: Math.round(bmr),
    tdee,
    deficit: tdee - 500,
  };
}
