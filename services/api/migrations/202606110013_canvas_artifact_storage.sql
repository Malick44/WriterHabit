-- Private object storage for editable canvas artifacts.
--
-- The authoritative editable stroke JSON is still persisted in
-- `canvas_document_contents`; this bucket stores the corresponding object
-- artifact under an auth-user-owned path for export/sync workflows.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'canvas-artifacts',
  'canvas-artifacts',
  false,
  10000000,
  array['application/json', 'image/png', 'application/pdf']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists canvas_artifacts_storage_select_own on storage.objects;
create policy canvas_artifacts_storage_select_own on storage.objects
for select to authenticated
using (
  bucket_id = 'canvas-artifacts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists canvas_artifacts_storage_insert_own on storage.objects;
create policy canvas_artifacts_storage_insert_own on storage.objects
for insert to authenticated
with check (
  bucket_id = 'canvas-artifacts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists canvas_artifacts_storage_update_own on storage.objects;
create policy canvas_artifacts_storage_update_own on storage.objects
for update to authenticated
using (
  bucket_id = 'canvas-artifacts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'canvas-artifacts'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
