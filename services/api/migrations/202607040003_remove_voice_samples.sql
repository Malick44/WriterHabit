-- Revert 202607040002_voice_samples.sql: the "My voice" recording feature was
-- removed from the product before shipping (Zipvoice cloning dropped in favor
-- of the simple Supertonic style picker), so the pipeline objects come out
-- again. Applied after 202607040002 on environments that ran it; a no-op
-- elsewhere thanks to the guards below.

drop policy if exists voice_samples_storage_read_own on storage.objects;
drop policy if exists voice_samples_storage_write_own on storage.objects;
drop policy if exists voice_samples_storage_update_own on storage.objects;
drop policy if exists voice_samples_storage_delete_own on storage.objects;

-- The `voice-samples` bucket itself cannot be removed via SQL (Supabase
-- blocks direct storage-table writes); it is deleted through the Storage API
-- as part of the same change. Leaving an empty bucket behind is harmless.

drop function if exists public.register_voice_sample(text, text, numeric, boolean);

drop table if exists public.voice_samples;
