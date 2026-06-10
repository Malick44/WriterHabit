-- WriteWise AI profile settings and notification sync backend.
-- Adds RPCs used by the mobile app to sync student profile settings and
-- notification preferences while preserving RLS-protected table access.

alter table public.student_profiles
  add column if not exists learning_focus_note text not null default '';

alter table public.student_profiles
  drop constraint if exists student_profiles_daily_goal_minutes_check;

alter table public.student_profiles
  add constraint student_profiles_daily_goal_minutes_check
  check (daily_goal_minutes in (5, 10, 15, 20, 30));

alter table public.student_profiles
  drop constraint if exists student_profiles_language_check;

alter table public.student_profiles
  add constraint student_profiles_language_check
  check (language in ('en', 'es', 'fr'));

alter table public.student_profiles
  drop constraint if exists student_profiles_learning_focus_note_length_check;

alter table public.student_profiles
  add constraint student_profiles_learning_focus_note_length_check
  check (char_length(learning_focus_note) <= 500);

drop policy if exists users_self_update_profile_fields on public.users;
create policy users_self_update_profile_fields on public.users
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create or replace function public.ensure_own_student_profile(
  p_display_name text default null,
  p_grade_level smallint default null,
  p_language text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_email citext;
  v_existing_display_name text;
  v_existing_locale text;
  v_existing_profile_language text;
  v_display_name text;
  v_grade_level smallint;
  v_language text;
  v_profile_id uuid;
  v_existing_role text;
begin
  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  select au.email::citext
  into v_email
  from auth.users au
  where au.id = v_user_id;

  select u.role, u.display_name, u.locale
  into v_existing_role, v_existing_display_name, v_existing_locale
  from public.users u
  where u.id = v_user_id;

  select sp.language
  into v_existing_profile_language
  from public.student_profiles sp
  where sp.user_id = v_user_id;

  if v_existing_role is not null and v_existing_role <> 'student' and not public.is_writewise_admin() then
    raise exception 'Current user is not a student'
      using errcode = '42501';
  end if;

  v_grade_level := coalesce(p_grade_level, 5);
  v_language := coalesce(nullif(btrim(p_language), ''), v_existing_profile_language, v_existing_locale, 'en');
  v_display_name := coalesce(nullif(btrim(p_display_name), ''), v_existing_display_name, 'WriteWise student');

  if v_grade_level < 1 or v_grade_level > 12 then
    raise exception 'Grade level must be between 1 and 12'
      using errcode = '22023';
  end if;

  if v_language not in ('en', 'es', 'fr') then
    raise exception 'Unsupported language'
      using errcode = '22023';
  end if;

  insert into public.users (id, email, display_name, role, locale)
  values (
    v_user_id,
    coalesce(v_email, concat(v_user_id::text, '@writewise.local')::citext),
    v_display_name,
    'student',
    v_language
  )
  on conflict (id) do update
    set display_name = coalesce(nullif(btrim(p_display_name), ''), public.users.display_name, excluded.display_name),
        email = excluded.email,
        locale = coalesce(nullif(btrim(p_language), ''), public.users.locale, excluded.locale),
        updated_at = now();

  insert into public.student_profiles (
    user_id,
    grade_level,
    writing_goals,
    daily_goal_minutes,
    language
  )
  values (
    v_user_id,
    v_grade_level,
    array['improve_grammar', 'write_paragraphs']::text[],
    10,
    v_language
  )
  on conflict (user_id) do nothing;

  select sp.id
  into v_profile_id
  from public.student_profiles sp
  where sp.user_id = v_user_id;

  return v_profile_id;
end;
$$;

create or replace function public.get_own_student_profile_settings()
returns table (
  student_profile_id uuid,
  user_id uuid,
  display_name text,
  email text,
  grade_level smallint,
  writing_goals text[],
  daily_goal_minutes smallint,
  language text,
  learning_focus_note text,
  updated_at timestamptz
)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select
    sp.id as student_profile_id,
    u.id as user_id,
    u.display_name,
    u.email::text,
    sp.grade_level,
    sp.writing_goals,
    sp.daily_goal_minutes,
    sp.language,
    sp.learning_focus_note,
    greatest(u.updated_at, sp.updated_at) as updated_at
  from public.student_profiles sp
  join public.users u on u.id = sp.user_id
  where sp.user_id = auth.uid()
$$;

create or replace function public.upsert_own_student_profile_settings(
  p_display_name text,
  p_grade_level smallint,
  p_writing_goals text[],
  p_daily_goal_minutes smallint,
  p_language text,
  p_learning_focus_note text default ''
)
returns table (
  student_profile_id uuid,
  user_id uuid,
  display_name text,
  email text,
  grade_level smallint,
  writing_goals text[],
  daily_goal_minutes smallint,
  language text,
  learning_focus_note text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile_id uuid;
  v_display_name text := nullif(btrim(p_display_name), '');
  v_language text := coalesce(nullif(btrim(p_language), ''), 'en');
  v_learning_focus_note text := coalesce(p_learning_focus_note, '');
begin
  if v_user_id is null then
    raise exception 'Authentication required'
      using errcode = '28000';
  end if;

  if v_display_name is null then
    raise exception 'Display name is required'
      using errcode = '22023';
  end if;

  if p_grade_level < 1 or p_grade_level > 12 then
    raise exception 'Grade level must be between 1 and 12'
      using errcode = '22023';
  end if;

  if p_daily_goal_minutes not in (5, 10, 15, 20, 30) then
    raise exception 'Daily goal minutes are not supported'
      using errcode = '22023';
  end if;

  if v_language not in ('en', 'es', 'fr') then
    raise exception 'Unsupported language'
      using errcode = '22023';
  end if;

  if char_length(v_learning_focus_note) > 500 then
    raise exception 'Learning focus note is too long'
      using errcode = '22023';
  end if;

  if not (
    coalesce(p_writing_goals, '{}'::text[]) <@ array[
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
  ) then
    raise exception 'Writing goals contain unsupported values'
      using errcode = '22023';
  end if;

  v_profile_id := public.ensure_own_student_profile(v_display_name, p_grade_level, v_language);

  update public.users
  set display_name = v_display_name,
      locale = v_language,
      updated_at = now()
  where id = v_user_id;

  update public.student_profiles
  set grade_level = p_grade_level,
      writing_goals = coalesce(p_writing_goals, '{}'::text[]),
      daily_goal_minutes = p_daily_goal_minutes,
      language = v_language,
      learning_focus_note = v_learning_focus_note,
      updated_at = now()
  where id = v_profile_id
    and user_id = v_user_id;

  return query
  select *
  from public.get_own_student_profile_settings();
end;
$$;

create or replace function public.get_own_notification_preferences()
returns table (
  student_profile_id uuid,
  enabled boolean,
  timezone text,
  daily_assignment_enabled boolean,
  daily_assignment_time text,
  streak_enabled boolean,
  streak_time text,
  incomplete_assignment_enabled boolean,
  incomplete_assignment_time text,
  weekly_report_enabled boolean,
  weekly_report_time text,
  weekly_report_weekday text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile_id uuid;
begin
  v_profile_id := public.ensure_own_student_profile(null, null, null);

  insert into public.notification_preferences (student_profile_id)
  values (v_profile_id)
  on conflict (student_profile_id) do nothing;

  return query
  select
    np.student_profile_id,
    np.enabled,
    np.timezone,
    np.daily_assignment_enabled,
    np.daily_assignment_time,
    np.streak_enabled,
    np.streak_time,
    np.incomplete_assignment_enabled,
    np.incomplete_assignment_time,
    np.weekly_report_enabled,
    np.weekly_report_time,
    np.weekly_report_weekday,
    np.updated_at
  from public.notification_preferences np
  where np.student_profile_id = v_profile_id;
end;
$$;

create or replace function public.upsert_own_notification_preferences(
  p_enabled boolean,
  p_timezone text,
  p_daily_assignment_enabled boolean,
  p_daily_assignment_time text,
  p_streak_enabled boolean,
  p_streak_time text,
  p_incomplete_assignment_enabled boolean,
  p_incomplete_assignment_time text,
  p_weekly_report_enabled boolean,
  p_weekly_report_time text,
  p_weekly_report_weekday text
)
returns table (
  student_profile_id uuid,
  enabled boolean,
  timezone text,
  daily_assignment_enabled boolean,
  daily_assignment_time text,
  streak_enabled boolean,
  streak_time text,
  incomplete_assignment_enabled boolean,
  incomplete_assignment_time text,
  weekly_report_enabled boolean,
  weekly_report_time text,
  weekly_report_weekday text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile_id uuid;
  v_timezone text := coalesce(nullif(btrim(p_timezone), ''), 'UTC');
  v_weekday text := coalesce(nullif(btrim(p_weekly_report_weekday), ''), 'sunday');
begin
  if not (
    p_daily_assignment_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    and p_streak_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    and p_incomplete_assignment_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    and p_weekly_report_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
  ) then
    raise exception 'Notification times must use HH:MM format'
      using errcode = '22023';
  end if;

  if v_weekday not in ('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday') then
    raise exception 'Unsupported weekly report weekday'
      using errcode = '22023';
  end if;

  v_profile_id := public.ensure_own_student_profile(null, null, null);

  insert into public.notification_preferences (
    student_profile_id,
    enabled,
    timezone,
    daily_assignment_enabled,
    daily_assignment_time,
    streak_enabled,
    streak_time,
    incomplete_assignment_enabled,
    incomplete_assignment_time,
    weekly_report_enabled,
    weekly_report_time,
    weekly_report_weekday
  )
  values (
    v_profile_id,
    coalesce(p_enabled, true),
    v_timezone,
    coalesce(p_daily_assignment_enabled, true),
    p_daily_assignment_time,
    coalesce(p_streak_enabled, true),
    p_streak_time,
    coalesce(p_incomplete_assignment_enabled, true),
    p_incomplete_assignment_time,
    coalesce(p_weekly_report_enabled, true),
    p_weekly_report_time,
    v_weekday
  )
  on conflict (student_profile_id) do update
    set enabled = excluded.enabled,
        timezone = excluded.timezone,
        daily_assignment_enabled = excluded.daily_assignment_enabled,
        daily_assignment_time = excluded.daily_assignment_time,
        streak_enabled = excluded.streak_enabled,
        streak_time = excluded.streak_time,
        incomplete_assignment_enabled = excluded.incomplete_assignment_enabled,
        incomplete_assignment_time = excluded.incomplete_assignment_time,
        weekly_report_enabled = excluded.weekly_report_enabled,
        weekly_report_time = excluded.weekly_report_time,
        weekly_report_weekday = excluded.weekly_report_weekday,
        updated_at = now();

  return query
  select *
  from public.get_own_notification_preferences();
end;
$$;

revoke all on function public.ensure_own_student_profile(text, smallint, text) from public;
revoke all on function public.get_own_student_profile_settings() from public;
revoke all on function public.upsert_own_student_profile_settings(text, smallint, text[], smallint, text, text) from public;
revoke all on function public.get_own_notification_preferences() from public;
revoke all on function public.upsert_own_notification_preferences(
  boolean,
  text,
  boolean,
  text,
  boolean,
  text,
  boolean,
  text,
  boolean,
  text,
  text
) from public;

grant execute on function public.ensure_own_student_profile(text, smallint, text) to authenticated;
grant execute on function public.get_own_student_profile_settings() to authenticated;
grant execute on function public.upsert_own_student_profile_settings(text, smallint, text[], smallint, text, text) to authenticated;
grant execute on function public.get_own_notification_preferences() to authenticated;
grant execute on function public.upsert_own_notification_preferences(
  boolean,
  text,
  boolean,
  text,
  boolean,
  text,
  boolean,
  text,
  boolean,
  text,
  text
) to authenticated;
