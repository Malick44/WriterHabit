-- Store bounded student practice evidence metadata with each completion row.

alter table public.practice_sessions
  add column if not exists used_canvas boolean not null default false,
  add column if not exists attachment_count integer not null default 0,
  add column if not exists extracted_text_excerpt text,
  add column if not exists response_text text;

alter table public.practice_sessions
  drop constraint if exists practice_sessions_attachment_count_check,
  add constraint practice_sessions_attachment_count_check check (attachment_count >= 0 and attachment_count <= 12);

alter table public.practice_sessions
  drop constraint if exists practice_sessions_extracted_text_excerpt_length_check,
  add constraint practice_sessions_extracted_text_excerpt_length_check check (
    extracted_text_excerpt is null or char_length(extracted_text_excerpt) <= 1000
  );

alter table public.practice_sessions
  drop constraint if exists practice_sessions_response_text_length_check,
  add constraint practice_sessions_response_text_length_check check (
    response_text is null or char_length(response_text) <= 1000
  );
