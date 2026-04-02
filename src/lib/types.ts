export interface UserProfile {
  id: string;
  email: string;
  name: string;
  age: number;
  sex: 'female' | 'male';
  height_cm: number;
  current_weight_kg: number;
  goal_weight_kg: number;
  daily_calorie_target: number;
  protein_target_g: number;
  carbs_target_g: number;
  fat_target_g: number;
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  dietary_restrictions: string[];
  water_goal_ml: number;
  oura_connected: boolean;
  created_at: string;
}

export interface FoodItem {
  name: string;
  portion: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence: number;
}

export interface FoodLog {
  id: string;
  user_id: string;
  photo_url: string | null;
  items: FoodItem[];
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  meal_name: string;
  logged_at: string;
  source: 'photo' | 'manual' | 'barcode';
  user_rating: 'up' | 'down' | null;
}

export interface DailySummary {
  date: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  water_ml: number;
  active_calories_burned: number;
  adjusted_calorie_target: number;
  meals: FoodLog[];
}

export interface OuraData {
  active_calories: number;
  total_calories_burned: number;
  sleep_score: number;
  sleep_duration_hours: number;
  readiness_score: number;
  resting_heart_rate: number;
  hrv: number;
}

export interface WeeklyProgress {
  days: { date: string; calories: number; target: number; on_target: boolean }[];
  avg_protein: number;
  avg_carbs: number;
  avg_fat: number;
  streak: number;
}
