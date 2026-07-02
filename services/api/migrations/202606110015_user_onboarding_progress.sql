-- Store partial onboarding recovery state for signed-in users before a
-- complete student profile is available.

alter table public.users
  add column if not exists onboarding_progress jsonb not null default '{}'::jsonb;

alter table public.users
  drop constraint if exists users_onboarding_progress_object_check;

alter table public.users
  add constraint users_onboarding_progress_object_check
  check (jsonb_typeof(onboarding_progress) = 'object');
