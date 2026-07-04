-- Databases provisioned before the WriterHabit rename still constrain
-- entitlements.current_plan_id to the old writewise_plus_* ids; the API and
-- mobile clients only emit WriterHabit_plus_*.

update public.entitlements
set current_plan_id = replace(current_plan_id, 'writewise_plus_', 'WriterHabit_plus_')
where current_plan_id like 'writewise_plus_%';

alter table public.entitlements
  drop constraint if exists entitlements_current_plan_id_check;

alter table public.entitlements
  add constraint entitlements_current_plan_id_check check (
    current_plan_id is null or current_plan_id in ('WriterHabit_plus_monthly', 'WriterHabit_plus_yearly')
  );
