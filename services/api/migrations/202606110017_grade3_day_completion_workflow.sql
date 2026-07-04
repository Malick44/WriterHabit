-- Grade 3 Writing Adventure day completion becomes a server-owned workflow.
--
-- Motivation: parents and teachers review student streaks through
-- student_progress_totals, but Grade 3 adventure completions never reached
-- that table, and the public client could upsert completed = true on all 30
-- days in one write. This migration:
--   1. adds completed_at to grade3_writing_progress;
--   2. guards completed/completed_at so only the completion workflow (or
--      admin/seed connections without a user JWT) can change them — students
--      keep autosaving drafts directly;
--   3. adds writerhabit_complete_grade3_day_workflow, which validates the
--      day, marks it complete, and transactionally updates
--      student_progress_totals (streak) and student_activity_days;
--   4. exposes grade3_progress_summary (day, completed, completed_at) to
--      linked parents/teachers via can_read_student while narrowing the base
--      table (which contains the child's draft text) to owner-only reads.
--
-- student_progress_totals is already server-owned (see
-- 202606110002_resource_rls_hardening.sql: admin-manage only, clients read
-- through select policies), so the streak this workflow writes is trusted.

-- 1. completed_at ------------------------------------------------------------

alter table public.grade3_writing_progress
  add column if not exists completed_at timestamptz;

update public.grade3_writing_progress
set completed_at = updated_at
where completed and completed_at is null;

create index if not exists grade3_writing_progress_completed_at_idx
  on public.grade3_writing_progress (student_profile_id, completed_at desc)
  where completed;

-- 2. Completion guard ---------------------------------------------------------
-- Authenticated public clients may keep writing draft fields but may not
-- change completed/completed_at. Connections without a user JWT (postgres,
-- service_role admin/seed scripts) and the workflow function (via the local
-- GUC) are exempt.

create or replace function public.grade3_writing_progress_guard_completion()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if (select auth.uid()) is null
     or coalesce(current_setting('writerhabit.grade3_completion_workflow', true), '') = 'on' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.completed or new.completed_at is not null then
      raise exception 'grade3_completion_workflow_required';
    end if;
  elsif new.completed is distinct from old.completed
     or new.completed_at is distinct from old.completed_at then
    raise exception 'grade3_completion_workflow_required';
  end if;

  return new;
end;
$$;

drop trigger if exists grade3_writing_progress_guard_completion on public.grade3_writing_progress;
create trigger grade3_writing_progress_guard_completion
before insert or update on public.grade3_writing_progress
for each row execute function public.grade3_writing_progress_guard_completion();

-- 3. Completion workflow ------------------------------------------------------

create or replace function public.writerhabit_complete_grade3_day_workflow(
  p_student_profile_id uuid,
  p_day smallint,
  p_minutes integer
)
returns table (
  id uuid,
  student_profile_id uuid,
  day smallint,
  completed boolean,
  completed_at timestamptz,
  updated_at timestamptz,
  already_completed boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.grade3_writing_progress%rowtype;
  v_now timestamptz := now();
  v_today date := (now() at time zone 'utc')::date;
  v_minutes integer := least(greatest(coalesce(p_minutes, 15), 1), 60);
  v_word_count integer;
begin
  if p_day is null or p_day < 1 or p_day > 30 then
    raise exception 'grade3_day_out_of_range';
  end if;

  select * into v_row
  from public.grade3_writing_progress g
  where g.student_profile_id = p_student_profile_id
    and g.day = p_day
  for update;

  if v_row.id is null then
    raise exception 'grade3_day_not_found';
  end if;

  if btrim(coalesce(v_row.draft, '')) = '' then
    raise exception 'grade3_day_draft_empty';
  end if;

  -- Idempotent replay: a completed day is returned as-is without counting
  -- streak or minutes twice.
  if v_row.completed then
    return query select
      v_row.id, v_row.student_profile_id, v_row.day,
      v_row.completed, v_row.completed_at, v_row.updated_at, true;
    return;
  end if;

  perform set_config('writerhabit.grade3_completion_workflow', 'on', true);
  update public.grade3_writing_progress g
  set completed = true,
      completed_at = v_now
  where g.id = v_row.id
  returning * into v_row;
  perform set_config('writerhabit.grade3_completion_workflow', '', true);

  v_word_count := coalesce(array_length(regexp_split_to_array(btrim(v_row.draft), '\s+'), 1), 0);

  insert into public.student_progress_totals (
    student_profile_id,
    minutes_this_week,
    weekly_minutes_goal,
    words_written,
    practiced_today_on,
    current_streak_days,
    best_streak_days,
    streak_status
  )
  values (
    p_student_profile_id,
    v_minutes,
    0,
    v_word_count,
    v_today,
    1,
    1,
    'continued'
  )
  on conflict (student_profile_id) do update
  set minutes_this_week = public.student_progress_totals.minutes_this_week + excluded.minutes_this_week,
      words_written = public.student_progress_totals.words_written + excluded.words_written,
      current_streak_days = case
        when public.student_progress_totals.practiced_today_on = v_today
          then greatest(public.student_progress_totals.current_streak_days, 1)
        when public.student_progress_totals.practiced_today_on = v_today - 1
          then public.student_progress_totals.current_streak_days + 1
        else 1
      end,
      best_streak_days = greatest(
        public.student_progress_totals.best_streak_days,
        case
          when public.student_progress_totals.practiced_today_on = v_today
            then greatest(public.student_progress_totals.current_streak_days, 1)
          when public.student_progress_totals.practiced_today_on = v_today - 1
            then public.student_progress_totals.current_streak_days + 1
          else 1
        end
      ),
      practiced_today_on = v_today,
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
    v_today,
    array['sentence_structure']::text[],
    0,
    v_minutes,
    v_word_count,
    0,
    0
  )
  on conflict (student_profile_id, activity_date) do update
  set practiced_skills = (
        select array(
          select distinct skill
          from unnest(public.student_activity_days.practiced_skills || excluded.practiced_skills) as skill
        )
      ),
      minutes_practiced = public.student_activity_days.minutes_practiced + excluded.minutes_practiced,
      words_written = public.student_activity_days.words_written + excluded.words_written;

  return query select
    v_row.id, v_row.student_profile_id, v_row.day,
    v_row.completed, v_row.completed_at, v_row.updated_at, false;
end;
$$;

revoke all on function public.writerhabit_complete_grade3_day_workflow(
  uuid,
  smallint,
  integer
) from public, anon, authenticated;

grant execute on function public.writerhabit_complete_grade3_day_workflow(
  uuid,
  smallint,
  integer
) to service_role;

-- 4. Reviewer summary view ----------------------------------------------------
-- Parents/teachers see completion signals (day, completed, completed_at),
-- never the child's draft text. The view is owned by postgres (bypasses the
-- base table's forced RLS) and re-filters through can_read_student, exactly
-- like the visibility helpers used elsewhere.

create or replace view public.grade3_progress_summary
with (security_barrier = true) as
select
  g.student_profile_id,
  g.day,
  g.completed,
  g.completed_at,
  g.updated_at
from public.grade3_writing_progress g
where public.can_read_student(g.student_profile_id);

grant select on public.grade3_progress_summary to authenticated;

-- Narrow the base table (contains draft text) to owner/admin reads; linked
-- parents/teachers use grade3_progress_summary instead.
drop policy if exists grade3_writing_progress_select_visible on public.grade3_writing_progress;
create policy grade3_writing_progress_select_visible on public.grade3_writing_progress
for select to authenticated
using (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin());
