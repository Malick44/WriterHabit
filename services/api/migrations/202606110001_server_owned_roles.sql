-- WriterHabit AI server-owned role hardening.
-- Public clients may edit only safe self-profile fields. Role changes require
-- backend service-role/admin execution after invite, link, or operational review.

-- Some early development Supabase instances had auth.users triggers that copied
-- raw_user_meta_data.role into public.users.role. Keep those legacy trigger
-- functions safe if they exist: client-writable auth metadata may hydrate
-- display/profile hints, but it must never grant parent, teacher, or admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_email citext := coalesce(nullif(new.email, ''), concat(new.id::text, '@writerhabit.local'))::citext;
  v_display_name text := coalesce(
    nullif(btrim(v_metadata->>'display_name'), ''),
    nullif(btrim(v_metadata->>'full_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'WriterHabit student'
  );
  v_grade_level smallint := 7;
  v_daily_goal_minutes smallint := 10;
  v_writing_level text := 'getting_started';
  v_student_profile_id uuid;
  v_profile_role text;
begin
  if coalesce(v_metadata->>'grade_level', '') ~ '^[0-9]{1,2}$' then
    v_grade_level := (v_metadata->>'grade_level')::smallint;
  end if;

  if v_grade_level < 1 or v_grade_level > 12 then
    v_grade_level := 7;
  end if;

  if coalesce(v_metadata->>'daily_practice_minutes', '') ~ '^[0-9]{1,2}$' then
    v_daily_goal_minutes := (v_metadata->>'daily_practice_minutes')::smallint;
  end if;

  if v_daily_goal_minutes not in (5, 10, 15, 20, 30) then
    v_daily_goal_minutes := 10;
  end if;

  if v_metadata->>'confidence_level' in ('getting_started', 'building', 'steady', 'confident') then
    v_writing_level := v_metadata->>'confidence_level';
  end if;

  insert into public.users (id, email, display_name, role, locale)
  values (new.id, v_email, v_display_name, 'student', 'en')
  on conflict (id) do update
    set email = excluded.email,
        display_name = excluded.display_name,
        locale = public.users.locale,
        updated_at = now();

  select role
  into v_profile_role
  from public.users
  where id = new.id;

  if v_profile_role = 'student' then
    insert into public.student_profiles (
      user_id,
      grade_level,
      writing_goals,
      daily_goal_minutes,
      writing_level
    )
    values (
      new.id,
      v_grade_level,
      array[]::text[],
      v_daily_goal_minutes,
      v_writing_level
    )
    on conflict (user_id) do nothing;

    select id
    into v_student_profile_id
    from public.student_profiles
    where user_id = new.id;

    if v_student_profile_id is not null then
      insert into public.student_progress_totals (student_profile_id)
      values (v_student_profile_id)
      on conflict do nothing;
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.handle_user_update()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_email citext := coalesce(nullif(new.email, ''), concat(new.id::text, '@writerhabit.local'))::citext;
  v_display_name text := coalesce(
    nullif(btrim(v_metadata->>'display_name'), ''),
    nullif(btrim(v_metadata->>'full_name'), '')
  );
  v_grade_level smallint;
  v_daily_goal_minutes smallint;
  v_writing_level text;
  v_onboarding_complete boolean := false;
  v_goals_json jsonb := v_metadata->'writing_goals';
  v_writing_goals text[];
  v_student_profile_id uuid;
  v_profile_role text;
begin
  if coalesce(v_metadata->>'grade_level', '') ~ '^[0-9]{1,2}$' then
    v_grade_level := (v_metadata->>'grade_level')::smallint;
  end if;

  if v_grade_level is not null and (v_grade_level < 1 or v_grade_level > 12) then
    v_grade_level := null;
  end if;

  if coalesce(v_metadata->>'daily_practice_minutes', '') ~ '^[0-9]{1,2}$' then
    v_daily_goal_minutes := (v_metadata->>'daily_practice_minutes')::smallint;
  end if;

  if v_daily_goal_minutes is not null and v_daily_goal_minutes not in (5, 10, 15, 20, 30) then
    v_daily_goal_minutes := null;
  end if;

  if v_metadata->>'confidence_level' in ('getting_started', 'building', 'steady', 'confident') then
    v_writing_level := v_metadata->>'confidence_level';
  end if;

  if lower(coalesce(v_metadata->>'onboarding_complete', '')) in ('true', 't', '1', 'yes', 'on') then
    v_onboarding_complete := true;
  end if;

  if jsonb_typeof(v_goals_json) = 'array' then
    select coalesce(array_agg(goal), '{}'::text[])
    into v_writing_goals
    from jsonb_array_elements_text(v_goals_json) as goal
    where goal = any(array[
      'improve_spelling',
      'write_better_sentences',
      'write_paragraphs',
      'write_essays',
      'creative_writing',
      'test_prep',
      'improve_grammar',
      'school_assignments',
      'improve_handwriting'
    ]::text[]);
  end if;

  update public.users
  set email = v_email,
      display_name = coalesce(v_display_name, public.users.display_name),
      updated_at = now()
  where id = new.id;

  select role
  into v_profile_role
  from public.users
  where id = new.id;

  if v_profile_role = 'student' then
    insert into public.student_profiles (
      user_id,
      grade_level,
      writing_goals,
      daily_goal_minutes,
      writing_level,
      onboarding_completed_at
    )
    values (
      new.id,
      coalesce(v_grade_level, 7),
      coalesce(v_writing_goals, '{}'::text[]),
      coalesce(v_daily_goal_minutes, 10),
      coalesce(v_writing_level, 'getting_started'),
      case when v_onboarding_complete then now() else null end
    )
    on conflict (user_id) do update
      set grade_level = coalesce(v_grade_level, public.student_profiles.grade_level),
          writing_goals = coalesce(v_writing_goals, public.student_profiles.writing_goals),
          daily_goal_minutes = coalesce(v_daily_goal_minutes, public.student_profiles.daily_goal_minutes),
          writing_level = coalesce(v_writing_level, public.student_profiles.writing_level),
          onboarding_completed_at = case
            when v_onboarding_complete then coalesce(public.student_profiles.onboarding_completed_at, now())
            else public.student_profiles.onboarding_completed_at
          end,
          updated_at = now();

    select id
    into v_student_profile_id
    from public.student_profiles
    where user_id = new.id;

    if v_student_profile_id is not null then
      insert into public.student_progress_totals (student_profile_id)
      values (v_student_profile_id)
      on conflict do nothing;
    end if;
  end if;

  return new;
end;
$$;

drop policy if exists users_self_update_profile_fields on public.users;
create policy users_self_update_profile_fields on public.users
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create or replace function public.reject_client_user_role_change()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if old.role is distinct from new.role and current_user not in ('postgres', 'service_role', 'supabase_admin') then
    raise exception 'WriterHabit user role changes require backend approval'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists users_reject_client_role_change on public.users;
create trigger users_reject_client_role_change
before update of role on public.users
for each row execute function public.reject_client_user_role_change();
