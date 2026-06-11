-- Canvas list screens only need a stroke count, not the full stroke payload.
-- A stored generated column lets summaries select the count directly instead
-- of transferring the strokes jsonb for every document in the list.

alter table public.canvas_document_contents
  add column if not exists stroke_count integer
    generated always as (jsonb_array_length(strokes)) stored;

comment on column public.canvas_document_contents.stroke_count is
  'Generated count of strokes; lets list summaries avoid fetching the strokes payload.';
