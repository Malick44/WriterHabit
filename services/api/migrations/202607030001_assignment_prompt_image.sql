-- Optional illustration for the assignment prompt.
-- Shown above the prompt text on the student assignment screen (mirrors the
-- Grade 3 lesson read step). Nullable: assignments without an image simply
-- render the prompt card without a picture box.
alter table public.assignments
  add column if not exists prompt_image_url text;

comment on column public.assignments.prompt_image_url is
  'Optional URL of an illustration displayed above the prompt on the student assignment detail screen.';
