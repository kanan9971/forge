-- Forge: minimal schema + RLS policies matching the current Next.js pages.
-- Paste this into Supabase SQL Editor (or split into migrations).

-- Enable uuid generation helpers
create extension if not exists "pgcrypto";

-- TODOS
create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  priority text not null default 'medium',
  category text not null default 'general',
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.todos enable row level security;

drop policy if exists "todos_select_own" on public.todos;
create policy "todos_select_own" on public.todos
  for select using (user_id = auth.uid());

drop policy if exists "todos_insert_own" on public.todos;
create policy "todos_insert_own" on public.todos
  for insert with check (user_id = auth.uid());

drop policy if exists "todos_update_own" on public.todos;
create policy "todos_update_own" on public.todos
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "todos_delete_own" on public.todos;
create policy "todos_delete_own" on public.todos
  for delete using (user_id = auth.uid());

-- WORKOUTS
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  duration integer not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.workouts enable row level security;

drop policy if exists "workouts_select_own" on public.workouts;
create policy "workouts_select_own" on public.workouts
  for select using (user_id = auth.uid());

drop policy if exists "workouts_insert_own" on public.workouts;
create policy "workouts_insert_own" on public.workouts
  for insert with check (user_id = auth.uid());

drop policy if exists "workouts_update_own" on public.workouts;
create policy "workouts_update_own" on public.workouts
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "workouts_delete_own" on public.workouts;
create policy "workouts_delete_own" on public.workouts
  for delete using (user_id = auth.uid());

-- WORKOUT EXERCISES
create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_id uuid not null references public.workouts(id) on delete cascade,
  name text not null,
  sets integer,
  reps integer,
  weight numeric,
  created_at timestamptz not null default now()
);

create index if not exists workout_exercises_workout_id_idx on public.workout_exercises(workout_id);
create index if not exists workout_exercises_user_id_idx on public.workout_exercises(user_id);

alter table public.workout_exercises enable row level security;

drop policy if exists "workout_exercises_select_own" on public.workout_exercises;
create policy "workout_exercises_select_own" on public.workout_exercises
  for select using (user_id = auth.uid());

drop policy if exists "workout_exercises_insert_own" on public.workout_exercises;
create policy "workout_exercises_insert_own" on public.workout_exercises
  for insert with check (user_id = auth.uid());

drop policy if exists "workout_exercises_update_own" on public.workout_exercises;
create policy "workout_exercises_update_own" on public.workout_exercises
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "workout_exercises_delete_own" on public.workout_exercises;
create policy "workout_exercises_delete_own" on public.workout_exercises
  for delete using (user_id = auth.uid());

-- HABITS
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text not null default '✅',
  frequency text not null default 'daily',
  created_at timestamptz not null default now()
);

alter table public.habits enable row level security;

drop policy if exists "habits_select_own" on public.habits;
create policy "habits_select_own" on public.habits
  for select using (user_id = auth.uid());

drop policy if exists "habits_insert_own" on public.habits;
create policy "habits_insert_own" on public.habits
  for insert with check (user_id = auth.uid());

drop policy if exists "habits_update_own" on public.habits;
create policy "habits_update_own" on public.habits
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "habits_delete_own" on public.habits;
create policy "habits_delete_own" on public.habits
  for delete using (user_id = auth.uid());

-- HABIT LOGS
create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  date date not null,
  completed boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, habit_id, date)
);

create index if not exists habit_logs_user_id_date_idx on public.habit_logs(user_id, date);

alter table public.habit_logs enable row level security;

drop policy if exists "habit_logs_select_own" on public.habit_logs;
create policy "habit_logs_select_own" on public.habit_logs
  for select using (user_id = auth.uid());

drop policy if exists "habit_logs_insert_own" on public.habit_logs;
create policy "habit_logs_insert_own" on public.habit_logs
  for insert with check (user_id = auth.uid());

drop policy if exists "habit_logs_update_own" on public.habit_logs;
create policy "habit_logs_update_own" on public.habit_logs
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "habit_logs_delete_own" on public.habit_logs;
create policy "habit_logs_delete_own" on public.habit_logs
  for delete using (user_id = auth.uid());

-- COURSES
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  progress integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.courses enable row level security;

drop policy if exists "courses_select_own" on public.courses;
create policy "courses_select_own" on public.courses
  for select using (user_id = auth.uid());

drop policy if exists "courses_insert_own" on public.courses;
create policy "courses_insert_own" on public.courses
  for insert with check (user_id = auth.uid());

drop policy if exists "courses_update_own" on public.courses;
create policy "courses_update_own" on public.courses
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "courses_delete_own" on public.courses;
create policy "courses_delete_own" on public.courses
  for delete using (user_id = auth.uid());

