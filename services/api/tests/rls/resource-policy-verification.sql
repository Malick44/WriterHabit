-- WriterHabit resource RLS verification.
-- This file is run by scripts/supabase-migrations.mjs in a rollback-only
-- transaction against the configured Supabase/Postgres environment.

begin;

create or replace function pg_temp.assert_count(
  p_check_name text,
  p_actual bigint,
  p_expected bigint
)
returns void
language plpgsql
as $$
begin
  if p_actual <> p_expected then
    raise exception '% expected %, got %', p_check_name, p_expected, p_actual;
  end if;
end;
$$;

create or replace function pg_temp.assert_text(
  p_check_name text,
  p_actual text,
  p_expected text
)
returns void
language plpgsql
as $$
begin
  if p_actual is distinct from p_expected then
    raise exception '% expected %, got %', p_check_name, p_expected, p_actual;
  end if;
end;
$$;

create or replace function pg_temp.use_authenticated_actor(p_actor_id uuid)
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claim.sub', p_actor_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object('sub', p_actor_id::text, 'role', 'authenticated')::text,
    true
  );
end;
$$;

do $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'users'
      and policyname = 'users_self_update_profile_fields'
  ) is false then
    raise exception 'users_self_update_profile_fields policy is missing';
  end if;

  if exists (
    select 1
    from pg_trigger
    where tgname = 'users_reject_client_role_change'
      and not tgisinternal
      and tgenabled = 'O'
  ) is false then
    raise exception 'users_reject_client_role_change trigger is missing or disabled';
  end if;

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and (
        (tablename = 'parent_student_links' and policyname = 'parent_student_links_parent_accept')
        or (tablename = 'class_students' and policyname = 'class_students_teacher_manage')
        or (tablename = 'review_jobs' and policyname = 'review_jobs_owner_manage')
        or (tablename = 'ai_coach_interactions' and policyname = 'ai_coach_interactions_owner_all')
        or (tablename = 'student_progress_totals' and policyname = 'student_progress_totals_owner_or_admin_manage')
        or (tablename = 'student_skill_progress' and policyname = 'student_skill_progress_owner_or_admin_manage')
        or (tablename = 'student_activity_days' and policyname = 'student_activity_days_owner_or_admin_manage')
        or (tablename = 'weekly_reviews' and policyname = 'weekly_reviews_owner_or_admin_manage')
        or (tablename = 'student_badges' and policyname = 'student_badges_owner_or_admin_manage')
        or (tablename = 'prepared_notifications' and policyname = 'prepared_notifications_owner_or_admin_manage')
      )
  ) then
    raise exception 'Found a removed broad owner/manage RLS policy';
  end if;
end;
$$;

delete from auth.users
where id in (
  '03000000-0000-4000-8000-000000000101'::uuid,
  '03000000-0000-4000-8000-000000000102'::uuid,
  '03000000-0000-4000-8000-000000000103'::uuid,
  '03000000-0000-4000-8000-000000000104'::uuid
);

insert into auth.users (
  id,
  aud,
  role,
  email,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '03000000-0000-4000-8000-000000000101'::uuid,
    'authenticated',
    'authenticated',
    'rls-policy-student-a@writerhabit.local',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"RLS Student A","role":"admin"}'::jsonb,
    now(),
    now()
  ),
  (
    '03000000-0000-4000-8000-000000000102'::uuid,
    'authenticated',
    'authenticated',
    'rls-policy-student-b@writerhabit.local',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"RLS Student B"}'::jsonb,
    now(),
    now()
  ),
  (
    '03000000-0000-4000-8000-000000000103'::uuid,
    'authenticated',
    'authenticated',
    'rls-policy-parent@writerhabit.local',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"RLS Parent"}'::jsonb,
    now(),
    now()
  ),
  (
    '03000000-0000-4000-8000-000000000104'::uuid,
    'authenticated',
    'authenticated',
    'rls-policy-teacher@writerhabit.local',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"RLS Teacher"}'::jsonb,
    now(),
    now()
  );

delete from public.student_profiles
where user_id in (
  '03000000-0000-4000-8000-000000000101'::uuid,
  '03000000-0000-4000-8000-000000000102'::uuid,
  '03000000-0000-4000-8000-000000000103'::uuid,
  '03000000-0000-4000-8000-000000000104'::uuid
);

insert into public.users (id, email, display_name, role, locale)
values
  (
    '03000000-0000-4000-8000-000000000101'::uuid,
    'rls-policy-student-a@writerhabit.local',
    'RLS Student A',
    'student',
    'en'
  ),
  (
    '03000000-0000-4000-8000-000000000102'::uuid,
    'rls-policy-student-b@writerhabit.local',
    'RLS Student B',
    'student',
    'en'
  ),
  (
    '03000000-0000-4000-8000-000000000103'::uuid,
    'rls-policy-parent@writerhabit.local',
    'RLS Parent',
    'parent',
    'en'
  ),
  (
    '03000000-0000-4000-8000-000000000104'::uuid,
    'rls-policy-teacher@writerhabit.local',
    'RLS Teacher',
    'teacher',
    'en'
  )
on conflict (id) do update
  set email = excluded.email,
      display_name = excluded.display_name,
      role = excluded.role,
      locale = excluded.locale,
      updated_at = now();

insert into public.student_profiles (
  id,
  user_id,
  grade_level,
  writing_level,
  writing_goals,
  daily_goal_minutes,
  language
)
values
  (
    '03000000-0000-4000-8000-000000000201'::uuid,
    '03000000-0000-4000-8000-000000000101'::uuid,
    7,
    'building',
    array['write_paragraphs']::text[],
    10,
    'en'
  ),
  (
    '03000000-0000-4000-8000-000000000202'::uuid,
    '03000000-0000-4000-8000-000000000102'::uuid,
    7,
    'building',
    array['write_paragraphs']::text[],
    10,
    'en'
  );

insert into public.parent_profiles (id, user_id, display_name)
values (
  '03000000-0000-4000-8000-000000000301'::uuid,
  '03000000-0000-4000-8000-000000000103'::uuid,
  'RLS Parent'
);

insert into public.teacher_profiles (id, user_id, display_name, school_name)
values (
  '03000000-0000-4000-8000-000000000401'::uuid,
  '03000000-0000-4000-8000-000000000104'::uuid,
  'RLS Teacher',
  'WriterHabit Test School'
);

insert into public.parent_student_links (
  id,
  parent_user_id,
  student_profile_id,
  relationship_label,
  status,
  accepted_at
)
values (
  '03000000-0000-4000-8000-000000000302'::uuid,
  '03000000-0000-4000-8000-000000000103'::uuid,
  '03000000-0000-4000-8000-000000000201'::uuid,
  'family',
  'active',
  now()
);

insert into public.classes (
  id,
  teacher_profile_id,
  name,
  grade_level,
  school_name,
  status
)
values (
  '03000000-0000-4000-8000-000000000501'::uuid,
  '03000000-0000-4000-8000-000000000401'::uuid,
  'RLS Class',
  7,
  'WriterHabit Test School',
  'active'
);

insert into public.class_students (
  id,
  class_id,
  student_profile_id,
  status
)
values (
  '03000000-0000-4000-8000-000000000502'::uuid,
  '03000000-0000-4000-8000-000000000501'::uuid,
  '03000000-0000-4000-8000-000000000201'::uuid,
  'active'
);

insert into public.rubrics (
  id,
  name_key,
  name_fallback,
  grade_level_min,
  grade_level_max,
  assignment_type,
  status
)
values (
  '03000000-0000-4000-8000-000000000601'::uuid,
  'rls.fixture.rubric',
  'RLS Fixture Rubric',
  1,
  12,
  'paragraph_writing',
  'active'
);

insert into public.assignments (
  id,
  title_key,
  title_fallback,
  prompt_key,
  prompt_fallback,
  assignment_type,
  grade_level_min,
  grade_level_max,
  skill_focus,
  difficulty,
  estimated_minutes,
  rubric_id,
  created_by_user_id,
  class_id,
  status,
  prompt_safety_status,
  published_at
)
values
  (
    '03000000-0000-4000-8000-000000000701'::uuid,
    'rls.fixture.class_assignment.title',
    'Class paragraph',
    'rls.fixture.class_assignment.prompt',
    'Write your own paragraph about a book you read.',
    'paragraph_writing',
    6,
    8,
    array['organization']::text[],
    'moderate',
    20,
    '03000000-0000-4000-8000-000000000601'::uuid,
    '03000000-0000-4000-8000-000000000104'::uuid,
    '03000000-0000-4000-8000-000000000501'::uuid,
    'published',
    'approved',
    now()
  ),
  (
    '03000000-0000-4000-8000-000000000702'::uuid,
    'rls.fixture.catalog_assignment.title',
    'Catalog paragraph',
    'rls.fixture.catalog_assignment.prompt',
    'Write your own paragraph about a place you know.',
    'paragraph_writing',
    6,
    8,
    array['organization']::text[],
    'moderate',
    20,
    '03000000-0000-4000-8000-000000000601'::uuid,
    null,
    null,
    'published',
    'approved',
    now()
  );

insert into public.student_assignments (
  id,
  student_profile_id,
  assignment_id,
  class_id,
  status,
  started_at
)
values
  (
    '03000000-0000-4000-8000-000000000801'::uuid,
    '03000000-0000-4000-8000-000000000201'::uuid,
    '03000000-0000-4000-8000-000000000701'::uuid,
    '03000000-0000-4000-8000-000000000501'::uuid,
    'submitted',
    now()
  ),
  (
    '03000000-0000-4000-8000-000000000802'::uuid,
    '03000000-0000-4000-8000-000000000202'::uuid,
    '03000000-0000-4000-8000-000000000702'::uuid,
    null,
    'submitted',
    now()
  );

insert into public.submissions (
  id,
  student_assignment_id,
  student_profile_id,
  status,
  typed_text_excerpt,
  word_count,
  sentence_count,
  paragraph_count,
  revision_number,
  idempotency_key
)
values
  (
    '03000000-0000-4000-8000-000000000901'::uuid,
    '03000000-0000-4000-8000-000000000801'::uuid,
    '03000000-0000-4000-8000-000000000201'::uuid,
    'submitted',
    'Student A wrote a short paragraph.',
    7,
    1,
    1,
    1,
    'rls-student-a-submission'
  ),
  (
    '03000000-0000-4000-8000-000000000902'::uuid,
    '03000000-0000-4000-8000-000000000802'::uuid,
    '03000000-0000-4000-8000-000000000202'::uuid,
    'submitted',
    'Student B wrote a short paragraph.',
    7,
    1,
    1,
    1,
    'rls-student-b-submission'
  );

insert into public.student_progress_totals (
  student_profile_id,
  assignments_completed,
  weekly_minutes_goal,
  words_written,
  streak_status
)
values
  (
    '03000000-0000-4000-8000-000000000201'::uuid,
    1,
    75,
    7,
    'continued'
  ),
  (
    '03000000-0000-4000-8000-000000000202'::uuid,
    1,
    75,
    7,
    'continued'
  );

-- Auth-metadata role escalation and direct public.users role changes fail.
set local role authenticated;
select pg_temp.use_authenticated_actor('03000000-0000-4000-8000-000000000101'::uuid);

do $$
declare
  v_observed_role text;
begin
  select role
  into v_observed_role
  from public.users
  where id = '03000000-0000-4000-8000-000000000101'::uuid;

  if v_observed_role <> 'student' then
    raise exception 'Auth metadata role elevated student fixture to %', v_observed_role;
  end if;

  begin
    update public.users
    set role = 'admin'
    where id = '03000000-0000-4000-8000-000000000101'::uuid;

    raise exception 'Student unexpectedly changed own role to admin';
  exception
    when insufficient_privilege then
      null;
  end;

  select role
  into v_observed_role
  from public.users
  where id = '03000000-0000-4000-8000-000000000101'::uuid;

  if v_observed_role <> 'student' then
    raise exception 'Student role changed to % after blocked admin attempt', v_observed_role;
  end if;
end;
$$;

-- Student A cannot read or write Student B's profile/submission data.
select pg_temp.assert_count(
  'student cannot read another student profile',
  (select count(*) from public.student_profiles where id = '03000000-0000-4000-8000-000000000202'::uuid),
  0
);
select pg_temp.assert_count(
  'student cannot read another student submission',
  (select count(*) from public.submissions where id = '03000000-0000-4000-8000-000000000902'::uuid),
  0
);

do $$
declare
  v_rows bigint;
begin
  update public.student_profiles
  set writing_level = 'confident'
  where id = '03000000-0000-4000-8000-000000000202'::uuid;
  get diagnostics v_rows = row_count;

  if v_rows <> 0 then
    raise exception 'Student updated another student profile';
  end if;

  update public.submissions
  set status = 'completed'
  where id = '03000000-0000-4000-8000-000000000902'::uuid;
  get diagnostics v_rows = row_count;

  if v_rows <> 0 then
    raise exception 'Student updated another student submission';
  end if;
end;
$$;

reset role;

-- Parent can read only an actively linked child, and revoked links deny access.
set local role authenticated;
select pg_temp.use_authenticated_actor('03000000-0000-4000-8000-000000000103'::uuid);

select pg_temp.assert_count(
  'parent can read active linked child',
  (select count(*) from public.student_profiles where id = '03000000-0000-4000-8000-000000000201'::uuid),
  1
);
select pg_temp.assert_count(
  'parent cannot read unlinked child',
  (select count(*) from public.student_profiles where id = '03000000-0000-4000-8000-000000000202'::uuid),
  0
);

reset role;

update public.parent_student_links
set status = 'revoked',
    revoked_at = now()
where id = '03000000-0000-4000-8000-000000000302'::uuid;

set local role authenticated;
select pg_temp.use_authenticated_actor('03000000-0000-4000-8000-000000000103'::uuid);

select pg_temp.assert_count(
  'revoked parent link denies child read',
  (select count(*) from public.student_profiles where id = '03000000-0000-4000-8000-000000000201'::uuid),
  0
);

do $$
declare
  v_rows bigint;
begin
  update public.parent_student_links
  set status = 'active',
      accepted_at = now(),
      revoked_at = null
  where id = '03000000-0000-4000-8000-000000000302'::uuid;
  get diagnostics v_rows = row_count;

  if v_rows <> 0 then
    raise exception 'Parent public client reactivated a revoked link';
  end if;
end;
$$;

reset role;

select pg_temp.assert_text(
  'parent link remains revoked after denied reactivation',
  (select status from public.parent_student_links where id = '03000000-0000-4000-8000-000000000302'::uuid),
  'revoked'
);

update public.parent_student_links
set status = 'active',
    accepted_at = now(),
    revoked_at = null
where id = '03000000-0000-4000-8000-000000000302'::uuid;

-- Teacher can read class submission summaries only while the student is active
-- in that teacher's class.
set local role authenticated;
select pg_temp.use_authenticated_actor('03000000-0000-4000-8000-000000000104'::uuid);

select pg_temp.assert_count(
  'teacher can read active class student submission',
  (select count(*) from public.submissions where id = '03000000-0000-4000-8000-000000000901'::uuid),
  1
);
select pg_temp.assert_count(
  'teacher cannot read non-class student submission',
  (select count(*) from public.submissions where id = '03000000-0000-4000-8000-000000000902'::uuid),
  0
);

do $$
declare
  v_rows bigint;
begin
  update public.class_students
  set status = 'removed',
      removed_at = now()
  where id = '03000000-0000-4000-8000-000000000502'::uuid;
  get diagnostics v_rows = row_count;

  if v_rows <> 0 then
    raise exception 'Teacher public client changed class roster membership directly';
  end if;
end;
$$;

reset role;

update public.class_students
set status = 'removed',
    removed_at = now()
where id = '03000000-0000-4000-8000-000000000502'::uuid;

set local role authenticated;
select pg_temp.use_authenticated_actor('03000000-0000-4000-8000-000000000104'::uuid);

select pg_temp.assert_count(
  'removed class membership denies teacher submission read',
  (select count(*) from public.submissions where id = '03000000-0000-4000-8000-000000000901'::uuid),
  0
);

reset role;

-- Public clients cannot write system-owned review, feedback, AI log, progress,
-- badge, or notification transition rows for their own student either.
set local role authenticated;
select pg_temp.use_authenticated_actor('03000000-0000-4000-8000-000000000101'::uuid);

do $$
declare
  v_rows bigint;
begin
  begin
    insert into public.review_jobs (
      submission_id,
      student_profile_id,
      status,
      idempotency_key
    )
    values (
      '03000000-0000-4000-8000-000000000901'::uuid,
      '03000000-0000-4000-8000-000000000201'::uuid,
      'queued',
      'public-review-write'
    );

    raise exception 'Student public client inserted review job';
  exception
    when insufficient_privilege then
      null;
  end;

  begin
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
      next_revision_task_fallback
    )
    values (
      '03000000-0000-4000-8000-000000000901'::uuid,
      '03000000-0000-4000-8000-000000000201'::uuid,
      7,
      'Student A wrote a short paragraph.',
      'rls.feedback.strength',
      'You wrote a clear topic.',
      'rls.feedback.improvement',
      'Add one supporting detail.',
      'rls.feedback.next',
      'Choose one sentence to expand.'
    );

    raise exception 'Student public client inserted feedback';
  exception
    when insufficient_privilege then
      null;
  end;

  begin
    insert into public.ai_coach_interactions (
      student_profile_id,
      student_assignment_id,
      action,
      status,
      safety_flags
    )
    values (
      '03000000-0000-4000-8000-000000000201'::uuid,
      '03000000-0000-4000-8000-000000000801'::uuid,
      'hint',
      'completed',
      '{}'::text[]
    );

    raise exception 'Student public client inserted AI interaction log';
  exception
    when insufficient_privilege then
      null;
  end;

  update public.student_progress_totals
  set words_written = 999
  where student_profile_id = '03000000-0000-4000-8000-000000000201'::uuid;
  get diagnostics v_rows = row_count;

  if v_rows <> 0 then
    raise exception 'Student public client updated progress totals';
  end if;

  begin
    insert into public.student_activity_days (
      student_profile_id,
      activity_date,
      practiced_skills,
      assignments_completed
    )
    values (
      '03000000-0000-4000-8000-000000000201'::uuid,
      current_date,
      array['organization']::text[],
      1
    );

    raise exception 'Student public client inserted progress activity';
  exception
    when insufficient_privilege then
      null;
  end;
end;
$$;

reset role;

-- The trusted service/admin SQL path can perform required backend transitions.
insert into public.review_jobs (
  id,
  submission_id,
  student_profile_id,
  status,
  idempotency_key
)
values (
  '03000000-0000-4000-8000-000000000911'::uuid,
  '03000000-0000-4000-8000-000000000901'::uuid,
  '03000000-0000-4000-8000-000000000201'::uuid,
  'queued',
  'service-review-write'
);

update public.review_jobs
set status = 'completed',
    started_at = coalesce(started_at, now()),
    completed_at = now()
where id = '03000000-0000-4000-8000-000000000911'::uuid;

insert into public.feedback (
  id,
  submission_id,
  student_profile_id,
  grade_level,
  submitted_text_excerpt,
  strength_key,
  strength_fallback,
  improvement_key,
  improvement_fallback,
  next_revision_task_key,
  next_revision_task_fallback
)
values (
  '03000000-0000-4000-8000-000000000912'::uuid,
  '03000000-0000-4000-8000-000000000901'::uuid,
  '03000000-0000-4000-8000-000000000201'::uuid,
  7,
  'Student A wrote a short paragraph.',
  'rls.feedback.strength',
  'You wrote a clear topic.',
  'rls.feedback.improvement',
  'Add one supporting detail.',
  'rls.feedback.next',
  'Choose one sentence to expand.'
);

insert into public.ai_coach_interactions (
  id,
  student_profile_id,
  student_assignment_id,
  action,
  status,
  safety_flags
)
values (
  '03000000-0000-4000-8000-000000000913'::uuid,
  '03000000-0000-4000-8000-000000000201'::uuid,
  '03000000-0000-4000-8000-000000000801'::uuid,
  'hint',
  'completed',
  '{}'::text[]
);

update public.student_progress_totals
set words_written = 42,
    assignments_completed = 2
where student_profile_id = '03000000-0000-4000-8000-000000000201'::uuid;

select pg_temp.assert_count(
  'service/admin review job transition persisted',
  (select count(*) from public.review_jobs where id = '03000000-0000-4000-8000-000000000911'::uuid and status = 'completed'),
  1
);
select pg_temp.assert_count(
  'service/admin feedback insert persisted',
  (select count(*) from public.feedback where id = '03000000-0000-4000-8000-000000000912'::uuid),
  1
);
select pg_temp.assert_count(
  'service/admin AI interaction insert persisted',
  (select count(*) from public.ai_coach_interactions where id = '03000000-0000-4000-8000-000000000913'::uuid),
  1
);
select pg_temp.assert_count(
  'service/admin progress update persisted',
  (select count(*) from public.student_progress_totals where student_profile_id = '03000000-0000-4000-8000-000000000201'::uuid and words_written = 42),
  1
);

select 'writerhabit_resource_rls'::text as check_name, true as passed;

rollback;
