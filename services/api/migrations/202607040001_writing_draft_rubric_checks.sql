-- Rubric self-check state for the assignment revise step.
-- Keyed by rubric criterion id ({"criterion-id": true, ...}) so the student's
-- checkmarks survive app restarts and follow the draft across devices.
-- Defaults to '{}' — an empty object means nothing has been checked yet.
alter table public.writing_drafts
  add column if not exists rubric_checks jsonb not null default '{}'::jsonb;

comment on column public.writing_drafts.rubric_checks is
  'Student self-review checkmarks per rubric criterion id for the assignment revise step.';
