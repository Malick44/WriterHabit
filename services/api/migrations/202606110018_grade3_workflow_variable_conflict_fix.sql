-- Fix: writerhabit_complete_grade3_day_workflow raised
-- "column reference student_profile_id is ambiguous" at runtime — the
-- RETURNS TABLE output variables collide with the on-conflict column
-- references in PL/pgSQL. Resolve ambiguity in favor of table columns; all
-- function-local reads already use v_/p_ prefixed names.

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
#variable_conflict use_column
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
