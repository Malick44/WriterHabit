-- Persist student message threads for signed-in students.

create table if not exists public.student_messages (
  id uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  sender_kind text not null,
  sender_name text not null,
  sender_initials text not null default '',
  preview text not null,
  sent_at timestamptz not null default now(),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_messages_sender_kind_check check (sender_kind in ('teacher', 'coach')),
  constraint student_messages_sender_name_not_blank check (btrim(sender_name) <> ''),
  constraint student_messages_sender_initials_length_check check (char_length(sender_initials) <= 6),
  constraint student_messages_preview_not_blank check (btrim(preview) <> ''),
  constraint student_messages_preview_length_check check (char_length(preview) <= 500)
);

create index if not exists student_messages_student_sent_idx
  on public.student_messages (student_profile_id, sent_at desc);

drop trigger if exists student_messages_set_updated_at on public.student_messages;
create trigger student_messages_set_updated_at before update on public.student_messages
for each row execute function public.set_updated_at();

alter table public.student_messages enable row level security;
alter table public.student_messages force row level security;

drop policy if exists student_messages_select_visible on public.student_messages;
create policy student_messages_select_visible on public.student_messages
for select to authenticated
using (public.can_read_student(student_profile_id));

drop policy if exists student_messages_admin_manage on public.student_messages;
create policy student_messages_admin_manage on public.student_messages
for all to authenticated
using (public.is_WriterHabit_admin())
with check (public.is_WriterHabit_admin());
