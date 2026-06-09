-- WriteWise AI database schema draft.
-- Target: Supabase Postgres.
-- Status: draft migration; backend runtime and production apply workflow are not selected yet.

create extension if not exists pgcrypto;
create extension if not exists citext;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext not null unique,
  display_name text not null,
  role text not null,
  avatar_url text,
  locale text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_role_check check (role in ('student', 'parent', 'teacher', 'admin')),
  constraint users_display_name_not_blank check (btrim(display_name) <> '')
);

create index if not exists users_role_idx on public.users (role);
create index if not exists users_created_at_idx on public.users (created_at desc);

create table if not exists public.student_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  grade_level smallint not null,
  grade_band text generated always as (
    case
      when grade_level between 1 and 5 then 'elementary'
      when grade_level between 6 and 8 then 'middle'
      else 'high'
    end
  ) stored,
  writing_level text not null default 'getting_started',
  writing_goals text[] not null default '{}',
  daily_goal_minutes smallint not null default 10,
  language text not null default 'en',
  accessibility_settings jsonb not null default '{}'::jsonb,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_profiles_grade_level_check check (grade_level between 1 and 12),
  constraint student_profiles_grade_band_check check (grade_band in ('elementary', 'middle', 'high')),
  constraint student_profiles_writing_level_check check (
    writing_level in ('getting_started', 'building', 'steady', 'confident')
  ),
  constraint student_profiles_daily_goal_minutes_check check (daily_goal_minutes in (10, 15, 20, 30)),
  constraint student_profiles_writing_goals_check check (
    writing_goals <@ array[
      'improve_spelling',
      'write_better_sentences',
      'write_paragraphs',
      'write_essays',
      'creative_writing',
      'test_prep',
      'improve_grammar',
      'school_assignments',
      'improve_handwriting'
    ]::text[]
  )
);

create index if not exists student_profiles_grade_level_idx on public.student_profiles (grade_level);
create index if not exists student_profiles_writing_goals_gin_idx
  on public.student_profiles using gin (writing_goals);

create table if not exists public.parent_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint parent_profiles_display_name_not_blank check (btrim(display_name) <> '')
);

create table if not exists public.parent_settings (
  parent_user_id uuid primary key references public.users(id) on delete cascade,
  ai_coach_access text not null default 'hints_and_revision',
  assignment_alerts_enabled boolean not null default true,
  digest_frequency text not null default 'weekly',
  practice_reminder_enabled boolean not null default true,
  quiet_hours_label text not null default '8:00 PM - 7:00 AM',
  share_weekly_summary_with_teacher boolean not null default false,
  weekly_report_email_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint parent_settings_ai_coach_access_check check (
    ai_coach_access in ('hints_and_revision', 'restricted')
  ),
  constraint parent_settings_digest_frequency_check check (digest_frequency in ('weekly', 'twice_weekly'))
);

create table if not exists public.parent_student_links (
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null references public.users(id) on delete cascade,
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  relationship_label text not null default 'family',
  status text not null default 'pending',
  invited_by_user_id uuid references public.users(id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint parent_student_links_status_check check (status in ('pending', 'active', 'revoked')),
  constraint parent_student_links_relationship_label_not_blank check (btrim(relationship_label) <> '')
);

create unique index if not exists parent_student_links_parent_student_idx
  on public.parent_student_links (parent_user_id, student_profile_id);
create index if not exists parent_student_links_parent_status_idx
  on public.parent_student_links (parent_user_id, status);
create index if not exists parent_student_links_student_status_idx
  on public.parent_student_links (student_profile_id, status);
create index if not exists parent_student_links_active_student_idx
  on public.parent_student_links (student_profile_id, parent_user_id)
  where status = 'active';
create index if not exists parent_student_links_invited_by_user_id_idx
  on public.parent_student_links (invited_by_user_id)
  where invited_by_user_id is not null;

create table if not exists public.teacher_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  display_name text not null,
  school_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teacher_profiles_display_name_not_blank check (btrim(display_name) <> '')
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_profile_id uuid not null references public.teacher_profiles(id) on delete cascade,
  name text not null,
  grade_level smallint not null,
  school_name text,
  status text not null default 'active',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint classes_grade_level_check check (grade_level between 1 and 12),
  constraint classes_status_check check (status in ('active', 'archived')),
  constraint classes_name_not_blank check (btrim(name) <> '')
);

create index if not exists classes_teacher_status_idx on public.classes (teacher_profile_id, status);
create index if not exists classes_grade_level_idx on public.classes (grade_level);

create table if not exists public.class_students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  status text not null default 'active',
  joined_at timestamptz not null default now(),
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint class_students_status_check check (status in ('active', 'removed'))
);

create unique index if not exists class_students_active_student_idx
  on public.class_students (class_id, student_profile_id)
  where status = 'active';
create index if not exists class_students_student_status_idx
  on public.class_students (student_profile_id, status);

create table if not exists public.rubrics (
  id uuid primary key default gen_random_uuid(),
  name_key text not null,
  name_fallback text not null,
  grade_level_min smallint not null,
  grade_level_max smallint not null,
  assignment_type text not null,
  created_by_user_id uuid references public.users(id) on delete set null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rubrics_grade_range_check check (
    grade_level_min between 1 and 12
    and grade_level_max between 1 and 12
    and grade_level_min <= grade_level_max
  ),
  constraint rubrics_assignment_type_check check (
    assignment_type in (
      'sentence_practice',
      'paragraph_writing',
      'essay_writing',
      'creative_writing',
      'reading_response',
      'grammar_practice',
      'vocabulary_practice',
      'test_prep',
      'journal',
      'handwriting_practice'
    )
  ),
  constraint rubrics_status_check check (status in ('active', 'archived')),
  constraint rubrics_name_key_not_blank check (btrim(name_key) <> ''),
  constraint rubrics_name_fallback_not_blank check (btrim(name_fallback) <> '')
);

create index if not exists rubrics_type_grade_idx
  on public.rubrics (assignment_type, grade_level_min, grade_level_max);
create index if not exists rubrics_created_by_user_id_idx on public.rubrics (created_by_user_id);

create table if not exists public.rubric_criteria (
  id uuid primary key default gen_random_uuid(),
  rubric_id uuid not null references public.rubrics(id) on delete cascade,
  sort_order smallint not null,
  skill text not null,
  label_key text not null,
  label_fallback text not null,
  description_key text not null,
  description_fallback text not null,
  max_score smallint not null default 4,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rubric_criteria_sort_order_check check (sort_order > 0),
  constraint rubric_criteria_max_score_check check (max_score = 4),
  constraint rubric_criteria_skill_check check (
    skill in (
      'spelling',
      'grammar',
      'punctuation',
      'sentence_structure',
      'vocabulary',
      'organization',
      'creativity',
      'clarity',
      'evidence_usage',
      'argument_strength',
      'revision_quality',
      'handwriting',
      'reading_response'
    )
  )
);

create unique index if not exists rubric_criteria_rubric_sort_order_idx
  on public.rubric_criteria (rubric_id, sort_order);
create index if not exists rubric_criteria_skill_idx on public.rubric_criteria (skill);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  title_key text not null,
  title_fallback text not null,
  prompt_key text not null,
  prompt_fallback text not null,
  instructions jsonb not null default '[]'::jsonb,
  assignment_type text not null,
  grade_level_min smallint not null,
  grade_level_max smallint not null,
  skill_focus text[] not null default '{}',
  difficulty text not null,
  estimated_minutes smallint not null,
  rubric_id uuid not null references public.rubrics(id) on delete restrict,
  created_by_user_id uuid references public.users(id) on delete set null,
  class_id uuid references public.classes(id) on delete cascade,
  status text not null default 'draft',
  prompt_safety_status text not null default 'pending_review',
  allow_canvas boolean not null default true,
  due_at timestamptz,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assignments_grade_range_check check (
    grade_level_min between 1 and 12
    and grade_level_max between 1 and 12
    and grade_level_min <= grade_level_max
  ),
  constraint assignments_assignment_type_check check (
    assignment_type in (
      'sentence_practice',
      'paragraph_writing',
      'essay_writing',
      'creative_writing',
      'reading_response',
      'grammar_practice',
      'vocabulary_practice',
      'test_prep',
      'journal',
      'handwriting_practice'
    )
  ),
  constraint assignments_skill_focus_check check (
    skill_focus <@ array[
      'spelling',
      'grammar',
      'punctuation',
      'sentence_structure',
      'vocabulary',
      'organization',
      'creativity',
      'clarity',
      'evidence_usage',
      'argument_strength',
      'revision_quality',
      'handwriting',
      'reading_response'
    ]::text[]
  ),
  constraint assignments_difficulty_check check (difficulty in ('easy', 'moderate', 'challenging')),
  constraint assignments_estimated_minutes_check check (estimated_minutes > 0 and estimated_minutes <= 180),
  constraint assignments_status_check check (status in ('draft', 'published', 'archived')),
  constraint assignments_prompt_safety_status_check check (
    prompt_safety_status in ('pending_review', 'approved', 'blocked')
  ),
  constraint assignments_title_key_not_blank check (btrim(title_key) <> ''),
  constraint assignments_title_fallback_not_blank check (btrim(title_fallback) <> ''),
  constraint assignments_prompt_key_not_blank check (btrim(prompt_key) <> ''),
  constraint assignments_prompt_fallback_not_blank check (btrim(prompt_fallback) <> '')
);

create index if not exists assignments_rubric_id_idx on public.assignments (rubric_id);
create index if not exists assignments_created_by_user_id_idx on public.assignments (created_by_user_id);
create index if not exists assignments_class_status_due_idx on public.assignments (class_id, status, due_at);
create index if not exists assignments_catalog_grade_type_idx
  on public.assignments (status, assignment_type, grade_level_min, grade_level_max)
  where class_id is null;
create index if not exists assignments_skill_focus_gin_idx on public.assignments using gin (skill_focus);

create table if not exists public.student_assignments (
  id uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  status text not null default 'not_started',
  due_at timestamptz,
  started_at timestamptz,
  submitted_at timestamptz,
  completed_at timestamptz,
  current_submission_id uuid,
  teacher_note_key text,
  teacher_note_fallback text,
  daily_selection_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_assignments_status_check check (
    status in (
      'not_started',
      'in_progress',
      'submitted',
      'reviewing',
      'feedback_ready',
      'revision_in_progress',
      'completed'
    )
  )
);

create unique index if not exists student_assignments_catalog_unique_idx
  on public.student_assignments (student_profile_id, assignment_id)
  where class_id is null;
create unique index if not exists student_assignments_class_unique_idx
  on public.student_assignments (student_profile_id, assignment_id, class_id)
  where class_id is not null;
create index if not exists student_assignments_student_status_updated_idx
  on public.student_assignments (student_profile_id, status, updated_at desc);
create index if not exists student_assignments_assignment_id_idx on public.student_assignments (assignment_id);
create index if not exists student_assignments_class_status_idx on public.student_assignments (class_id, status);
create index if not exists student_assignments_current_submission_id_idx
  on public.student_assignments (current_submission_id)
  where current_submission_id is not null;

create table if not exists public.writing_drafts (
  id uuid primary key default gen_random_uuid(),
  student_assignment_id uuid not null unique references public.student_assignments(id) on delete cascade,
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  text_content text not null default '',
  text_preview text not null default '',
  canvas_document_ids uuid[] not null default '{}',
  autosave_version integer not null default 1,
  word_count integer not null default 0,
  sentence_count integer not null default 0,
  paragraph_count integer not null default 0,
  revision_number integer not null default 1,
  client_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint writing_drafts_autosave_version_check check (autosave_version > 0),
  constraint writing_drafts_counts_check check (
    word_count >= 0 and sentence_count >= 0 and paragraph_count >= 0 and revision_number > 0
  ),
  constraint writing_drafts_text_length_check check (char_length(text_content) <= 20000),
  constraint writing_drafts_text_preview_length_check check (char_length(text_preview) <= 500)
);

create index if not exists writing_drafts_student_updated_idx
  on public.writing_drafts (student_profile_id, updated_at desc);
create index if not exists writing_drafts_canvas_document_ids_gin_idx
  on public.writing_drafts using gin (canvas_document_ids);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  student_assignment_id uuid not null references public.student_assignments(id) on delete cascade,
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  status text not null default 'submitted',
  typed_text_excerpt text not null default '',
  word_count integer not null default 0,
  sentence_count integer not null default 0,
  paragraph_count integer not null default 0,
  revision_number integer not null default 1,
  idempotency_key text not null,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint submissions_status_check check (
    status in ('submitted', 'reviewing', 'feedback_ready', 'revision_in_progress', 'completed')
  ),
  constraint submissions_counts_check check (
    word_count >= 0 and sentence_count >= 0 and paragraph_count >= 0 and revision_number > 0
  ),
  constraint submissions_typed_text_excerpt_length_check check (char_length(typed_text_excerpt) <= 1000),
  constraint submissions_idempotency_key_not_blank check (btrim(idempotency_key) <> '')
);

create unique index if not exists submissions_student_assignment_revision_idx
  on public.submissions (student_assignment_id, revision_number);
create unique index if not exists submissions_student_assignment_idempotency_idx
  on public.submissions (student_assignment_id, idempotency_key);
create index if not exists submissions_student_status_submitted_idx
  on public.submissions (student_profile_id, status, submitted_at desc);

create table if not exists public.submission_contents (
  submission_id uuid primary key references public.submissions(id) on delete cascade,
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  typed_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint submission_contents_typed_text_not_blank check (btrim(typed_text) <> ''),
  constraint submission_contents_typed_text_length_check check (char_length(typed_text) <= 40000)
);

create index if not exists submission_contents_student_profile_id_idx
  on public.submission_contents (student_profile_id);

create table if not exists public.canvas_documents (
  id uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  assignment_id uuid references public.assignments(id) on delete set null,
  student_assignment_id uuid references public.student_assignments(id) on delete set null,
  template text not null,
  title text not null,
  sync_status text not null default 'saved',
  client_version integer not null default 1,
  object_path text,
  preview_image_path text,
  recognition_status text not null default 'not_requested',
  recognition_confidence numeric(4, 3),
  attached_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint canvas_documents_template_check check (
    template in (
      'blank_page',
      'lined_paper',
      'storyboard',
      'mind_map',
      'essay_plan',
      'vocabulary_web',
      'handwriting_practice',
      'annotate_passage'
    )
  ),
  constraint canvas_documents_sync_status_check check (
    sync_status in ('local_only', 'saving', 'saved', 'sync_failed')
  ),
  constraint canvas_documents_recognition_status_check check (
    recognition_status in ('not_requested', 'queued', 'processing', 'completed', 'failed')
  ),
  constraint canvas_documents_recognition_confidence_check check (
    recognition_confidence is null or (recognition_confidence >= 0 and recognition_confidence <= 1)
  ),
  constraint canvas_documents_title_not_blank check (btrim(title) <> ''),
  constraint canvas_documents_client_version_check check (client_version > 0)
);

create index if not exists canvas_documents_student_updated_idx
  on public.canvas_documents (student_profile_id, updated_at desc)
  where deleted_at is null;
create index if not exists canvas_documents_assignment_id_idx on public.canvas_documents (assignment_id);
create index if not exists canvas_documents_student_assignment_id_idx
  on public.canvas_documents (student_assignment_id);
create index if not exists canvas_documents_sync_status_idx on public.canvas_documents (sync_status);

create table if not exists public.canvas_document_contents (
  canvas_document_id uuid primary key references public.canvas_documents(id) on delete cascade,
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  strokes jsonb not null default '[]'::jsonb,
  recognized_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint canvas_document_contents_strokes_array_check check (jsonb_typeof(strokes) = 'array'),
  constraint canvas_document_contents_recognized_text_length_check check (
    recognized_text is null or char_length(recognized_text) <= 20000
  )
);

create index if not exists canvas_document_contents_student_profile_id_idx
  on public.canvas_document_contents (student_profile_id);
create index if not exists canvas_document_contents_strokes_gin_idx
  on public.canvas_document_contents using gin (strokes jsonb_path_ops);

create table if not exists public.submission_canvas_documents (
  submission_id uuid not null references public.submissions(id) on delete cascade,
  canvas_document_id uuid not null references public.canvas_documents(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (submission_id, canvas_document_id)
);

create index if not exists submission_canvas_documents_canvas_document_id_idx
  on public.submission_canvas_documents (canvas_document_id);

create table if not exists public.review_jobs (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  status text not null default 'queued',
  idempotency_key text not null,
  safety_flags text[] not null default '{}',
  queued_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  failure_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint review_jobs_status_check check (
    status in ('queued', 'processing', 'completed', 'failed', 'safety_blocked')
  ),
  constraint review_jobs_safety_flags_check check (
    safety_flags <@ array[
      'assignment_completion_request',
      'full_rewrite_request',
      'answer_request',
      'age_inappropriate'
    ]::text[]
  ),
  constraint review_jobs_idempotency_key_not_blank check (btrim(idempotency_key) <> '')
);

create unique index if not exists review_jobs_submission_idempotency_idx
  on public.review_jobs (submission_id, idempotency_key);
create index if not exists review_jobs_student_status_queued_idx
  on public.review_jobs (student_profile_id, status, queued_at desc);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references public.submissions(id) on delete cascade,
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  grade_level smallint not null,
  submitted_text_excerpt text not null default '',
  strength_key text not null,
  strength_fallback text not null,
  improvement_key text not null,
  improvement_fallback text not null,
  next_revision_task_key text not null,
  next_revision_task_fallback text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feedback_grade_level_check check (grade_level between 1 and 12),
  constraint feedback_submitted_text_excerpt_length_check check (char_length(submitted_text_excerpt) <= 1000),
  constraint feedback_strength_key_not_blank check (btrim(strength_key) <> ''),
  constraint feedback_improvement_key_not_blank check (btrim(improvement_key) <> ''),
  constraint feedback_next_revision_task_key_not_blank check (btrim(next_revision_task_key) <> '')
);

create index if not exists feedback_student_created_idx
  on public.feedback (student_profile_id, created_at desc);

create table if not exists public.revision_tasks (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.feedback(id) on delete cascade,
  target_skill text not null,
  instruction_key text not null,
  instruction_fallback text not null,
  guiding_question_key text not null,
  guiding_question_fallback text not null,
  original_excerpt text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint revision_tasks_target_skill_check check (
    target_skill in (
      'spelling',
      'grammar',
      'punctuation',
      'sentence_structure',
      'vocabulary',
      'organization',
      'creativity',
      'clarity',
      'evidence_usage',
      'argument_strength',
      'revision_quality',
      'handwriting',
      'reading_response'
    )
  ),
  constraint revision_tasks_original_excerpt_length_check check (char_length(original_excerpt) <= 1000)
);

create index if not exists revision_tasks_feedback_id_idx on public.revision_tasks (feedback_id);
create index if not exists revision_tasks_target_skill_idx on public.revision_tasks (target_skill);

create table if not exists public.feedback_rubric_scores (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.feedback(id) on delete cascade,
  rubric_criterion_id uuid not null references public.rubric_criteria(id) on delete restrict,
  score smallint not null,
  max_score smallint not null default 4,
  level text not null,
  coaching_note_key text not null,
  coaching_note_fallback text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint feedback_rubric_scores_score_check check (score between 1 and 4),
  constraint feedback_rubric_scores_max_score_check check (max_score = 4),
  constraint feedback_rubric_scores_level_check check (level in ('starting', 'building', 'meeting', 'strong'))
);

create unique index if not exists feedback_rubric_scores_feedback_criterion_idx
  on public.feedback_rubric_scores (feedback_id, rubric_criterion_id);
create index if not exists feedback_rubric_scores_rubric_criterion_id_idx
  on public.feedback_rubric_scores (rubric_criterion_id);

create table if not exists public.grammar_suggestions (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.feedback(id) on delete cascade,
  title_key text not null,
  title_fallback text not null,
  explanation_key text not null,
  explanation_fallback text not null,
  original_excerpt text not null default '',
  student_action_key text not null,
  student_action_fallback text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grammar_suggestions_original_excerpt_length_check check (char_length(original_excerpt) <= 500)
);

create index if not exists grammar_suggestions_feedback_id_idx on public.grammar_suggestions (feedback_id);

create table if not exists public.submission_revisions (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  revision_task_id uuid references public.revision_tasks(id) on delete set null,
  revised_excerpt text not null,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint submission_revisions_revised_excerpt_not_blank check (btrim(revised_excerpt) <> ''),
  constraint submission_revisions_revised_excerpt_length_check check (char_length(revised_excerpt) <= 4000),
  constraint submission_revisions_idempotency_key_not_blank check (btrim(idempotency_key) <> '')
);

create unique index if not exists submission_revisions_submission_idempotency_idx
  on public.submission_revisions (submission_id, idempotency_key);
create index if not exists submission_revisions_student_created_idx
  on public.submission_revisions (student_profile_id, created_at desc);
create index if not exists submission_revisions_revision_task_id_idx
  on public.submission_revisions (revision_task_id);

create table if not exists public.teacher_submission_comments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  teacher_profile_id uuid not null references public.teacher_profiles(id) on delete cascade,
  comment_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teacher_submission_comments_comment_text_not_blank check (btrim(comment_text) <> ''),
  constraint teacher_submission_comments_comment_text_length_check check (char_length(comment_text) <= 2000)
);

create index if not exists teacher_submission_comments_submission_created_idx
  on public.teacher_submission_comments (submission_id, created_at desc);
create index if not exists teacher_submission_comments_teacher_created_idx
  on public.teacher_submission_comments (teacher_profile_id, created_at desc);

create table if not exists public.ai_coach_interactions (
  id uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  student_assignment_id uuid references public.student_assignments(id) on delete set null,
  action text not null,
  status text not null,
  safety_flags text[] not null default '{}',
  draft_excerpt text,
  selected_text_excerpt text,
  response_title_key text,
  response_message_key text,
  next_step_key text,
  question_key text,
  provider_request_id text,
  created_at timestamptz not null default now(),
  constraint ai_coach_interactions_action_check check (
    action in ('hint', 'brainstorm', 'check_sentence', 'explain_grammar', 'suggest_vocabulary', 'revision_question')
  ),
  constraint ai_coach_interactions_status_check check (status in ('completed', 'safety_blocked', 'failed')),
  constraint ai_coach_interactions_safety_flags_check check (
    safety_flags <@ array[
      'assignment_completion_request',
      'full_rewrite_request',
      'answer_request',
      'age_inappropriate'
    ]::text[]
  ),
  constraint ai_coach_interactions_draft_excerpt_length_check check (
    draft_excerpt is null or char_length(draft_excerpt) <= 1000
  ),
  constraint ai_coach_interactions_selected_text_excerpt_length_check check (
    selected_text_excerpt is null or char_length(selected_text_excerpt) <= 1000
  )
);

create index if not exists ai_coach_interactions_student_created_idx
  on public.ai_coach_interactions (student_profile_id, created_at desc);
create index if not exists ai_coach_interactions_student_action_created_idx
  on public.ai_coach_interactions (student_profile_id, action, created_at desc);
create index if not exists ai_coach_interactions_assignment_id_idx
  on public.ai_coach_interactions (student_assignment_id);

create table if not exists public.student_progress_totals (
  student_profile_id uuid primary key references public.student_profiles(id) on delete cascade,
  assignments_completed integer not null default 0,
  minutes_this_week integer not null default 0,
  weekly_minutes_goal integer not null default 0,
  words_written integer not null default 0,
  revisions_completed integer not null default 0,
  rubric_improvement numeric(5, 2) not null default 0,
  ai_feedback_applied integer not null default 0,
  handwriting_minutes integer not null default 0,
  current_streak_days integer not null default 0,
  best_streak_days integer not null default 0,
  practiced_today_on date,
  streak_status text not null default 'not_started',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_progress_totals_nonnegative_check check (
    assignments_completed >= 0
    and minutes_this_week >= 0
    and weekly_minutes_goal >= 0
    and words_written >= 0
    and revisions_completed >= 0
    and ai_feedback_applied >= 0
    and handwriting_minutes >= 0
    and current_streak_days >= 0
    and best_streak_days >= 0
  ),
  constraint student_progress_totals_streak_status_check check (
    streak_status in ('continued', 'at_risk', 'missed', 'not_started')
  )
);

create index if not exists student_progress_totals_streak_status_idx
  on public.student_progress_totals (streak_status);

create table if not exists public.student_skill_progress (
  id uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  skill text not null,
  current_score numeric(5, 2) not null default 0,
  previous_score numeric(5, 2) not null default 0,
  level smallint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_skill_progress_skill_check check (
    skill in (
      'spelling',
      'grammar',
      'punctuation',
      'sentence_structure',
      'vocabulary',
      'organization',
      'creativity',
      'clarity',
      'evidence_usage',
      'argument_strength',
      'revision_quality',
      'handwriting',
      'reading_response'
    )
  ),
  constraint student_skill_progress_scores_check check (current_score >= 0 and previous_score >= 0),
  constraint student_skill_progress_level_check check (level between 1 and 5)
);

create unique index if not exists student_skill_progress_student_skill_idx
  on public.student_skill_progress (student_profile_id, skill);

create table if not exists public.student_activity_days (
  id uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  activity_date date not null,
  practiced_skills text[] not null default '{}',
  assignments_completed integer not null default 0,
  minutes_practiced integer not null default 0,
  words_written integer not null default 0,
  revisions_completed integer not null default 0,
  feedback_applied integer not null default 0,
  handwriting_minutes integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_activity_days_practiced_skills_check check (
    practiced_skills <@ array[
      'spelling',
      'grammar',
      'punctuation',
      'sentence_structure',
      'vocabulary',
      'organization',
      'creativity',
      'clarity',
      'evidence_usage',
      'argument_strength',
      'revision_quality',
      'handwriting',
      'reading_response'
    ]::text[]
  ),
  constraint student_activity_days_nonnegative_check check (
    assignments_completed >= 0
    and minutes_practiced >= 0
    and words_written >= 0
    and revisions_completed >= 0
    and feedback_applied >= 0
    and handwriting_minutes >= 0
  )
);

create unique index if not exists student_activity_days_student_date_idx
  on public.student_activity_days (student_profile_id, activity_date desc);
create index if not exists student_activity_days_practiced_skills_gin_idx
  on public.student_activity_days using gin (practiced_skills);

create table if not exists public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  week_start date not null,
  week_end date not null,
  celebration_key text not null,
  celebration_fallback text not null,
  focus_for_next_week_key text not null,
  focus_for_next_week_fallback text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weekly_reviews_week_range_check check (week_start <= week_end)
);

create unique index if not exists weekly_reviews_student_week_idx
  on public.weekly_reviews (student_profile_id, week_start, week_end);

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_key text not null,
  name_fallback text not null,
  description_key text not null,
  description_fallback text not null,
  icon_name text not null,
  unlock_condition_key text not null,
  unlock_condition_fallback text not null,
  criteria jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint badges_code_not_blank check (btrim(code) <> ''),
  constraint badges_icon_name_not_blank check (btrim(icon_name) <> '')
);

create index if not exists badges_active_idx on public.badges (active);
create index if not exists badges_criteria_gin_idx on public.badges using gin (criteria jsonb_path_ops);

create table if not exists public.student_badges (
  id uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  status text not null default 'locked',
  progress_percent numeric(5, 2) not null default 0,
  unlocked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_badges_status_check check (status in ('locked', 'in_progress', 'unlocked')),
  constraint student_badges_progress_percent_check check (progress_percent >= 0 and progress_percent <= 100)
);

create unique index if not exists student_badges_student_badge_idx
  on public.student_badges (student_profile_id, badge_id);
create index if not exists student_badges_student_status_idx
  on public.student_badges (student_profile_id, status);
create index if not exists student_badges_badge_id_idx on public.student_badges (badge_id);

create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users(id) on delete cascade,
  scope_type text not null default 'personal',
  scope_id uuid,
  status text not null default 'free',
  can_access_premium boolean not null default false,
  current_plan_id text,
  billing_period text,
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  current_period_ends_at timestamptz,
  trial_ends_at timestamptz,
  management_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entitlements_scope_type_check check (scope_type in ('personal', 'family', 'class', 'school')),
  constraint entitlements_status_check check (status in ('free', 'trial', 'active', 'past_due', 'canceled')),
  constraint entitlements_current_plan_id_check check (
    current_plan_id is null or current_plan_id in ('writewise_plus_monthly', 'writewise_plus_yearly')
  ),
  constraint entitlements_billing_period_check check (
    billing_period is null or billing_period in ('month', 'year')
  ),
  constraint entitlements_provider_check check (provider is null or provider in ('revenuecat', 'stripe', 'manual'))
);

create index if not exists entitlements_owner_user_id_idx on public.entitlements (owner_user_id);
create index if not exists entitlements_scope_idx on public.entitlements (scope_type, scope_id);
create unique index if not exists entitlements_provider_subscription_idx
  on public.entitlements (provider, provider_subscription_id)
  where provider is not null and provider_subscription_id is not null;

create table if not exists public.entitlement_provider_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  owner_user_id uuid references public.users(id) on delete set null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_status text not null default 'received',
  metadata jsonb not null default '{}'::jsonb,
  constraint entitlement_provider_events_provider_check check (provider in ('revenuecat', 'stripe')),
  constraint entitlement_provider_events_processing_status_check check (
    processing_status in ('received', 'processed', 'ignored', 'failed')
  )
);

create unique index if not exists entitlement_provider_events_provider_event_idx
  on public.entitlement_provider_events (provider, provider_event_id);
create index if not exists entitlement_provider_events_owner_received_idx
  on public.entitlement_provider_events (owner_user_id, received_at desc);

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null unique references public.student_profiles(id) on delete cascade,
  enabled boolean not null default true,
  timezone text not null default 'UTC',
  daily_assignment_enabled boolean not null default true,
  daily_assignment_time text not null default '16:00',
  streak_enabled boolean not null default true,
  streak_time text not null default '18:00',
  incomplete_assignment_enabled boolean not null default true,
  incomplete_assignment_time text not null default '19:00',
  weekly_report_enabled boolean not null default true,
  weekly_report_time text not null default '09:00',
  weekly_report_weekday text not null default 'sunday',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_preferences_weekday_check check (
    weekly_report_weekday in ('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday')
  ),
  constraint notification_preferences_daily_time_check check (
    daily_assignment_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
  ),
  constraint notification_preferences_streak_time_check check (
    streak_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
  ),
  constraint notification_preferences_incomplete_time_check check (
    incomplete_assignment_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
  ),
  constraint notification_preferences_weekly_time_check check (
    weekly_report_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
  )
);

create table if not exists public.notification_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  student_profile_id uuid references public.student_profiles(id) on delete cascade,
  platform text not null,
  token_hash text not null unique,
  push_token_ciphertext text not null,
  last_seen_at timestamptz not null default now(),
  disabled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_devices_platform_check check (platform in ('ios', 'android', 'web')),
  constraint notification_devices_token_hash_not_blank check (btrim(token_hash) <> ''),
  constraint notification_devices_push_token_ciphertext_not_blank check (btrim(push_token_ciphertext) <> '')
);

create index if not exists notification_devices_user_seen_idx
  on public.notification_devices (user_id, last_seen_at desc);
create index if not exists notification_devices_student_profile_id_idx
  on public.notification_devices (student_profile_id)
  where student_profile_id is not null;

create table if not exists public.prepared_notifications (
  id uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null references public.student_profiles(id) on delete cascade,
  notification_type text not null,
  title_key text not null,
  body_key text not null,
  accessibility_label_key text not null,
  params jsonb not null default '{}'::jsonb,
  target_route text not null,
  target_params jsonb not null default '{}'::jsonb,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  status text not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint prepared_notifications_type_check check (
    notification_type in ('daily_assignment', 'streak', 'incomplete_assignment', 'weekly_report')
  ),
  constraint prepared_notifications_status_check check (status in ('scheduled', 'sent', 'canceled', 'failed')),
  constraint prepared_notifications_target_route_not_blank check (btrim(target_route) <> '')
);

create index if not exists prepared_notifications_student_scheduled_idx
  on public.prepared_notifications (student_profile_id, scheduled_for desc);
create index if not exists prepared_notifications_due_idx
  on public.prepared_notifications (status, scheduled_for)
  where status = 'scheduled';
create index if not exists prepared_notifications_params_gin_idx
  on public.prepared_notifications using gin (params jsonb_path_ops);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users(id) on delete set null,
  actor_role text not null,
  action text not null,
  target_type text not null,
  target_id uuid,
  request_id text not null,
  result text not null,
  ip_hash text,
  user_agent_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_logs_actor_role_check check (
    actor_role in ('student', 'parent', 'teacher', 'admin', 'provider', 'system')
  ),
  constraint audit_logs_result_check check (result in ('success', 'denied', 'failed')),
  constraint audit_logs_action_not_blank check (btrim(action) <> ''),
  constraint audit_logs_target_type_not_blank check (btrim(target_type) <> ''),
  constraint audit_logs_request_id_not_blank check (btrim(request_id) <> '')
);

create index if not exists audit_logs_actor_created_idx on public.audit_logs (actor_user_id, created_at desc);
create index if not exists audit_logs_target_created_idx on public.audit_logs (target_type, target_id, created_at desc);
create index if not exists audit_logs_action_created_idx on public.audit_logs (action, created_at desc);
create index if not exists audit_logs_metadata_gin_idx on public.audit_logs using gin (metadata jsonb_path_ops);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'student_assignments_current_submission_id_fkey'
      and conrelid = 'public.student_assignments'::regclass
  ) then
    alter table public.student_assignments
      add constraint student_assignments_current_submission_id_fkey
      foreign key (current_submission_id) references public.submissions(id) on delete set null;
  end if;
end $$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists student_profiles_set_updated_at on public.student_profiles;
create trigger student_profiles_set_updated_at before update on public.student_profiles
for each row execute function public.set_updated_at();

drop trigger if exists parent_profiles_set_updated_at on public.parent_profiles;
create trigger parent_profiles_set_updated_at before update on public.parent_profiles
for each row execute function public.set_updated_at();

drop trigger if exists parent_settings_set_updated_at on public.parent_settings;
create trigger parent_settings_set_updated_at before update on public.parent_settings
for each row execute function public.set_updated_at();

drop trigger if exists parent_student_links_set_updated_at on public.parent_student_links;
create trigger parent_student_links_set_updated_at before update on public.parent_student_links
for each row execute function public.set_updated_at();

drop trigger if exists teacher_profiles_set_updated_at on public.teacher_profiles;
create trigger teacher_profiles_set_updated_at before update on public.teacher_profiles
for each row execute function public.set_updated_at();

drop trigger if exists classes_set_updated_at on public.classes;
create trigger classes_set_updated_at before update on public.classes
for each row execute function public.set_updated_at();

drop trigger if exists class_students_set_updated_at on public.class_students;
create trigger class_students_set_updated_at before update on public.class_students
for each row execute function public.set_updated_at();

drop trigger if exists rubrics_set_updated_at on public.rubrics;
create trigger rubrics_set_updated_at before update on public.rubrics
for each row execute function public.set_updated_at();

drop trigger if exists rubric_criteria_set_updated_at on public.rubric_criteria;
create trigger rubric_criteria_set_updated_at before update on public.rubric_criteria
for each row execute function public.set_updated_at();

drop trigger if exists assignments_set_updated_at on public.assignments;
create trigger assignments_set_updated_at before update on public.assignments
for each row execute function public.set_updated_at();

drop trigger if exists student_assignments_set_updated_at on public.student_assignments;
create trigger student_assignments_set_updated_at before update on public.student_assignments
for each row execute function public.set_updated_at();

drop trigger if exists writing_drafts_set_updated_at on public.writing_drafts;
create trigger writing_drafts_set_updated_at before update on public.writing_drafts
for each row execute function public.set_updated_at();

drop trigger if exists submissions_set_updated_at on public.submissions;
create trigger submissions_set_updated_at before update on public.submissions
for each row execute function public.set_updated_at();

drop trigger if exists submission_contents_set_updated_at on public.submission_contents;
create trigger submission_contents_set_updated_at before update on public.submission_contents
for each row execute function public.set_updated_at();

drop trigger if exists canvas_documents_set_updated_at on public.canvas_documents;
create trigger canvas_documents_set_updated_at before update on public.canvas_documents
for each row execute function public.set_updated_at();

drop trigger if exists canvas_document_contents_set_updated_at on public.canvas_document_contents;
create trigger canvas_document_contents_set_updated_at before update on public.canvas_document_contents
for each row execute function public.set_updated_at();

drop trigger if exists review_jobs_set_updated_at on public.review_jobs;
create trigger review_jobs_set_updated_at before update on public.review_jobs
for each row execute function public.set_updated_at();

drop trigger if exists feedback_set_updated_at on public.feedback;
create trigger feedback_set_updated_at before update on public.feedback
for each row execute function public.set_updated_at();

drop trigger if exists revision_tasks_set_updated_at on public.revision_tasks;
create trigger revision_tasks_set_updated_at before update on public.revision_tasks
for each row execute function public.set_updated_at();

drop trigger if exists feedback_rubric_scores_set_updated_at on public.feedback_rubric_scores;
create trigger feedback_rubric_scores_set_updated_at before update on public.feedback_rubric_scores
for each row execute function public.set_updated_at();

drop trigger if exists grammar_suggestions_set_updated_at on public.grammar_suggestions;
create trigger grammar_suggestions_set_updated_at before update on public.grammar_suggestions
for each row execute function public.set_updated_at();

drop trigger if exists submission_revisions_set_updated_at on public.submission_revisions;
create trigger submission_revisions_set_updated_at before update on public.submission_revisions
for each row execute function public.set_updated_at();

drop trigger if exists teacher_submission_comments_set_updated_at on public.teacher_submission_comments;
create trigger teacher_submission_comments_set_updated_at before update on public.teacher_submission_comments
for each row execute function public.set_updated_at();

drop trigger if exists student_progress_totals_set_updated_at on public.student_progress_totals;
create trigger student_progress_totals_set_updated_at before update on public.student_progress_totals
for each row execute function public.set_updated_at();

drop trigger if exists student_skill_progress_set_updated_at on public.student_skill_progress;
create trigger student_skill_progress_set_updated_at before update on public.student_skill_progress
for each row execute function public.set_updated_at();

drop trigger if exists student_activity_days_set_updated_at on public.student_activity_days;
create trigger student_activity_days_set_updated_at before update on public.student_activity_days
for each row execute function public.set_updated_at();

drop trigger if exists weekly_reviews_set_updated_at on public.weekly_reviews;
create trigger weekly_reviews_set_updated_at before update on public.weekly_reviews
for each row execute function public.set_updated_at();

drop trigger if exists badges_set_updated_at on public.badges;
create trigger badges_set_updated_at before update on public.badges
for each row execute function public.set_updated_at();

drop trigger if exists student_badges_set_updated_at on public.student_badges;
create trigger student_badges_set_updated_at before update on public.student_badges
for each row execute function public.set_updated_at();

drop trigger if exists entitlements_set_updated_at on public.entitlements;
create trigger entitlements_set_updated_at before update on public.entitlements
for each row execute function public.set_updated_at();

drop trigger if exists notification_preferences_set_updated_at on public.notification_preferences;
create trigger notification_preferences_set_updated_at before update on public.notification_preferences
for each row execute function public.set_updated_at();

drop trigger if exists notification_devices_set_updated_at on public.notification_devices;
create trigger notification_devices_set_updated_at before update on public.notification_devices
for each row execute function public.set_updated_at();

drop trigger if exists prepared_notifications_set_updated_at on public.prepared_notifications;
create trigger prepared_notifications_set_updated_at before update on public.prepared_notifications
for each row execute function public.set_updated_at();
