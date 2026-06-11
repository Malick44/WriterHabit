-- WriterHabit server-owned workflow state machines.
-- Public mobile clients may save student-owned drafts, but submissions,
-- review output, revision completion, assignment status, and progress
-- transitions must go through trusted backend transactions.

alter table public.feedback
  add column if not exists progress_minutes integer not null default 0,
  add column if not exists progress_points integer not null default 0,
  add column if not exists progress_skill text not null default 'revision_quality';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'feedback_progress_nonnegative_check'
      and conrelid = 'public.feedback'::regclass
  ) then
    alter table public.feedback
      add constraint feedback_progress_nonnegative_check
      check (progress_minutes >= 0 and progress_points >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'feedback_progress_skill_check'
      and conrelid = 'public.feedback'::regclass
  ) then
    alter table public.feedback
      add constraint feedback_progress_skill_check
      check (
        progress_skill in (
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
      );
  end if;
end;
$$;

drop policy if exists student_assignments_student_or_teacher_manage on public.student_assignments;
drop policy if exists student_assignments_admin_manage on public.student_assignments;
create policy student_assignments_admin_manage on public.student_assignments
for all to authenticated
using (public.is_WriterHabit_admin())
with check (public.is_WriterHabit_admin());

drop policy if exists submissions_owner_manage on public.submissions;
drop policy if exists submissions_admin_manage on public.submissions;
create policy submissions_admin_manage on public.submissions
for all to authenticated
using (public.is_WriterHabit_admin())
with check (public.is_WriterHabit_admin());

drop policy if exists submission_contents_owner_all on public.submission_contents;
drop policy if exists submission_contents_owner_select on public.submission_contents;
create policy submission_contents_owner_select on public.submission_contents
for select to authenticated
using (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin());

drop policy if exists submission_contents_admin_manage on public.submission_contents;
create policy submission_contents_admin_manage on public.submission_contents
for all to authenticated
using (public.is_WriterHabit_admin())
with check (public.is_WriterHabit_admin());

drop policy if exists submission_canvas_documents_owner_manage on public.submission_canvas_documents;
drop policy if exists submission_canvas_documents_admin_manage on public.submission_canvas_documents;
create policy submission_canvas_documents_admin_manage on public.submission_canvas_documents
for all to authenticated
using (public.is_WriterHabit_admin())
with check (public.is_WriterHabit_admin());

drop policy if exists submission_revisions_owner_manage on public.submission_revisions;
drop policy if exists submission_revisions_admin_manage on public.submission_revisions;
create policy submission_revisions_admin_manage on public.submission_revisions
for all to authenticated
using (public.is_WriterHabit_admin())
with check (public.is_WriterHabit_admin());

create or replace function public.writerhabit_submit_assignment_workflow(
  p_student_assignment_id uuid,
  p_student_profile_id uuid,
  p_typed_text text,
  p_typed_text_excerpt text,
  p_word_count integer,
  p_sentence_count integer,
  p_paragraph_count integer,
  p_canvas_document_ids uuid[],
  p_idempotency_key text
)
returns table (
  id uuid,
  student_assignment_id uuid,
  student_profile_id uuid,
  status text,
  typed_text_excerpt text,
  word_count integer,
  sentence_count integer,
  paragraph_count integer,
  revision_number integer,
  idempotency_key text,
  submitted_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_assignment public.student_assignments%rowtype;
  v_existing_text text;
  v_now timestamptz := now();
  v_revision_number integer;
  v_submission public.submissions%rowtype;
begin
  if btrim(coalesce(p_typed_text, '')) = '' then
    raise exception 'workflow_state_transition_invalid: empty_submission';
  end if;

  select *
  into v_assignment
  from public.student_assignments
  where student_assignments.id = p_student_assignment_id
  for update;

  if not found or v_assignment.student_profile_id <> p_student_profile_id then
    raise exception 'workflow_resource_missing: student_assignment';
  end if;

  select *
  into v_submission
  from public.submissions
  where submissions.student_assignment_id = p_student_assignment_id
    and submissions.idempotency_key = p_idempotency_key;

  if found then
    select typed_text
    into v_existing_text
    from public.submission_contents
    where submission_contents.submission_id = v_submission.id;

    if v_existing_text is not distinct from p_typed_text then
      return query
      select
        v_submission.id,
        v_submission.student_assignment_id,
        v_submission.student_profile_id,
        v_submission.status,
        v_submission.typed_text_excerpt,
        v_submission.word_count,
        v_submission.sentence_count,
        v_submission.paragraph_count,
        v_submission.revision_number,
        v_submission.idempotency_key,
        v_submission.submitted_at,
        v_submission.created_at,
        v_submission.updated_at;
      return;
    end if;

    raise unique_violation using message = 'duplicate idempotency key';
  end if;

  if v_assignment.status not in ('in_progress', 'revision_in_progress') then
    raise exception 'workflow_state_transition_invalid: submit_work from %', v_assignment.status;
  end if;

  select coalesce(max(submissions.revision_number), 0) + 1
  into v_revision_number
  from public.submissions
  where submissions.student_assignment_id = p_student_assignment_id;

  insert into public.submissions (
    student_assignment_id,
    student_profile_id,
    status,
    typed_text_excerpt,
    word_count,
    sentence_count,
    paragraph_count,
    revision_number,
    idempotency_key,
    submitted_at
  )
  values (
    p_student_assignment_id,
    p_student_profile_id,
    'submitted',
    left(coalesce(p_typed_text_excerpt, ''), 1000),
    p_word_count,
    p_sentence_count,
    p_paragraph_count,
    v_revision_number,
    p_idempotency_key,
    v_now
  )
  returning *
  into v_submission;

  insert into public.submission_contents (
    submission_id,
    student_profile_id,
    typed_text
  )
  values (
    v_submission.id,
    p_student_profile_id,
    p_typed_text
  );

  insert into public.submission_canvas_documents (
    submission_id,
    canvas_document_id
  )
  select v_submission.id, canvas_document_id
  from unnest(coalesce(p_canvas_document_ids, '{}'::uuid[])) as canvas_document_ids(canvas_document_id)
  on conflict do nothing;

  insert into public.review_jobs (
    submission_id,
    student_profile_id,
    status,
    idempotency_key,
    queued_at
  )
  values (
    v_submission.id,
    p_student_profile_id,
    'queued',
    p_idempotency_key,
    v_now
  );

  update public.student_assignments
  set current_submission_id = v_submission.id,
      status = 'submitted',
      submitted_at = v_now
  where student_assignments.id = p_student_assignment_id;

  return query
  select
    v_submission.id,
    v_submission.student_assignment_id,
    v_submission.student_profile_id,
    v_submission.status,
    v_submission.typed_text_excerpt,
    v_submission.word_count,
    v_submission.sentence_count,
    v_submission.paragraph_count,
    v_submission.revision_number,
    v_submission.idempotency_key,
    v_submission.submitted_at,
    v_submission.created_at,
    v_submission.updated_at;
end;
$$;

create or replace function public.writerhabit_publish_feedback_workflow(
  p_submission_id uuid,
  p_student_profile_id uuid,
  p_idempotency_key text,
  p_feedback jsonb,
  p_revision_task jsonb,
  p_rubric_scores jsonb,
  p_grammar_suggestions jsonb,
  p_safety_flags text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_feedback_id uuid;
  v_job_id uuid;
  v_now timestamptz := now();
  v_score jsonb;
  v_submission public.submissions%rowtype;
  v_suggestion jsonb;
  v_student_assignment public.student_assignments%rowtype;
begin
  select *
  into v_submission
  from public.submissions
  where submissions.id = p_submission_id
  for update;

  if not found or v_submission.student_profile_id <> p_student_profile_id then
    raise exception 'workflow_resource_missing: submission';
  end if;

  select *
  into v_student_assignment
  from public.student_assignments
  where student_assignments.id = v_submission.student_assignment_id
  for update;

  if not found then
    raise exception 'workflow_resource_missing: student_assignment';
  end if;

  if exists (select 1 from public.feedback where feedback.submission_id = p_submission_id) then
    return;
  end if;

  if v_submission.status not in ('submitted', 'reviewing')
     or v_student_assignment.status not in ('submitted', 'reviewing') then
    raise exception 'workflow_state_transition_invalid: publish_feedback from submission %, assignment %',
      v_submission.status,
      v_student_assignment.status;
  end if;

  select review_jobs.id
  into v_job_id
  from public.review_jobs
  where review_jobs.submission_id = p_submission_id
  order by review_jobs.queued_at desc
  limit 1
  for update;

  if v_job_id is null then
    insert into public.review_jobs (
      submission_id,
      student_profile_id,
      status,
      idempotency_key,
      queued_at,
      started_at
    )
    values (
      p_submission_id,
      p_student_profile_id,
      'processing',
      p_idempotency_key,
      v_now,
      v_now
    )
    returning id
    into v_job_id;
  end if;

  insert into public.feedback (
    submission_id,
    student_profile_id,
    grade_level,
    submitted_text_excerpt,
    strength_key,
    strength_fallback,
    improvement_key,
    improvement_fallback,
    next_revision_task_key,
    next_revision_task_fallback,
    progress_minutes,
    progress_points,
    progress_skill
  )
  values (
    p_submission_id,
    p_student_profile_id,
    (p_feedback ->> 'gradeLevel')::integer,
    left(coalesce(p_feedback ->> 'submittedTextExcerpt', ''), 1000),
    p_feedback ->> 'strengthKey',
    p_feedback ->> 'strengthFallback',
    p_feedback ->> 'improvementKey',
    p_feedback ->> 'improvementFallback',
    p_feedback ->> 'nextRevisionTaskKey',
    p_feedback ->> 'nextRevisionTaskFallback',
    coalesce((p_feedback ->> 'progressMinutes')::integer, 0),
    coalesce((p_feedback ->> 'progressPoints')::integer, 0),
    coalesce(p_feedback ->> 'progressSkill', 'revision_quality')
  )
  returning id
  into v_feedback_id;

  insert into public.revision_tasks (
    feedback_id,
    target_skill,
    instruction_key,
    instruction_fallback,
    guiding_question_key,
    guiding_question_fallback,
    original_excerpt
  )
  values (
    v_feedback_id,
    p_revision_task ->> 'targetSkill',
    p_revision_task ->> 'instructionKey',
    p_revision_task ->> 'instructionFallback',
    p_revision_task ->> 'guidingQuestionKey',
    p_revision_task ->> 'guidingQuestionFallback',
    left(coalesce(p_revision_task ->> 'originalExcerpt', ''), 1000)
  );

  for v_score in select * from jsonb_array_elements(coalesce(p_rubric_scores, '[]'::jsonb))
  loop
    insert into public.feedback_rubric_scores (
      feedback_id,
      rubric_criterion_id,
      score,
      max_score,
      level,
      coaching_note_key,
      coaching_note_fallback
    )
    values (
      v_feedback_id,
      (v_score ->> 'criterionId')::uuid,
      (v_score ->> 'score')::smallint,
      4,
      v_score ->> 'level',
      v_score ->> 'coachingNoteKey',
      v_score ->> 'coachingNoteFallback'
    );
  end loop;

  for v_suggestion in select * from jsonb_array_elements(coalesce(p_grammar_suggestions, '[]'::jsonb))
  loop
    insert into public.grammar_suggestions (
      feedback_id,
      title_key,
      title_fallback,
      explanation_key,
      explanation_fallback,
      original_excerpt,
      student_action_key,
      student_action_fallback
    )
    values (
      v_feedback_id,
      v_suggestion ->> 'titleKey',
      v_suggestion ->> 'titleFallback',
      v_suggestion ->> 'explanationKey',
      v_suggestion ->> 'explanationFallback',
      left(coalesce(v_suggestion ->> 'originalExcerpt', ''), 500),
      v_suggestion ->> 'studentActionKey',
      v_suggestion ->> 'studentActionFallback'
    );
  end loop;

  update public.review_jobs
  set status = 'completed',
      started_at = coalesce(started_at, v_now),
      completed_at = v_now,
      safety_flags = coalesce(p_safety_flags, '{}'::text[])
  where review_jobs.id = v_job_id;

  update public.submissions
  set status = 'feedback_ready'
  where submissions.id = p_submission_id;

  update public.student_assignments
  set status = 'feedback_ready',
      current_submission_id = p_submission_id
  where student_assignments.id = v_submission.student_assignment_id;
end;
$$;

create or replace function public.writerhabit_complete_revision_workflow(
  p_submission_id uuid,
  p_student_profile_id uuid,
  p_revision_task_id uuid,
  p_revised_excerpt text,
  p_idempotency_key text
)
returns table (
  id uuid,
  submission_id uuid,
  student_profile_id uuid,
  revision_task_id uuid,
  revised_excerpt text,
  idempotency_key text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.submission_revisions%rowtype;
  v_existing_task_id uuid;
  v_feedback public.feedback%rowtype;
  v_now timestamptz := now();
  v_revision public.submission_revisions%rowtype;
  v_submission public.submissions%rowtype;
  v_student_assignment public.student_assignments%rowtype;
begin
  if btrim(coalesce(p_revised_excerpt, '')) = '' then
    raise exception 'workflow_state_transition_invalid: empty_revision';
  end if;

  select *
  into v_submission
  from public.submissions
  where submissions.id = p_submission_id
  for update;

  if not found or v_submission.student_profile_id <> p_student_profile_id then
    raise exception 'workflow_resource_missing: submission';
  end if;

  select *
  into v_existing
  from public.submission_revisions
  where submission_revisions.submission_id = p_submission_id
    and submission_revisions.idempotency_key = p_idempotency_key;

  if found then
    if v_existing.revised_excerpt is not distinct from p_revised_excerpt
       and v_existing.revision_task_id is not distinct from p_revision_task_id then
      return query
      select
        v_existing.id,
        v_existing.submission_id,
        v_existing.student_profile_id,
        v_existing.revision_task_id,
        v_existing.revised_excerpt,
        v_existing.idempotency_key,
        v_existing.created_at;
      return;
    end if;

    raise unique_violation using message = 'duplicate idempotency key';
  end if;

  select *
  into v_student_assignment
  from public.student_assignments
  where student_assignments.id = v_submission.student_assignment_id
  for update;

  if not found then
    raise exception 'workflow_resource_missing: student_assignment';
  end if;

  select *
  into v_feedback
  from public.feedback
  where feedback.submission_id = p_submission_id;

  if not found then
    raise exception 'workflow_state_transition_invalid: feedback_not_ready';
  end if;

  select revision_tasks.id
  into v_existing_task_id
  from public.revision_tasks
  where revision_tasks.id = p_revision_task_id
    and revision_tasks.feedback_id = v_feedback.id;

  if v_existing_task_id is null then
    raise exception 'workflow_revision_task_invalid';
  end if;

  if v_submission.status not in ('feedback_ready', 'revision_in_progress')
     or v_student_assignment.status not in ('feedback_ready', 'revision_in_progress') then
    raise exception 'workflow_state_transition_invalid: complete_revision from submission %, assignment %',
      v_submission.status,
      v_student_assignment.status;
  end if;

  insert into public.submission_revisions (
    submission_id,
    student_profile_id,
    revision_task_id,
    revised_excerpt,
    idempotency_key
  )
  values (
    p_submission_id,
    p_student_profile_id,
    p_revision_task_id,
    left(p_revised_excerpt, 4000),
    p_idempotency_key
  )
  returning *
  into v_revision;

  update public.submissions
  set status = 'completed'
  where submissions.id = p_submission_id;

  update public.student_assignments
  set status = 'completed',
      completed_at = v_now
  where student_assignments.id = v_submission.student_assignment_id;

  insert into public.student_progress_totals (
    student_profile_id,
    assignments_completed,
    minutes_this_week,
    weekly_minutes_goal,
    words_written,
    revisions_completed,
    ai_feedback_applied,
    practiced_today_on,
    streak_status
  )
  values (
    p_student_profile_id,
    1,
    v_feedback.progress_minutes,
    0,
    v_submission.word_count,
    1,
    1,
    v_now::date,
    'continued'
  )
  on conflict (student_profile_id) do update
  set assignments_completed = public.student_progress_totals.assignments_completed + 1,
      minutes_this_week = public.student_progress_totals.minutes_this_week + excluded.minutes_this_week,
      words_written = public.student_progress_totals.words_written + excluded.words_written,
      revisions_completed = public.student_progress_totals.revisions_completed + 1,
      ai_feedback_applied = public.student_progress_totals.ai_feedback_applied + 1,
      practiced_today_on = excluded.practiced_today_on,
      streak_status = 'continued';

  insert into public.student_activity_days (
    student_profile_id,
    activity_date,
    practiced_skills,
    assignments_completed,
    minutes_practiced,
    words_written,
    revisions_completed,
    feedback_applied
  )
  values (
    p_student_profile_id,
    v_now::date,
    array[v_feedback.progress_skill]::text[],
    1,
    v_feedback.progress_minutes,
    v_submission.word_count,
    1,
    1
  )
  on conflict (student_profile_id, activity_date) do update
  set practiced_skills = (
        select array(
          select distinct skill
          from unnest(public.student_activity_days.practiced_skills || excluded.practiced_skills) as skill
        )
      ),
      assignments_completed = public.student_activity_days.assignments_completed + 1,
      minutes_practiced = public.student_activity_days.minutes_practiced + excluded.minutes_practiced,
      words_written = public.student_activity_days.words_written + excluded.words_written,
      revisions_completed = public.student_activity_days.revisions_completed + 1,
      feedback_applied = public.student_activity_days.feedback_applied + 1;

  return query
  select
    v_revision.id,
    v_revision.submission_id,
    v_revision.student_profile_id,
    v_revision.revision_task_id,
    v_revision.revised_excerpt,
    v_revision.idempotency_key,
    v_revision.created_at;
end;
$$;

revoke all on function public.writerhabit_submit_assignment_workflow(
  uuid,
  uuid,
  text,
  text,
  integer,
  integer,
  integer,
  uuid[],
  text
) from public, anon, authenticated;
revoke all on function public.writerhabit_publish_feedback_workflow(
  uuid,
  uuid,
  text,
  jsonb,
  jsonb,
  jsonb,
  jsonb,
  text[]
) from public, anon, authenticated;
revoke all on function public.writerhabit_complete_revision_workflow(
  uuid,
  uuid,
  uuid,
  text,
  text
) from public, anon, authenticated;

grant execute on function public.writerhabit_submit_assignment_workflow(
  uuid,
  uuid,
  text,
  text,
  integer,
  integer,
  integer,
  uuid[],
  text
) to service_role;
grant execute on function public.writerhabit_publish_feedback_workflow(
  uuid,
  uuid,
  text,
  jsonb,
  jsonb,
  jsonb,
  jsonb,
  text[]
) to service_role;
grant execute on function public.writerhabit_complete_revision_workflow(
  uuid,
  uuid,
  uuid,
  text,
  text
) to service_role;
