-- Persist AI review-job lifecycle states through a backend-only workflow RPC.
-- The submission workflow queues the first job; this function moves active
-- jobs into processing, failed, or safety-blocked states durably.

create or replace function public.writerhabit_transition_review_job_workflow(
  p_submission_id uuid,
  p_student_profile_id uuid,
  p_transition text,
  p_idempotency_key text,
  p_safety_flags text[],
  p_failure_code text
)
returns table (
  id uuid,
  submission_id uuid,
  student_profile_id uuid,
  status text,
  idempotency_key text,
  safety_flags text[],
  queued_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  failure_code text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job public.review_jobs%rowtype;
  v_now timestamptz := now();
  v_submission public.submissions%rowtype;
begin
  if p_transition not in ('start_review', 'fail_review', 'safety_block_review') then
    raise exception 'workflow_state_transition_invalid: unknown review transition %', p_transition;
  end if;

  if btrim(coalesce(p_idempotency_key, '')) = '' then
    raise exception 'workflow_state_transition_invalid: blank review idempotency key';
  end if;

  select *
  into v_submission
  from public.submissions
  where submissions.id = p_submission_id;

  if not found or v_submission.student_profile_id <> p_student_profile_id then
    raise exception 'workflow_resource_missing: submission';
  end if;

  if p_transition = 'start_review' then
    select *
    into v_job
    from public.review_jobs
    where review_jobs.submission_id = p_submission_id
      and review_jobs.status in ('queued', 'processing')
    order by review_jobs.queued_at desc
    limit 1
    for update;

    if not found then
      select *
      into v_job
      from public.review_jobs
      where review_jobs.submission_id = p_submission_id
        and review_jobs.idempotency_key = p_idempotency_key
      for update;

      if not found then
        insert into public.review_jobs (
          submission_id,
          student_profile_id,
          status,
          idempotency_key,
          queued_at
        )
        values (
          p_submission_id,
          p_student_profile_id,
          'queued',
          p_idempotency_key,
          v_now
        )
        returning *
        into v_job;
      end if;
    end if;

    if v_job.status not in ('queued', 'processing') then
      raise exception 'workflow_state_transition_invalid: start_review from %', v_job.status;
    end if;

    update public.review_jobs
    set status = 'processing',
        started_at = coalesce(started_at, v_now),
        completed_at = null,
        failed_at = null,
        failure_code = null,
        safety_flags = '{}'::text[]
    where review_jobs.id = v_job.id
    returning *
    into v_job;
  else
    select *
    into v_job
    from public.review_jobs
    where review_jobs.submission_id = p_submission_id
      and review_jobs.status in ('queued', 'processing')
    order by review_jobs.queued_at desc
    limit 1
    for update;

    if not found then
      select *
      into v_job
      from public.review_jobs
      where review_jobs.submission_id = p_submission_id
        and review_jobs.idempotency_key = p_idempotency_key
      for update;
    end if;

    if not found then
      raise exception 'workflow_resource_missing: review_job';
    end if;

    if v_job.status not in ('queued', 'processing') then
      raise exception 'workflow_state_transition_invalid: % from %', p_transition, v_job.status;
    end if;

    update public.review_jobs
    set status = case
          when p_transition = 'safety_block_review' then 'safety_blocked'
          else 'failed'
        end,
        started_at = coalesce(started_at, v_now),
        failed_at = v_now,
        failure_code = coalesce(p_failure_code, case
          when p_transition = 'safety_block_review' then 'ai_safety.blocked'
          else 'ai.review_failed'
        end),
        safety_flags = coalesce(p_safety_flags, '{}'::text[])
    where review_jobs.id = v_job.id
    returning *
    into v_job;
  end if;

  return query
  select
    v_job.id,
    v_job.submission_id,
    v_job.student_profile_id,
    v_job.status,
    v_job.idempotency_key,
    v_job.safety_flags,
    v_job.queued_at,
    v_job.started_at,
    v_job.completed_at,
    v_job.failed_at,
    v_job.failure_code,
    v_job.created_at;
end;
$$;

revoke all on function public.writerhabit_transition_review_job_workflow(
  uuid,
  uuid,
  text,
  text,
  text[],
  text
) from public, anon, authenticated;

grant execute on function public.writerhabit_transition_review_job_workflow(
  uuid,
  uuid,
  text,
  text,
  text[],
  text
) to service_role;
