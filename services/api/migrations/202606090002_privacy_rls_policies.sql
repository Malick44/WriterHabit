-- WriterHabit AI privacy and RLS draft.
-- Requires the schema from 202606090001_initial_WriterHabit_schema.sql.

create or replace function public.current_user_role()
returns text
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select u.role
  from public.users u
  where u.id = (select auth.uid())
$$;

create or replace function public.is_WriterHabit_admin()
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select coalesce(public.current_user_role() = 'admin', false)
$$;

create or replace function public.is_student_owner(target_student_profile_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1
    from public.student_profiles sp
    where sp.id = target_student_profile_id
      and sp.user_id = (select auth.uid())
  )
$$;

create or replace function public.is_parent_for_student(target_student_profile_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1
    from public.parent_student_links psl
    where psl.student_profile_id = target_student_profile_id
      and psl.parent_user_id = (select auth.uid())
      and psl.status = 'active'
  )
$$;

create or replace function public.is_teacher_for_class(target_class_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1
    from public.classes c
    join public.teacher_profiles tp on tp.id = c.teacher_profile_id
    where c.id = target_class_id
      and c.status = 'active'
      and tp.user_id = (select auth.uid())
  )
$$;

create or replace function public.is_teacher_for_student(target_student_profile_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1
    from public.class_students cs
    join public.classes c on c.id = cs.class_id
    join public.teacher_profiles tp on tp.id = c.teacher_profile_id
    where cs.student_profile_id = target_student_profile_id
      and cs.status = 'active'
      and c.status = 'active'
      and tp.user_id = (select auth.uid())
  )
$$;

create or replace function public.is_student_in_class(target_class_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1
    from public.class_students cs
    join public.student_profiles sp on sp.id = cs.student_profile_id
    where cs.class_id = target_class_id
      and cs.status = 'active'
      and sp.user_id = (select auth.uid())
  )
$$;

create or replace function public.can_read_student(target_student_profile_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select
    public.is_WriterHabit_admin()
    or public.is_student_owner(target_student_profile_id)
    or public.is_parent_for_student(target_student_profile_id)
    or public.is_teacher_for_student(target_student_profile_id)
$$;

create or replace function public.can_read_class(target_class_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select
    public.is_WriterHabit_admin()
    or public.is_teacher_for_class(target_class_id)
    or public.is_student_in_class(target_class_id)
    or exists (
      select 1
      from public.class_students cs
      where cs.class_id = target_class_id
        and cs.status = 'active'
        and public.is_parent_for_student(cs.student_profile_id)
    )
$$;

create or replace function public.can_read_assignment(target_assignment_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1
    from public.assignments a
    where a.id = target_assignment_id
      and (
        public.is_WriterHabit_admin()
        or a.created_by_user_id = (select auth.uid())
        or (a.status = 'published' and a.class_id is null)
        or (a.class_id is not null and public.can_read_class(a.class_id))
        or exists (
          select 1
          from public.student_assignments sa
          where sa.assignment_id = a.id
            and public.can_read_student(sa.student_profile_id)
        )
      )
  )
$$;

create or replace function public.can_read_submission(target_submission_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1
    from public.submissions s
    where s.id = target_submission_id
      and public.can_read_student(s.student_profile_id)
  )
$$;

create or replace function public.can_read_feedback(target_feedback_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1
    from public.feedback f
    where f.id = target_feedback_id
      and public.can_read_student(f.student_profile_id)
  )
$$;

create or replace function public.can_read_canvas_document(target_canvas_document_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1
    from public.canvas_documents cd
    where cd.id = target_canvas_document_id
      and public.can_read_student(cd.student_profile_id)
  )
$$;

create or replace function public.can_teacher_comment_on_submission(target_submission_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1
    from public.submissions s
    where s.id = target_submission_id
      and public.is_teacher_for_student(s.student_profile_id)
  )
$$;

revoke all on function public.current_user_role() from public;
revoke all on function public.is_WriterHabit_admin() from public;
revoke all on function public.is_student_owner(uuid) from public;
revoke all on function public.is_parent_for_student(uuid) from public;
revoke all on function public.is_teacher_for_class(uuid) from public;
revoke all on function public.is_teacher_for_student(uuid) from public;
revoke all on function public.is_student_in_class(uuid) from public;
revoke all on function public.can_read_student(uuid) from public;
revoke all on function public.can_read_class(uuid) from public;
revoke all on function public.can_read_assignment(uuid) from public;
revoke all on function public.can_read_submission(uuid) from public;
revoke all on function public.can_read_feedback(uuid) from public;
revoke all on function public.can_read_canvas_document(uuid) from public;
revoke all on function public.can_teacher_comment_on_submission(uuid) from public;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_WriterHabit_admin() to authenticated;
grant execute on function public.is_student_owner(uuid) to authenticated;
grant execute on function public.is_parent_for_student(uuid) to authenticated;
grant execute on function public.is_teacher_for_class(uuid) to authenticated;
grant execute on function public.is_teacher_for_student(uuid) to authenticated;
grant execute on function public.is_student_in_class(uuid) to authenticated;
grant execute on function public.can_read_student(uuid) to authenticated;
grant execute on function public.can_read_class(uuid) to authenticated;
grant execute on function public.can_read_assignment(uuid) to authenticated;
grant execute on function public.can_read_submission(uuid) to authenticated;
grant execute on function public.can_read_feedback(uuid) to authenticated;
grant execute on function public.can_read_canvas_document(uuid) to authenticated;
grant execute on function public.can_teacher_comment_on_submission(uuid) to authenticated;

alter table public.users enable row level security;
alter table public.users force row level security;
alter table public.student_profiles enable row level security;
alter table public.student_profiles force row level security;
alter table public.parent_profiles enable row level security;
alter table public.parent_profiles force row level security;
alter table public.parent_settings enable row level security;
alter table public.parent_settings force row level security;
alter table public.parent_student_links enable row level security;
alter table public.parent_student_links force row level security;
alter table public.teacher_profiles enable row level security;
alter table public.teacher_profiles force row level security;
alter table public.classes enable row level security;
alter table public.classes force row level security;
alter table public.class_students enable row level security;
alter table public.class_students force row level security;
alter table public.rubrics enable row level security;
alter table public.rubrics force row level security;
alter table public.rubric_criteria enable row level security;
alter table public.rubric_criteria force row level security;
alter table public.assignments enable row level security;
alter table public.assignments force row level security;
alter table public.student_assignments enable row level security;
alter table public.student_assignments force row level security;
alter table public.writing_drafts enable row level security;
alter table public.writing_drafts force row level security;
alter table public.submissions enable row level security;
alter table public.submissions force row level security;
alter table public.submission_contents enable row level security;
alter table public.submission_contents force row level security;
alter table public.canvas_documents enable row level security;
alter table public.canvas_documents force row level security;
alter table public.canvas_document_contents enable row level security;
alter table public.canvas_document_contents force row level security;
alter table public.submission_canvas_documents enable row level security;
alter table public.submission_canvas_documents force row level security;
alter table public.review_jobs enable row level security;
alter table public.review_jobs force row level security;
alter table public.feedback enable row level security;
alter table public.feedback force row level security;
alter table public.revision_tasks enable row level security;
alter table public.revision_tasks force row level security;
alter table public.feedback_rubric_scores enable row level security;
alter table public.feedback_rubric_scores force row level security;
alter table public.grammar_suggestions enable row level security;
alter table public.grammar_suggestions force row level security;
alter table public.submission_revisions enable row level security;
alter table public.submission_revisions force row level security;
alter table public.teacher_submission_comments enable row level security;
alter table public.teacher_submission_comments force row level security;
alter table public.ai_coach_interactions enable row level security;
alter table public.ai_coach_interactions force row level security;
alter table public.student_progress_totals enable row level security;
alter table public.student_progress_totals force row level security;
alter table public.student_skill_progress enable row level security;
alter table public.student_skill_progress force row level security;
alter table public.student_activity_days enable row level security;
alter table public.student_activity_days force row level security;
alter table public.weekly_reviews enable row level security;
alter table public.weekly_reviews force row level security;
alter table public.badges enable row level security;
alter table public.badges force row level security;
alter table public.student_badges enable row level security;
alter table public.student_badges force row level security;
alter table public.entitlements enable row level security;
alter table public.entitlements force row level security;
alter table public.entitlement_provider_events enable row level security;
alter table public.entitlement_provider_events force row level security;
alter table public.notification_preferences enable row level security;
alter table public.notification_preferences force row level security;
alter table public.notification_devices enable row level security;
alter table public.notification_devices force row level security;
alter table public.prepared_notifications enable row level security;
alter table public.prepared_notifications force row level security;
alter table public.audit_logs enable row level security;
alter table public.audit_logs force row level security;

drop policy if exists users_select_self_or_admin on public.users;
create policy users_select_self_or_admin on public.users
for select to authenticated
using (id = (select auth.uid()) or public.is_WriterHabit_admin());

drop policy if exists users_admin_all on public.users;
create policy users_admin_all on public.users
for all to authenticated
using (public.is_WriterHabit_admin())
with check (public.is_WriterHabit_admin());

drop policy if exists student_profiles_select_visible on public.student_profiles;
create policy student_profiles_select_visible on public.student_profiles
for select to authenticated
using (public.can_read_student(id));

drop policy if exists student_profiles_student_update_own on public.student_profiles;
create policy student_profiles_student_update_own on public.student_profiles
for update to authenticated
using (public.is_student_owner(id))
with check (public.is_student_owner(id));

drop policy if exists student_profiles_admin_all on public.student_profiles;
create policy student_profiles_admin_all on public.student_profiles
for all to authenticated
using (public.is_WriterHabit_admin())
with check (public.is_WriterHabit_admin());

drop policy if exists parent_profiles_owner_select_update on public.parent_profiles;
create policy parent_profiles_owner_select_update on public.parent_profiles
for all to authenticated
using (user_id = (select auth.uid()) or public.is_WriterHabit_admin())
with check (user_id = (select auth.uid()) or public.is_WriterHabit_admin());

drop policy if exists parent_settings_owner_select_update on public.parent_settings;
create policy parent_settings_owner_select_update on public.parent_settings
for all to authenticated
using (parent_user_id = (select auth.uid()) or public.is_WriterHabit_admin())
with check (parent_user_id = (select auth.uid()) or public.is_WriterHabit_admin());

drop policy if exists parent_student_links_select_visible on public.parent_student_links;
create policy parent_student_links_select_visible on public.parent_student_links
for select to authenticated
using (
  parent_user_id = (select auth.uid())
  or public.is_student_owner(student_profile_id)
  or public.is_WriterHabit_admin()
);

drop policy if exists parent_student_links_parent_accept on public.parent_student_links;
create policy parent_student_links_parent_accept on public.parent_student_links
for update to authenticated
using (parent_user_id = (select auth.uid()))
with check (parent_user_id = (select auth.uid()));

drop policy if exists parent_student_links_admin_all on public.parent_student_links;
create policy parent_student_links_admin_all on public.parent_student_links
for all to authenticated
using (public.is_WriterHabit_admin())
with check (public.is_WriterHabit_admin());

drop policy if exists teacher_profiles_owner_select_update on public.teacher_profiles;
create policy teacher_profiles_owner_select_update on public.teacher_profiles
for all to authenticated
using (user_id = (select auth.uid()) or public.is_WriterHabit_admin())
with check (user_id = (select auth.uid()) or public.is_WriterHabit_admin());

drop policy if exists classes_select_visible on public.classes;
create policy classes_select_visible on public.classes
for select to authenticated
using (public.can_read_class(id));

drop policy if exists classes_teacher_manage on public.classes;
create policy classes_teacher_manage on public.classes
for all to authenticated
using (public.is_teacher_for_class(id) or public.is_WriterHabit_admin())
with check (
  public.is_WriterHabit_admin()
  or exists (
    select 1
    from public.teacher_profiles tp
    where tp.id = teacher_profile_id
      and tp.user_id = (select auth.uid())
  )
);

drop policy if exists class_students_select_visible on public.class_students;
create policy class_students_select_visible on public.class_students
for select to authenticated
using (public.can_read_class(class_id));

drop policy if exists class_students_teacher_manage on public.class_students;
create policy class_students_teacher_manage on public.class_students
for all to authenticated
using (public.is_teacher_for_class(class_id) or public.is_WriterHabit_admin())
with check (public.is_teacher_for_class(class_id) or public.is_WriterHabit_admin());

drop policy if exists rubrics_select_available on public.rubrics;
create policy rubrics_select_available on public.rubrics
for select to authenticated
using (status = 'active' or created_by_user_id = (select auth.uid()) or public.is_WriterHabit_admin());

drop policy if exists rubrics_creator_manage on public.rubrics;
create policy rubrics_creator_manage on public.rubrics
for all to authenticated
using (created_by_user_id = (select auth.uid()) or public.is_WriterHabit_admin())
with check (created_by_user_id = (select auth.uid()) or public.is_WriterHabit_admin());

drop policy if exists rubric_criteria_select_available on public.rubric_criteria;
create policy rubric_criteria_select_available on public.rubric_criteria
for select to authenticated
using (
  exists (
    select 1
    from public.rubrics r
    where r.id = rubric_id
      and (r.status = 'active' or r.created_by_user_id = (select auth.uid()) or public.is_WriterHabit_admin())
  )
);

drop policy if exists rubric_criteria_creator_manage on public.rubric_criteria;
create policy rubric_criteria_creator_manage on public.rubric_criteria
for all to authenticated
using (
  public.is_WriterHabit_admin()
  or exists (
    select 1
    from public.rubrics r
    where r.id = rubric_id
      and r.created_by_user_id = (select auth.uid())
  )
)
with check (
  public.is_WriterHabit_admin()
  or exists (
    select 1
    from public.rubrics r
    where r.id = rubric_id
      and r.created_by_user_id = (select auth.uid())
  )
);

drop policy if exists assignments_select_visible on public.assignments;
create policy assignments_select_visible on public.assignments
for select to authenticated
using (public.can_read_assignment(id));

drop policy if exists assignments_creator_manage on public.assignments;
create policy assignments_creator_manage on public.assignments
for all to authenticated
using (created_by_user_id = (select auth.uid()) or public.is_WriterHabit_admin())
with check (
  public.is_WriterHabit_admin()
  or (
    created_by_user_id = (select auth.uid())
    and (class_id is null or public.is_teacher_for_class(class_id))
  )
);

drop policy if exists student_assignments_select_visible on public.student_assignments;
create policy student_assignments_select_visible on public.student_assignments
for select to authenticated
using (public.can_read_student(student_profile_id));

drop policy if exists student_assignments_student_or_teacher_manage on public.student_assignments;
create policy student_assignments_student_or_teacher_manage on public.student_assignments
for all to authenticated
using (
  public.is_student_owner(student_profile_id)
  or (class_id is not null and public.is_teacher_for_class(class_id))
  or public.is_WriterHabit_admin()
)
with check (
  public.is_student_owner(student_profile_id)
  or (class_id is not null and public.is_teacher_for_class(class_id))
  or public.is_WriterHabit_admin()
);

drop policy if exists writing_drafts_owner_all on public.writing_drafts;
create policy writing_drafts_owner_all on public.writing_drafts
for all to authenticated
using (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin())
with check (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin());

drop policy if exists submissions_select_visible_summary on public.submissions;
create policy submissions_select_visible_summary on public.submissions
for select to authenticated
using (public.can_read_student(student_profile_id));

drop policy if exists submissions_owner_manage on public.submissions;
create policy submissions_owner_manage on public.submissions
for all to authenticated
using (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin())
with check (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin());

drop policy if exists submission_contents_owner_all on public.submission_contents;
create policy submission_contents_owner_all on public.submission_contents
for all to authenticated
using (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin())
with check (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin());

drop policy if exists canvas_documents_select_visible_summary on public.canvas_documents;
create policy canvas_documents_select_visible_summary on public.canvas_documents
for select to authenticated
using (public.can_read_student(student_profile_id));

drop policy if exists canvas_documents_owner_manage on public.canvas_documents;
create policy canvas_documents_owner_manage on public.canvas_documents
for all to authenticated
using (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin())
with check (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin());

drop policy if exists canvas_document_contents_owner_all on public.canvas_document_contents;
create policy canvas_document_contents_owner_all on public.canvas_document_contents
for all to authenticated
using (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin())
with check (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin());

drop policy if exists submission_canvas_documents_select_visible on public.submission_canvas_documents;
create policy submission_canvas_documents_select_visible on public.submission_canvas_documents
for select to authenticated
using (public.can_read_submission(submission_id));

drop policy if exists submission_canvas_documents_owner_manage on public.submission_canvas_documents;
create policy submission_canvas_documents_owner_manage on public.submission_canvas_documents
for all to authenticated
using (
  public.is_WriterHabit_admin()
  or exists (
    select 1
    from public.submissions s
    where s.id = submission_id
      and public.is_student_owner(s.student_profile_id)
  )
)
with check (
  public.is_WriterHabit_admin()
  or exists (
    select 1
    from public.submissions s
    where s.id = submission_id
      and public.is_student_owner(s.student_profile_id)
  )
);

drop policy if exists review_jobs_owner_select on public.review_jobs;
create policy review_jobs_owner_select on public.review_jobs
for select to authenticated
using (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin());

drop policy if exists review_jobs_owner_manage on public.review_jobs;
create policy review_jobs_owner_manage on public.review_jobs
for all to authenticated
using (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin())
with check (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin());

drop policy if exists feedback_select_visible on public.feedback;
create policy feedback_select_visible on public.feedback
for select to authenticated
using (public.can_read_student(student_profile_id));

drop policy if exists feedback_admin_manage on public.feedback;
create policy feedback_admin_manage on public.feedback
for all to authenticated
using (public.is_WriterHabit_admin())
with check (public.is_WriterHabit_admin());

drop policy if exists revision_tasks_select_visible on public.revision_tasks;
create policy revision_tasks_select_visible on public.revision_tasks
for select to authenticated
using (public.can_read_feedback(feedback_id));

drop policy if exists revision_tasks_admin_manage on public.revision_tasks;
create policy revision_tasks_admin_manage on public.revision_tasks
for all to authenticated
using (public.is_WriterHabit_admin())
with check (public.is_WriterHabit_admin());

drop policy if exists feedback_rubric_scores_select_visible on public.feedback_rubric_scores;
create policy feedback_rubric_scores_select_visible on public.feedback_rubric_scores
for select to authenticated
using (public.can_read_feedback(feedback_id));

drop policy if exists feedback_rubric_scores_admin_manage on public.feedback_rubric_scores;
create policy feedback_rubric_scores_admin_manage on public.feedback_rubric_scores
for all to authenticated
using (public.is_WriterHabit_admin())
with check (public.is_WriterHabit_admin());

drop policy if exists grammar_suggestions_select_visible on public.grammar_suggestions;
create policy grammar_suggestions_select_visible on public.grammar_suggestions
for select to authenticated
using (public.can_read_feedback(feedback_id));

drop policy if exists grammar_suggestions_admin_manage on public.grammar_suggestions;
create policy grammar_suggestions_admin_manage on public.grammar_suggestions
for all to authenticated
using (public.is_WriterHabit_admin())
with check (public.is_WriterHabit_admin());

drop policy if exists submission_revisions_select_visible on public.submission_revisions;
create policy submission_revisions_select_visible on public.submission_revisions
for select to authenticated
using (public.can_read_submission(submission_id));

drop policy if exists submission_revisions_owner_manage on public.submission_revisions;
create policy submission_revisions_owner_manage on public.submission_revisions
for all to authenticated
using (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin())
with check (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin());

drop policy if exists teacher_submission_comments_select_visible on public.teacher_submission_comments;
create policy teacher_submission_comments_select_visible on public.teacher_submission_comments
for select to authenticated
using (public.can_read_submission(submission_id));

drop policy if exists teacher_submission_comments_teacher_insert on public.teacher_submission_comments;
create policy teacher_submission_comments_teacher_insert on public.teacher_submission_comments
for insert to authenticated
with check (
  public.can_teacher_comment_on_submission(submission_id)
  and exists (
    select 1
    from public.teacher_profiles tp
    where tp.id = teacher_profile_id
      and tp.user_id = (select auth.uid())
  )
);

drop policy if exists teacher_submission_comments_teacher_update on public.teacher_submission_comments;
create policy teacher_submission_comments_teacher_update on public.teacher_submission_comments
for update to authenticated
using (
  public.is_WriterHabit_admin()
  or exists (
    select 1
    from public.teacher_profiles tp
    where tp.id = teacher_profile_id
      and tp.user_id = (select auth.uid())
  )
)
with check (
  public.is_WriterHabit_admin()
  or exists (
    select 1
    from public.teacher_profiles tp
    where tp.id = teacher_profile_id
      and tp.user_id = (select auth.uid())
  )
);

drop policy if exists ai_coach_interactions_owner_all on public.ai_coach_interactions;
create policy ai_coach_interactions_owner_all on public.ai_coach_interactions
for all to authenticated
using (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin())
with check (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin());

drop policy if exists student_progress_totals_select_visible on public.student_progress_totals;
create policy student_progress_totals_select_visible on public.student_progress_totals
for select to authenticated
using (public.can_read_student(student_profile_id));

drop policy if exists student_progress_totals_owner_or_admin_manage on public.student_progress_totals;
create policy student_progress_totals_owner_or_admin_manage on public.student_progress_totals
for all to authenticated
using (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin())
with check (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin());

drop policy if exists student_skill_progress_select_visible on public.student_skill_progress;
create policy student_skill_progress_select_visible on public.student_skill_progress
for select to authenticated
using (public.can_read_student(student_profile_id));

drop policy if exists student_skill_progress_owner_or_admin_manage on public.student_skill_progress;
create policy student_skill_progress_owner_or_admin_manage on public.student_skill_progress
for all to authenticated
using (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin())
with check (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin());

drop policy if exists student_activity_days_select_visible on public.student_activity_days;
create policy student_activity_days_select_visible on public.student_activity_days
for select to authenticated
using (public.can_read_student(student_profile_id));

drop policy if exists student_activity_days_owner_or_admin_manage on public.student_activity_days;
create policy student_activity_days_owner_or_admin_manage on public.student_activity_days
for all to authenticated
using (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin())
with check (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin());

drop policy if exists weekly_reviews_select_visible on public.weekly_reviews;
create policy weekly_reviews_select_visible on public.weekly_reviews
for select to authenticated
using (public.can_read_student(student_profile_id));

drop policy if exists weekly_reviews_owner_or_admin_manage on public.weekly_reviews;
create policy weekly_reviews_owner_or_admin_manage on public.weekly_reviews
for all to authenticated
using (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin())
with check (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin());

drop policy if exists badges_select_active on public.badges;
create policy badges_select_active on public.badges
for select to authenticated
using (active or public.is_WriterHabit_admin());

drop policy if exists badges_admin_manage on public.badges;
create policy badges_admin_manage on public.badges
for all to authenticated
using (public.is_WriterHabit_admin())
with check (public.is_WriterHabit_admin());

drop policy if exists student_badges_select_visible on public.student_badges;
create policy student_badges_select_visible on public.student_badges
for select to authenticated
using (public.can_read_student(student_profile_id));

drop policy if exists student_badges_owner_or_admin_manage on public.student_badges;
create policy student_badges_owner_or_admin_manage on public.student_badges
for all to authenticated
using (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin())
with check (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin());

drop policy if exists entitlements_owner_select on public.entitlements;
create policy entitlements_owner_select on public.entitlements
for select to authenticated
using (owner_user_id = (select auth.uid()) or public.is_WriterHabit_admin());

drop policy if exists entitlements_admin_manage on public.entitlements;
create policy entitlements_admin_manage on public.entitlements
for all to authenticated
using (public.is_WriterHabit_admin())
with check (public.is_WriterHabit_admin());

drop policy if exists entitlement_provider_events_admin_all on public.entitlement_provider_events;
create policy entitlement_provider_events_admin_all on public.entitlement_provider_events
for all to authenticated
using (public.is_WriterHabit_admin())
with check (public.is_WriterHabit_admin());

drop policy if exists notification_preferences_select_visible on public.notification_preferences;
create policy notification_preferences_select_visible on public.notification_preferences
for select to authenticated
using (public.can_read_student(student_profile_id));

drop policy if exists notification_preferences_owner_or_parent_manage on public.notification_preferences;
create policy notification_preferences_owner_or_parent_manage on public.notification_preferences
for all to authenticated
using (
  public.is_student_owner(student_profile_id)
  or public.is_parent_for_student(student_profile_id)
  or public.is_WriterHabit_admin()
)
with check (
  public.is_student_owner(student_profile_id)
  or public.is_parent_for_student(student_profile_id)
  or public.is_WriterHabit_admin()
);

drop policy if exists notification_devices_owner_all on public.notification_devices;
create policy notification_devices_owner_all on public.notification_devices
for all to authenticated
using (user_id = (select auth.uid()) or public.is_WriterHabit_admin())
with check (user_id = (select auth.uid()) or public.is_WriterHabit_admin());

drop policy if exists prepared_notifications_select_visible on public.prepared_notifications;
create policy prepared_notifications_select_visible on public.prepared_notifications
for select to authenticated
using (public.can_read_student(student_profile_id));

drop policy if exists prepared_notifications_owner_or_admin_manage on public.prepared_notifications;
create policy prepared_notifications_owner_or_admin_manage on public.prepared_notifications
for all to authenticated
using (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin())
with check (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin());

drop policy if exists audit_logs_admin_all on public.audit_logs;
create policy audit_logs_admin_all on public.audit_logs
for all to authenticated
using (public.is_WriterHabit_admin())
with check (public.is_WriterHabit_admin());
