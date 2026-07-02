-- Persist daily practice completion rows for authenticated students.

create table if not exists public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  skill_id text not null,
  task_id text not null,
  estimated_minutes integer not null default 0,
  completed_on date not null default current_date,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint practice_sessions_skill_id_not_blank check (btrim(skill_id) <> ''),
  constraint practice_sessions_task_id_not_blank check (btrim(task_id) <> ''),
  constraint practice_sessions_estimated_minutes_check check (estimated_minutes >= 0 and estimated_minutes <= 120)
);

create unique index if not exists practice_sessions_student_task_day_idx
  on public.practice_sessions (student_profile_id, skill_id, task_id, completed_on);

create index if not exists practice_sessions_student_completed_idx
  on public.practice_sessions (student_profile_id, completed_on desc, completed_at desc);

drop trigger if exists practice_sessions_set_updated_at on public.practice_sessions;
create trigger practice_sessions_set_updated_at before update on public.practice_sessions
for each row execute function public.set_updated_at();

alter table public.practice_sessions enable row level security;
alter table public.practice_sessions force row level security;

drop policy if exists practice_sessions_select_visible on public.practice_sessions;
create policy practice_sessions_select_visible on public.practice_sessions
for select to authenticated
using (public.can_read_student(student_profile_id));

drop policy if exists practice_sessions_owner_manage on public.practice_sessions;
create policy practice_sessions_owner_manage on public.practice_sessions
for all to authenticated
using (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin())
with check (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin());
