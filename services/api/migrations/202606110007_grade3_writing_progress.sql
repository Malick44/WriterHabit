-- Persist Grade 3 Writing Adventure progress for authenticated students.

create table if not exists public.grade3_writing_progress (
  id uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  day smallint not null,
  draft text not null default '',
  stronger_sentence text not null default '',
  favorite_sentence text not null default '',
  checklist jsonb not null default '{}'::jsonb,
  planning jsonb not null default '{}'::jsonb,
  completed boolean not null default false,
  client_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grade3_writing_progress_day_check check (day between 1 and 30),
  constraint grade3_writing_progress_draft_length_check check (char_length(draft) <= 6000),
  constraint grade3_writing_progress_stronger_sentence_length_check check (char_length(stronger_sentence) <= 6000),
  constraint grade3_writing_progress_favorite_sentence_length_check check (char_length(favorite_sentence) <= 6000),
  constraint grade3_writing_progress_checklist_object_check check (jsonb_typeof(checklist) = 'object'),
  constraint grade3_writing_progress_planning_object_check check (jsonb_typeof(planning) = 'object')
);

create unique index if not exists grade3_writing_progress_student_day_idx
  on public.grade3_writing_progress (student_profile_id, day);

create index if not exists grade3_writing_progress_student_updated_idx
  on public.grade3_writing_progress (student_profile_id, updated_at desc);

drop trigger if exists grade3_writing_progress_set_updated_at on public.grade3_writing_progress;
create trigger grade3_writing_progress_set_updated_at before update on public.grade3_writing_progress
for each row execute function public.set_updated_at();

alter table public.grade3_writing_progress enable row level security;
alter table public.grade3_writing_progress force row level security;

drop policy if exists grade3_writing_progress_select_visible on public.grade3_writing_progress;
create policy grade3_writing_progress_select_visible on public.grade3_writing_progress
for select to authenticated
using (public.can_read_student(student_profile_id));

drop policy if exists grade3_writing_progress_owner_manage on public.grade3_writing_progress;
create policy grade3_writing_progress_owner_manage on public.grade3_writing_progress
for all to authenticated
using (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin())
with check (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin());
