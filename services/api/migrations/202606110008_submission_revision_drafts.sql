-- Persist in-progress feedback revision drafts for authenticated students.

create table if not exists public.submission_revision_drafts (
  submission_id uuid primary key references public.submissions(id) on delete cascade,
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  revised_text text not null default '',
  client_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint submission_revision_drafts_text_length_check check (char_length(revised_text) <= 2400)
);

create index if not exists submission_revision_drafts_student_updated_idx
  on public.submission_revision_drafts (student_profile_id, updated_at desc);

drop trigger if exists submission_revision_drafts_set_updated_at on public.submission_revision_drafts;
create trigger submission_revision_drafts_set_updated_at before update on public.submission_revision_drafts
for each row execute function public.set_updated_at();

alter table public.submission_revision_drafts enable row level security;
alter table public.submission_revision_drafts force row level security;

drop policy if exists submission_revision_drafts_owner_manage on public.submission_revision_drafts;
create policy submission_revision_drafts_owner_manage on public.submission_revision_drafts
for all to authenticated
using (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin())
with check (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin());
