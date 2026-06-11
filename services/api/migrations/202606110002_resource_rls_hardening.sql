-- WriterHabit AI resource-level RLS hardening.
-- Keep authorized read paths for students, linked parents, and assigned
-- teachers, but require trusted backend/admin execution for relationship
-- changes and derived system-owned rows.

-- Parent/student links are server-owned until a reviewed invite/approval API
-- exists. Parents and students can still read visible link rows through the
-- select policy from 202606090002.
drop policy if exists parent_student_links_parent_accept on public.parent_student_links;

-- Class roster membership grants teacher visibility into student work, so
-- roster changes must go through audited backend/admin workflows.
drop policy if exists class_students_teacher_manage on public.class_students;
drop policy if exists class_students_admin_all on public.class_students;
create policy class_students_admin_all on public.class_students
for all to authenticated
using (public.is_WriterHabit_admin())
with check (public.is_WriterHabit_admin());

-- AI coach interaction rows are backend-owned audit/usage records. Students can
-- read their own interaction history, but public clients cannot forge logs.
drop policy if exists ai_coach_interactions_owner_all on public.ai_coach_interactions;
drop policy if exists ai_coach_interactions_owner_select on public.ai_coach_interactions;
create policy ai_coach_interactions_owner_select on public.ai_coach_interactions
for select to authenticated
using (public.is_student_owner(student_profile_id) or public.is_WriterHabit_admin());

drop policy if exists ai_coach_interactions_admin_manage on public.ai_coach_interactions;
create policy ai_coach_interactions_admin_manage on public.ai_coach_interactions
for all to authenticated
using (public.is_WriterHabit_admin())
with check (public.is_WriterHabit_admin());

-- AI review jobs and feedback-derived rows are system transitions. Students
-- request review through the backend; the backend/service role writes jobs and
-- review output after safety checks.
drop policy if exists review_jobs_owner_manage on public.review_jobs;
drop policy if exists review_jobs_admin_manage on public.review_jobs;
create policy review_jobs_admin_manage on public.review_jobs
for all to authenticated
using (public.is_WriterHabit_admin())
with check (public.is_WriterHabit_admin());

-- Progress, weekly review, badge, and prepared-notification rows are derived
-- from backend-observed student activity. Public clients may read authorized
-- rows through select policies, but cannot mutate derived state.
drop policy if exists student_progress_totals_owner_or_admin_manage on public.student_progress_totals;
drop policy if exists student_progress_totals_admin_manage on public.student_progress_totals;
create policy student_progress_totals_admin_manage on public.student_progress_totals
for all to authenticated
using (public.is_WriterHabit_admin())
with check (public.is_WriterHabit_admin());

drop policy if exists student_skill_progress_owner_or_admin_manage on public.student_skill_progress;
drop policy if exists student_skill_progress_admin_manage on public.student_skill_progress;
create policy student_skill_progress_admin_manage on public.student_skill_progress
for all to authenticated
using (public.is_WriterHabit_admin())
with check (public.is_WriterHabit_admin());

drop policy if exists student_activity_days_owner_or_admin_manage on public.student_activity_days;
drop policy if exists student_activity_days_admin_manage on public.student_activity_days;
create policy student_activity_days_admin_manage on public.student_activity_days
for all to authenticated
using (public.is_WriterHabit_admin())
with check (public.is_WriterHabit_admin());

drop policy if exists weekly_reviews_owner_or_admin_manage on public.weekly_reviews;
drop policy if exists weekly_reviews_admin_manage on public.weekly_reviews;
create policy weekly_reviews_admin_manage on public.weekly_reviews
for all to authenticated
using (public.is_WriterHabit_admin())
with check (public.is_WriterHabit_admin());

drop policy if exists student_badges_owner_or_admin_manage on public.student_badges;
drop policy if exists student_badges_admin_manage on public.student_badges;
create policy student_badges_admin_manage on public.student_badges
for all to authenticated
using (public.is_WriterHabit_admin())
with check (public.is_WriterHabit_admin());

drop policy if exists prepared_notifications_owner_or_admin_manage on public.prepared_notifications;
drop policy if exists prepared_notifications_admin_manage on public.prepared_notifications;
create policy prepared_notifications_admin_manage on public.prepared_notifications
for all to authenticated
using (public.is_WriterHabit_admin())
with check (public.is_WriterHabit_admin());
