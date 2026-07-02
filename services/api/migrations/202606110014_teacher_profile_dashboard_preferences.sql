-- Store teacher dashboard UI preferences with the teacher-owned profile so
-- signed-in teacher screens are not limited to device-local preference state.

alter table public.teacher_profiles
  add column if not exists dashboard_preferences jsonb not null default '{}'::jsonb;

alter table public.teacher_profiles
  drop constraint if exists teacher_profiles_dashboard_preferences_object_check;

alter table public.teacher_profiles
  add constraint teacher_profiles_dashboard_preferences_object_check
  check (jsonb_typeof(dashboard_preferences) = 'object');
