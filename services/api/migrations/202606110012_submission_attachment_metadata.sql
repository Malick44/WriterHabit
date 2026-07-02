-- Store bounded metadata for upload/photo evidence attached at submission time.
-- Raw file bytes live in the private `submission-attachments` object-storage
-- bucket and are linked here by object path.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'submission-attachments',
  'submission-attachments',
  false,
  10000000,
  array['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'application/pdf']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists submission_attachments_storage_select_own on storage.objects;
create policy submission_attachments_storage_select_own on storage.objects
for select to authenticated
using (
  bucket_id = 'submission-attachments'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists submission_attachments_storage_insert_own on storage.objects;
create policy submission_attachments_storage_insert_own on storage.objects
for insert to authenticated
with check (
  bucket_id = 'submission-attachments'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists submission_attachments_storage_update_own on storage.objects;
create policy submission_attachments_storage_update_own on storage.objects
for update to authenticated
using (
  bucket_id = 'submission-attachments'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'submission-attachments'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create table if not exists public.submission_attachments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  client_attachment_id text not null,
  kind text not null,
  name text not null,
  mime_type text,
  size_bytes integer,
  storage_bucket text not null default 'submission-attachments',
  storage_object_path text,
  upload_status text not null default 'not_uploaded',
  uploaded_at timestamptz,
  extraction_status text not null default 'pending',
  extracted_text_excerpt text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint submission_attachments_client_id_not_blank check (btrim(client_attachment_id) <> ''),
  constraint submission_attachments_kind_check check (kind in ('image', 'file')),
  constraint submission_attachments_name_not_blank check (btrim(name) <> ''),
  constraint submission_attachments_name_length_check check (char_length(name) <= 240),
  constraint submission_attachments_mime_type_length_check check (mime_type is null or char_length(mime_type) <= 120),
  constraint submission_attachments_size_bytes_check check (size_bytes is null or size_bytes >= 0),
  constraint submission_attachments_storage_bucket_check check (storage_bucket = 'submission-attachments'),
  constraint submission_attachments_storage_object_path_length_check check (
    storage_object_path is null or char_length(storage_object_path) <= 512
  ),
  constraint submission_attachments_upload_status_check check (upload_status in ('not_uploaded', 'uploaded', 'failed')),
  constraint submission_attachments_extraction_status_check check (extraction_status in ('pending', 'extracting', 'done', 'error')),
  constraint submission_attachments_extracted_text_excerpt_length_check check (
    extracted_text_excerpt is null or char_length(extracted_text_excerpt) <= 1000
  )
);

alter table public.submission_attachments
  add column if not exists storage_bucket text not null default 'submission-attachments',
  add column if not exists storage_object_path text,
  add column if not exists upload_status text not null default 'not_uploaded',
  add column if not exists uploaded_at timestamptz;

alter table public.submission_attachments
  drop constraint if exists submission_attachments_storage_bucket_check,
  add constraint submission_attachments_storage_bucket_check check (storage_bucket = 'submission-attachments');

alter table public.submission_attachments
  drop constraint if exists submission_attachments_storage_object_path_length_check,
  add constraint submission_attachments_storage_object_path_length_check check (
    storage_object_path is null or char_length(storage_object_path) <= 512
  );

alter table public.submission_attachments
  drop constraint if exists submission_attachments_upload_status_check,
  add constraint submission_attachments_upload_status_check check (upload_status in ('not_uploaded', 'uploaded', 'failed'));

create unique index if not exists submission_attachments_submission_client_idx
  on public.submission_attachments (submission_id, client_attachment_id);

create index if not exists submission_attachments_student_submission_idx
  on public.submission_attachments (student_profile_id, submission_id);

drop trigger if exists submission_attachments_set_updated_at on public.submission_attachments;
create trigger submission_attachments_set_updated_at before update on public.submission_attachments
for each row execute function public.set_updated_at();

alter table public.submission_attachments enable row level security;
alter table public.submission_attachments force row level security;

drop policy if exists submission_attachments_select_visible on public.submission_attachments;
create policy submission_attachments_select_visible on public.submission_attachments
for select to authenticated
using (public.can_read_student(student_profile_id));

drop policy if exists submission_attachments_owner_manage on public.submission_attachments;
create policy submission_attachments_owner_manage on public.submission_attachments
for all to authenticated
using (
  public.is_student_owner(student_profile_id)
  and exists (
    select 1
    from public.submissions s
    where s.id = submission_id
      and s.student_profile_id = student_profile_id
  )
)
with check (
  public.is_student_owner(student_profile_id)
  and exists (
    select 1
    from public.submissions s
    where s.id = submission_id
      and s.student_profile_id = student_profile_id
  )
);
