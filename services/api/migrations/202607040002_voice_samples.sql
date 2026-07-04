-- "My voice" read-aloud recordings: a short consented sample per user that
-- on-device Zipvoice cloning uses as its reference. The recording itself
-- lives in the private `voice-samples` storage bucket under
-- <user_id>/sample.m4a; this table is the registration/consent record, and
-- register_voice_sample() is the validated write path the mobile app calls.

create table if not exists public.voice_samples (
  user_id uuid primary key references auth.users (id) on delete cascade,
  transcript text not null check (char_length(transcript) between 1 and 2000),
  storage_path text not null,
  duration_seconds numeric not null check (duration_seconds between 3 and 60),
  consent_confirmed boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.voice_samples enable row level security;

drop policy if exists voice_samples_select_own on public.voice_samples;
create policy voice_samples_select_own
  on public.voice_samples for select
  using (auth.uid() = user_id);

drop policy if exists voice_samples_delete_own on public.voice_samples;
create policy voice_samples_delete_own
  on public.voice_samples for delete
  using (auth.uid() = user_id);

-- Inserts/updates go exclusively through register_voice_sample() so the
-- validation below cannot be bypassed; no insert/update policies on purpose.

create or replace function public.register_voice_sample(
  p_transcript text,
  p_storage_path text,
  p_duration_seconds numeric,
  p_consent_confirmed boolean
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'register_voice_sample requires an authenticated user';
  end if;

  if not p_consent_confirmed then
    raise exception 'Voice samples require confirmed consent';
  end if;

  if p_duration_seconds is null or p_duration_seconds < 3 or p_duration_seconds > 60 then
    raise exception 'Voice sample duration must be between 3 and 60 seconds';
  end if;

  if p_transcript is null or char_length(btrim(p_transcript)) = 0 then
    raise exception 'Voice samples require the recording transcript';
  end if;

  -- The sample must live inside the caller''s own storage folder.
  if p_storage_path is null or position(auth.uid()::text || '/' in p_storage_path) <> 1 then
    raise exception 'Voice sample storage path must be inside the caller''s folder';
  end if;

  insert into public.voice_samples
    (user_id, transcript, storage_path, duration_seconds, consent_confirmed, updated_at)
  values
    (auth.uid(), btrim(p_transcript), p_storage_path, p_duration_seconds, true, now())
  on conflict (user_id) do update set
    transcript = excluded.transcript,
    storage_path = excluded.storage_path,
    duration_seconds = excluded.duration_seconds,
    consent_confirmed = excluded.consent_confirmed,
    updated_at = excluded.updated_at;
end;
$$;

revoke all on function public.register_voice_sample(text, text, numeric, boolean) from public;
grant execute on function public.register_voice_sample(text, text, numeric, boolean) to authenticated;

-- Private storage bucket; users can only touch objects inside their own
-- <user_id>/ folder.
insert into storage.buckets (id, name, public)
values ('voice-samples', 'voice-samples', false)
on conflict (id) do nothing;

drop policy if exists voice_samples_storage_read_own on storage.objects;
create policy voice_samples_storage_read_own
  on storage.objects for select
  using (bucket_id = 'voice-samples' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists voice_samples_storage_write_own on storage.objects;
create policy voice_samples_storage_write_own
  on storage.objects for insert
  with check (bucket_id = 'voice-samples' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists voice_samples_storage_update_own on storage.objects;
create policy voice_samples_storage_update_own
  on storage.objects for update
  using (bucket_id = 'voice-samples' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'voice-samples' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists voice_samples_storage_delete_own on storage.objects;
create policy voice_samples_storage_delete_own
  on storage.objects for delete
  using (bucket_id = 'voice-samples' and (storage.foldername(name))[1] = auth.uid()::text);
