-- NourishAI Supabase Schema
-- Run this in the Supabase SQL Editor to set up the database

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  name text,
  age integer,
  sex text check (sex in ('female', 'male')),
  height_cm numeric,
  current_weight_kg numeric,
  goal_weight_kg numeric,
  daily_calorie_target integer default 1200,
  protein_target_g integer default 130,
  carbs_target_g integer default 130,
  fat_target_g integer default 45,
  activity_level text check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  dietary_restrictions text[] default '{}',
  water_goal_ml integer default 3000,
  oura_connected boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- FOOD LOGS
-- ============================================================
create table if not exists public.food_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users on delete cascade,
  photo_url text,
  items jsonb not null default '[]',
  total_calories numeric not null default 0,
  total_protein_g numeric not null default 0,
  total_carbs_g numeric not null default 0,
  total_fat_g numeric not null default 0,
  meal_name text,
  logged_at timestamptz default now(),
  source text check (source in ('photo', 'manual', 'barcode')) default 'manual',
  user_rating text check (user_rating in ('up', 'down') or user_rating is null)
);

create index if not exists idx_food_logs_user_date on public.food_logs (user_id, logged_at);

-- ============================================================
-- WATER LOGS
-- ============================================================
create table if not exists public.water_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users on delete cascade,
  amount_ml integer not null,
  logged_at timestamptz default now()
);

create index if not exists idx_water_logs_user_date on public.water_logs (user_id, logged_at);

-- ============================================================
-- OURA DAILY
-- ============================================================
create table if not exists public.oura_daily (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users on delete cascade,
  date date not null,
  active_calories numeric default 0,
  total_calories_burned numeric default 0,
  sleep_score integer default 0,
  sleep_duration_hours numeric default 0,
  readiness_score integer default 0,
  resting_heart_rate integer default 0,
  hrv integer default 0,
  unique (user_id, date)
);

create index if not exists idx_oura_daily_user_date on public.oura_daily (user_id, date);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.food_logs enable row level security;
alter table public.water_logs enable row level security;
alter table public.oura_daily enable row level security;

-- Profiles: users can only access their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Food logs: users can only CRUD their own logs
create policy "Users can view own food logs"
  on public.food_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own food logs"
  on public.food_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own food logs"
  on public.food_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete own food logs"
  on public.food_logs for delete
  using (auth.uid() = user_id);

-- Water logs: users can only CRUD their own logs
create policy "Users can view own water logs"
  on public.water_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own water logs"
  on public.water_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own water logs"
  on public.water_logs for delete
  using (auth.uid() = user_id);

-- Oura daily: users can only CRUD their own data
create policy "Users can view own oura data"
  on public.oura_daily for select
  using (auth.uid() = user_id);

create policy "Users can insert own oura data"
  on public.oura_daily for insert
  with check (auth.uid() = user_id);

create policy "Users can update own oura data"
  on public.oura_daily for update
  using (auth.uid() = user_id);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
