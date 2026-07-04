#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.supabase-admin");

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return;
  }

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex);
    const value = trimmed.slice(separatorIndex + 1).replace(/^"|"$/g, "");
    process.env[key] ??= value;
  }
}

loadEnvFile(envPath);

const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const devEmail =
  process.env.WRITERHABIT_DEV_USER_EMAIL ?? "dev.student@writerhabit.local";
const devPassword =
  process.env.WRITERHABIT_DEV_USER_PASSWORD ?? "WriterHabitDev123!";
const devDisplayName =
  process.env.WRITERHABIT_DEV_USER_DISPLAY_NAME ?? "WriterHabit Dev Student";
const devGradeLevel = Number.parseInt(
  process.env.WRITERHABIT_DEV_USER_GRADE_LEVEL ?? "7",
  10,
);

function printUsage() {
  console.log(`Usage:
  node scripts/seed-dev-user-supabase.mjs
  node scripts/seed-dev-user-supabase.mjs verify

Environment:
  .env.supabase-admin must contain SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.

Optional:
  WRITERHABIT_DEV_USER_EMAIL=dev.student@writerhabit.local
  WRITERHABIT_DEV_USER_PASSWORD=WriterHabitDev123!
  WRITERHABIT_DEV_USER_DISPLAY_NAME="WriterHabit Dev Student"
  WRITERHABIT_DEV_USER_GRADE_LEVEL=7
`);
}

function requireConfig() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.supabase-admin",
    );
  }

  if (
    !Number.isInteger(devGradeLevel) ||
    devGradeLevel < 1 ||
    devGradeLevel > 12
  ) {
    throw new Error(
      "WRITERHABIT_DEV_USER_GRADE_LEVEL must be an integer from 1 to 12.",
    );
  }

  if (devPassword.length < 8) {
    throw new Error(
      "WRITERHABIT_DEV_USER_PASSWORD must be at least 8 characters.",
    );
  }
}

async function request(path, options = {}) {
  requireConfig();

  const response = await fetch(`${supabaseUrl}${path}`, {
    ...options,
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      "content-type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const text = await response.text();
  let body = text;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!response.ok) {
    throw new Error(
      `Supabase request failed (${response.status}): ${JSON.stringify(body)}`,
    );
  }

  return body;
}

async function runSql(query) {
  return request("/pg/query", {
    body: JSON.stringify({ query }),
    method: "POST",
  });
}

function encodeStoragePath(path) {
  return path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

async function uploadStorageObject({
  bucket,
  contentType,
  path,
  body,
}) {
  requireConfig();

  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodeStoragePath(path)}`,
    {
      body,
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
        "cache-control": "3600",
        "content-type": contentType,
        "x-upsert": "true",
      },
      method: "POST",
    },
  );
  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `Supabase storage upload failed (${response.status}) for ${bucket}/${path}: ${text}`,
    );
  }

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function getUsersFromBody(body) {
  return Array.isArray(body?.users) ? body.users : [];
}

async function findAuthUserByEmail(email) {
  for (let page = 1; page <= 10; page += 1) {
    const body = await request(
      `/auth/v1/admin/users?page=${page}&per_page=100`,
    );
    const user = getUsersFromBody(body).find(
      (candidate) =>
        String(candidate.email ?? "").toLowerCase() === email.toLowerCase(),
    );

    if (user) {
      return user;
    }

    if (getUsersFromBody(body).length < 100) {
      return null;
    }
  }

  return null;
}

async function upsertAuthUser() {
  const metadata = {
    display_name: devDisplayName,
    full_name: devDisplayName,
    grade_level: devGradeLevel,
    onboarding_complete: true,
  };
  const appMetadata = {
    role: "student",
    subscription_status: "active",
  };
  const existing = await findAuthUserByEmail(devEmail);

  if (!existing) {
    const created = await request("/auth/v1/admin/users", {
      body: JSON.stringify({
        app_metadata: appMetadata,
        email: devEmail,
        email_confirm: true,
        password: devPassword,
        user_metadata: metadata,
      }),
      method: "POST",
    });

    return created;
  }

  return request(`/auth/v1/admin/users/${existing.id}`, {
    body: JSON.stringify({
      app_metadata: {
        ...(existing.app_metadata ?? {}),
        ...appMetadata,
      },
      email_confirm: true,
      password: devPassword,
      user_metadata: {
        ...(existing.user_metadata ?? {}),
        ...metadata,
      },
    }),
    method: "PUT",
  });
}

function buildSeedSql(userId) {
  return `
do $$
declare
  v_user_id uuid := ${sqlLiteral(userId)}::uuid;
  v_email citext := ${sqlLiteral(devEmail)}::citext;
  v_display_name text := ${sqlLiteral(devDisplayName)};
  v_grade_level smallint := ${devGradeLevel};
  v_student_profile_id uuid;
  v_teacher_profile_id uuid := (
    substr(md5(v_user_id::text || ':teacher-profile'), 1, 8) || '-' ||
    substr(md5(v_user_id::text || ':teacher-profile'), 9, 4) || '-' ||
    substr(md5(v_user_id::text || ':teacher-profile'), 13, 4) || '-' ||
    substr(md5(v_user_id::text || ':teacher-profile'), 17, 4) || '-' ||
    substr(md5(v_user_id::text || ':teacher-profile'), 21, 12)
  )::uuid;
  v_dev_class_id uuid := (
    substr(md5(v_user_id::text || ':dev-class'), 1, 8) || '-' ||
    substr(md5(v_user_id::text || ':dev-class'), 9, 4) || '-' ||
    substr(md5(v_user_id::text || ':dev-class'), 13, 4) || '-' ||
    substr(md5(v_user_id::text || ':dev-class'), 17, 4) || '-' ||
    substr(md5(v_user_id::text || ':dev-class'), 21, 12)
  )::uuid;
  v_daily_assignment_id uuid := '22222222-2222-4222-8222-222222222222'::uuid;
  v_reviewed_assignment_id uuid := '22222222-2222-4222-8222-222222222223'::uuid;
  v_canvas_assignment_id uuid := '22222222-2222-4222-8222-222222222224'::uuid;
  v_paragraph_rubric_id uuid := '11111111-1111-4111-8111-111111111111'::uuid;
  v_story_rubric_id uuid := '11111111-1111-4111-8111-111111111112'::uuid;
  v_organization_criterion_id uuid := '33333333-3333-4333-8333-333333333331'::uuid;
  v_clarity_criterion_id uuid := '33333333-3333-4333-8333-333333333332'::uuid;
  v_revision_criterion_id uuid := '33333333-3333-4333-8333-333333333333'::uuid;
  v_daily_student_assignment_id uuid;
  v_reviewed_student_assignment_id uuid;
  v_canvas_student_assignment_id uuid;
  v_submission_id uuid;
  v_feedback_id uuid;
  v_revision_task_id uuid;
  v_badge_id uuid;
  v_teacher_message_id uuid := (
    substr(md5(v_user_id::text || ':message:teacher'), 1, 8) || '-' ||
    substr(md5(v_user_id::text || ':message:teacher'), 9, 4) || '-' ||
    substr(md5(v_user_id::text || ':message:teacher'), 13, 4) || '-' ||
    substr(md5(v_user_id::text || ':message:teacher'), 17, 4) || '-' ||
    substr(md5(v_user_id::text || ':message:teacher'), 21, 12)
  )::uuid;
  v_coach_message_id uuid := (
    substr(md5(v_user_id::text || ':message:coach'), 1, 8) || '-' ||
    substr(md5(v_user_id::text || ':message:coach'), 9, 4) || '-' ||
    substr(md5(v_user_id::text || ':message:coach'), 13, 4) || '-' ||
    substr(md5(v_user_id::text || ':message:coach'), 17, 4) || '-' ||
    substr(md5(v_user_id::text || ':message:coach'), 21, 12)
  )::uuid;
  v_canvas_document_id uuid := (
    substr(md5(v_user_id::text || ':canvas:lined-notes'), 1, 8) || '-' ||
    substr(md5(v_user_id::text || ':canvas:lined-notes'), 9, 4) || '-' ||
    substr(md5(v_user_id::text || ':canvas:lined-notes'), 13, 4) || '-' ||
    substr(md5(v_user_id::text || ':canvas:lined-notes'), 17, 4) || '-' ||
    substr(md5(v_user_id::text || ':canvas:lined-notes'), 21, 12)
  )::uuid;
begin
  insert into public.users (id, email, display_name, role, locale, onboarding_progress)
  values (
    v_user_id,
    v_email,
    v_display_name,
    'student',
    'en',
    jsonb_build_object(
      'role', 'student',
      'gradeLevel', v_grade_level,
      'writingGoals', jsonb_build_array('write_paragraphs', 'school_assignments', 'improve_grammar'),
      'confidenceLevel', 'steady',
      'dailyPracticeMinutes', 15,
      'updatedAt', to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    )
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = excluded.display_name,
        role = 'student',
        locale = 'en',
        onboarding_progress = excluded.onboarding_progress;

  insert into public.student_profiles (
    user_id,
    grade_level,
    writing_level,
    writing_goals,
    daily_goal_minutes,
    language,
    accessibility_settings,
    onboarding_completed_at
  )
  values (
    v_user_id,
    v_grade_level,
    'steady',
    array['write_paragraphs', 'school_assignments', 'improve_grammar']::text[],
    15,
    'en',
    '{"reducedMotion":false,"highContrast":false}'::jsonb,
    now()
  )
  on conflict (user_id) do update
    set grade_level = excluded.grade_level,
        writing_level = excluded.writing_level,
        writing_goals = excluded.writing_goals,
        daily_goal_minutes = excluded.daily_goal_minutes,
        language = excluded.language,
        accessibility_settings = excluded.accessibility_settings,
        onboarding_completed_at = excluded.onboarding_completed_at
  returning id into v_student_profile_id;

  insert into public.teacher_profiles (
    id,
    user_id,
    display_name,
    school_name,
    dashboard_preferences
  )
  values (
    v_teacher_profile_id,
    v_user_id,
    v_display_name || ' Teacher View',
    'WriterHabit Dev School',
    '{"insightDismissed":false}'::jsonb
  )
  on conflict (user_id) do update
    set display_name = excluded.display_name,
        school_name = excluded.school_name,
        dashboard_preferences = excluded.dashboard_preferences
  returning id into v_teacher_profile_id;

  insert into public.classes (
    id,
    teacher_profile_id,
    name,
    grade_level,
    school_name,
    status
  )
  values (
    v_dev_class_id,
    v_teacher_profile_id,
    'Dev Grade ' || v_grade_level::text || ' Writers',
    v_grade_level,
    'WriterHabit Dev School',
    'active'
  )
  on conflict (id) do update
    set teacher_profile_id = excluded.teacher_profile_id,
        name = excluded.name,
        grade_level = excluded.grade_level,
        school_name = excluded.school_name,
        status = excluded.status,
        archived_at = null;

  insert into public.class_students (
    class_id,
    student_profile_id,
    status,
    removed_at
  )
  values (
    v_dev_class_id,
    v_student_profile_id,
    'active',
    null
  )
  on conflict (class_id, student_profile_id) where status = 'active' do update
    set status = excluded.status,
        removed_at = excluded.removed_at;

  insert into public.notification_preferences (
    student_profile_id,
    enabled,
    timezone,
    daily_assignment_time,
    streak_time,
    incomplete_assignment_time
  )
  values (v_student_profile_id, true, 'America/Los_Angeles', '16:00', '18:00', '19:00')
  on conflict (student_profile_id) do update
    set enabled = excluded.enabled,
        timezone = excluded.timezone,
        daily_assignment_time = excluded.daily_assignment_time,
        streak_time = excluded.streak_time,
        incomplete_assignment_time = excluded.incomplete_assignment_time;

  insert into public.parent_settings (
    parent_user_id,
    ai_coach_access,
    assignment_alerts_enabled,
    digest_frequency,
    practice_reminder_enabled,
    quiet_hours_label,
    share_weekly_summary_with_teacher,
    weekly_report_email_enabled
  )
  values (
    v_user_id,
    'hints_and_revision',
    true,
    'weekly',
    true,
    '8:00 PM - 7:00 AM',
    false,
    true
  )
  on conflict (parent_user_id) do update
    set ai_coach_access = excluded.ai_coach_access,
        assignment_alerts_enabled = excluded.assignment_alerts_enabled,
        digest_frequency = excluded.digest_frequency,
        practice_reminder_enabled = excluded.practice_reminder_enabled,
        quiet_hours_label = excluded.quiet_hours_label,
        share_weekly_summary_with_teacher = excluded.share_weekly_summary_with_teacher,
        weekly_report_email_enabled = excluded.weekly_report_email_enabled;

  insert into public.rubrics (
    id,
    name_key,
    name_fallback,
    grade_level_min,
    grade_level_max,
    assignment_type,
    created_by_user_id,
    status
  )
  values
    (v_paragraph_rubric_id, 'rubrics.paragraphPractice.name', 'Paragraph practice rubric', 6, 8, 'paragraph_writing', v_user_id, 'active'),
    (v_story_rubric_id, 'rubrics.storyDetail.name', 'Story detail rubric', 1, 8, 'creative_writing', v_user_id, 'active')
  on conflict (id) do update
    set name_key = excluded.name_key,
        name_fallback = excluded.name_fallback,
        grade_level_min = excluded.grade_level_min,
        grade_level_max = excluded.grade_level_max,
        assignment_type = excluded.assignment_type,
        created_by_user_id = excluded.created_by_user_id,
        status = excluded.status;

  insert into public.rubric_criteria (
    id,
    rubric_id,
    sort_order,
    skill,
    label_key,
    label_fallback,
    description_key,
    description_fallback
  )
  values
    (v_organization_criterion_id, v_paragraph_rubric_id, 1, 'organization', 'rubrics.paragraph.organization.label', 'Organization', 'rubrics.paragraph.organization.description', 'The paragraph has a clear topic sentence and supporting details.'),
    (v_clarity_criterion_id, v_paragraph_rubric_id, 2, 'clarity', 'rubrics.paragraph.clarity.label', 'Clarity', 'rubrics.paragraph.clarity.description', 'Ideas are easy to follow and sentences are clear.'),
    (v_revision_criterion_id, v_paragraph_rubric_id, 3, 'revision_quality', 'rubrics.paragraph.revision.label', 'Revision quality', 'rubrics.paragraph.revision.description', 'The student improves one specific part of the draft.')
  on conflict (id) do update
    set rubric_id = excluded.rubric_id,
        sort_order = excluded.sort_order,
        skill = excluded.skill,
        label_key = excluded.label_key,
        label_fallback = excluded.label_fallback,
        description_key = excluded.description_key,
        description_fallback = excluded.description_fallback;

  insert into public.assignments (
    id,
    title_key,
    title_fallback,
    prompt_key,
    prompt_fallback,
    instructions,
    assignment_type,
    grade_level_min,
    grade_level_max,
    skill_focus,
    difficulty,
    estimated_minutes,
    rubric_id,
    created_by_user_id,
    status,
    prompt_safety_status,
    allow_canvas,
    published_at
  )
  values
    (
      v_daily_assignment_id,
      'assignments.dev.practiceTalent.title',
      'Support a paragraph idea',
      'assignments.dev.practiceTalent.prompt',
      'Write a paragraph explaining whether practice or talent matters more when learning a skill.',
      '[{"key":"assignments.instructions.topicSentence","fallback":"Start with a topic sentence in your own words."},{"key":"assignments.instructions.twoDetails","fallback":"Add two supporting details."},{"key":"assignments.instructions.reviseOne","fallback":"Revise one sentence before submitting."}]'::jsonb,
      'paragraph_writing',
      6,
      8,
      array['organization','clarity','revision_quality']::text[],
      'moderate',
      15,
      v_paragraph_rubric_id,
      v_user_id,
      'published',
      'approved',
      true,
      now() - interval '2 days'
    ),
    (
      v_reviewed_assignment_id,
      'assignments.dev.feedback.title',
      'Revise a feedback paragraph',
      'assignments.dev.feedback.prompt',
      'Write a short paragraph about a time feedback helped you improve.',
      '[{"key":"assignments.instructions.feedbackExample","fallback":"Use one real example."},{"key":"assignments.instructions.explainWhy","fallback":"Explain why the feedback helped."}]'::jsonb,
      'paragraph_writing',
      6,
      8,
      array['clarity','revision_quality']::text[],
      'moderate',
      15,
      v_paragraph_rubric_id,
      v_user_id,
      'published',
      'approved',
      true,
      now() - interval '5 days'
    ),
    (
      v_canvas_assignment_id,
      'assignments.dev.canvas.title',
      'Plan with handwriting',
      'assignments.dev.canvas.prompt',
      'Make a quick handwritten plan for a paragraph about a favorite book or game.',
      '[{"key":"assignments.instructions.canvasPlan","fallback":"Sketch or write three planning notes."},{"key":"assignments.instructions.canvasAttach","fallback":"Attach your plan to the assignment."}]'::jsonb,
      'handwriting_practice',
      1,
      8,
      array['handwriting','organization']::text[],
      'easy',
      10,
      v_story_rubric_id,
      v_user_id,
      'published',
      'approved',
      true,
      now() - interval '1 day'
    )
  on conflict (id) do update
    set title_key = excluded.title_key,
        title_fallback = excluded.title_fallback,
        prompt_key = excluded.prompt_key,
        prompt_fallback = excluded.prompt_fallback,
        instructions = excluded.instructions,
        assignment_type = excluded.assignment_type,
        grade_level_min = excluded.grade_level_min,
        grade_level_max = excluded.grade_level_max,
        skill_focus = excluded.skill_focus,
        difficulty = excluded.difficulty,
        estimated_minutes = excluded.estimated_minutes,
        rubric_id = excluded.rubric_id,
        created_by_user_id = excluded.created_by_user_id,
        status = excluded.status,
        prompt_safety_status = excluded.prompt_safety_status,
        allow_canvas = excluded.allow_canvas,
        published_at = excluded.published_at;

  insert into public.student_assignments (
    student_profile_id,
    assignment_id,
    status,
    due_at,
    started_at,
    daily_selection_metadata,
    teacher_note_key,
    teacher_note_fallback
  )
  values (
    v_student_profile_id,
    v_daily_assignment_id,
    'in_progress',
    now() + interval '1 day',
    now() - interval '35 minutes',
    '{"reason":"dev_seed_daily_assignment","selectionVersion":1}'::jsonb,
    'assignments.dev.teacherNote',
    'Focus on making each detail support the topic sentence.'
  )
  on conflict (student_profile_id, assignment_id) where class_id is null do update
    set status = excluded.status,
        due_at = excluded.due_at,
        started_at = excluded.started_at,
        daily_selection_metadata = excluded.daily_selection_metadata,
        teacher_note_key = excluded.teacher_note_key,
        teacher_note_fallback = excluded.teacher_note_fallback
  returning id into v_daily_student_assignment_id;

  insert into public.student_assignments (
    student_profile_id,
    assignment_id,
    status,
    due_at,
    started_at,
    submitted_at,
    daily_selection_metadata
  )
  values (
    v_student_profile_id,
    v_reviewed_assignment_id,
    'feedback_ready',
    now() - interval '2 days',
    now() - interval '3 days',
    now() - interval '2 days',
    '{"reason":"dev_seed_reviewed_assignment","selectionVersion":1}'::jsonb
  )
  on conflict (student_profile_id, assignment_id) where class_id is null do update
    set status = excluded.status,
        due_at = excluded.due_at,
        started_at = excluded.started_at,
        submitted_at = excluded.submitted_at,
        daily_selection_metadata = excluded.daily_selection_metadata
  returning id into v_reviewed_student_assignment_id;

  insert into public.student_assignments (
    student_profile_id,
    assignment_id,
    status,
    due_at,
    started_at,
    daily_selection_metadata
  )
  values (
    v_student_profile_id,
    v_canvas_assignment_id,
    'in_progress',
    now() + interval '2 days',
    now() - interval '20 minutes',
    '{"reason":"dev_seed_canvas_assignment","selectionVersion":1}'::jsonb
  )
  on conflict (student_profile_id, assignment_id) where class_id is null do update
    set status = excluded.status,
        due_at = excluded.due_at,
        started_at = excluded.started_at,
        daily_selection_metadata = excluded.daily_selection_metadata
  returning id into v_canvas_student_assignment_id;

  insert into public.writing_drafts (
    student_assignment_id,
    student_profile_id,
    text_content,
    text_preview,
    autosave_version,
    word_count,
    sentence_count,
    paragraph_count,
    revision_number
  )
  values (
    v_daily_student_assignment_id,
    v_student_profile_id,
    'Practice matters more than talent because people can improve when they try again. A musician gets better by listening to feedback and practicing the hard parts. Talent can help at first, but practice helps someone keep growing.',
    'Practice matters more than talent because people can improve when they try again...',
    3,
    35,
    3,
    1,
    1
  )
  on conflict (student_assignment_id) do update
    set text_content = excluded.text_content,
        text_preview = excluded.text_preview,
        autosave_version = excluded.autosave_version,
        word_count = excluded.word_count,
        sentence_count = excluded.sentence_count,
        paragraph_count = excluded.paragraph_count,
        revision_number = excluded.revision_number;

  insert into public.canvas_documents (
    id,
    student_profile_id,
    assignment_id,
    student_assignment_id,
    template,
    title,
    sync_status,
    client_version,
    object_path,
    recognition_status,
    attached_at
  )
  values (
    v_canvas_document_id,
    v_student_profile_id,
    v_canvas_assignment_id,
    v_canvas_student_assignment_id,
    'lined_paper',
    'Dev handwriting plan',
    'saved',
    2,
    v_user_id::text || '/canvas/' || v_canvas_document_id::text || '/stroke-document/v2.json',
    'completed',
    now() - interval '12 minutes'
  )
  on conflict (id) do update
    set student_profile_id = excluded.student_profile_id,
        assignment_id = excluded.assignment_id,
        student_assignment_id = excluded.student_assignment_id,
        template = excluded.template,
        title = excluded.title,
        sync_status = excluded.sync_status,
        client_version = excluded.client_version,
        object_path = excluded.object_path,
        recognition_status = excluded.recognition_status,
        attached_at = excluded.attached_at;

  insert into public.canvas_document_contents (
    canvas_document_id,
    student_profile_id,
    strokes,
    recognized_text
  )
  values (
    v_canvas_document_id,
    v_student_profile_id,
    '[{"id":"stroke-1","tool":"pen","color":"#1F2937","width":4,"createdAt":"2026-06-10T16:00:00.000Z","points":[{"x":24,"y":40,"pressure":0.5},{"x":90,"y":46,"pressure":0.6},{"x":150,"y":42,"pressure":0.55}]},{"id":"stroke-2","tool":"pen","color":"#1F2937","width":4,"createdAt":"2026-06-10T16:01:00.000Z","points":[{"x":28,"y":82,"pressure":0.5},{"x":120,"y":86,"pressure":0.6},{"x":210,"y":84,"pressure":0.55}]}]'::jsonb,
    'Topic, two details, revise one sentence.'
  )
  on conflict (canvas_document_id) do update
    set student_profile_id = excluded.student_profile_id,
        strokes = excluded.strokes,
        recognized_text = excluded.recognized_text;

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
    v_reviewed_student_assignment_id,
    v_student_profile_id,
    'feedback_ready',
    'Feedback helped me improve because it showed me which sentence was unclear. I changed the sentence and my paragraph made more sense.',
    22,
    2,
    1,
    1,
    'dev-reviewed-submission-v1',
    now() - interval '2 days'
  )
  on conflict (student_assignment_id, revision_number) do update
    set status = excluded.status,
        typed_text_excerpt = excluded.typed_text_excerpt,
        word_count = excluded.word_count,
        sentence_count = excluded.sentence_count,
        paragraph_count = excluded.paragraph_count,
        idempotency_key = excluded.idempotency_key,
        submitted_at = excluded.submitted_at
  returning id into v_submission_id;

  insert into public.submission_contents (submission_id, student_profile_id, typed_text)
  values (
    v_submission_id,
    v_student_profile_id,
    'Feedback helped me improve because it showed me which sentence was unclear. I changed the sentence and my paragraph made more sense.'
  )
  on conflict (submission_id) do update
    set student_profile_id = excluded.student_profile_id,
        typed_text = excluded.typed_text;

  insert into public.submission_attachments (
    submission_id,
    student_profile_id,
    client_attachment_id,
    kind,
    name,
    mime_type,
    size_bytes,
    storage_bucket,
    storage_object_path,
    upload_status,
    uploaded_at,
    extraction_status,
    extracted_text_excerpt
  )
  values (
    v_submission_id,
    v_student_profile_id,
    'dev-reviewed-upload-1',
    'image',
    'feedback-paragraph-photo.jpg',
    'image/jpeg',
    184320,
    'submission-attachments',
    v_user_id::text || '/submissions/' || v_submission_id::text || '/dev-reviewed-upload-1-feedback-paragraph-photo.jpg',
    'not_uploaded',
    null,
    'done',
    'Feedback helped me improve because it showed me which sentence was unclear.'
  )
  on conflict (submission_id, client_attachment_id) do update
    set student_profile_id = excluded.student_profile_id,
        kind = excluded.kind,
        name = excluded.name,
        mime_type = excluded.mime_type,
        size_bytes = excluded.size_bytes,
        storage_bucket = excluded.storage_bucket,
        storage_object_path = excluded.storage_object_path,
        upload_status = excluded.upload_status,
        uploaded_at = excluded.uploaded_at,
        extraction_status = excluded.extraction_status,
        extracted_text_excerpt = excluded.extracted_text_excerpt;

  update public.student_assignments
  set current_submission_id = v_submission_id
  where id = v_reviewed_student_assignment_id;

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
    v_submission_id,
    v_student_profile_id,
    v_grade_level,
    'Feedback helped me improve because it showed me which sentence was unclear.',
    'feedback.dev.strength',
    'You explained a clear cause and effect.',
    'feedback.dev.improvement',
    'Add one specific example so the reader can picture the change.',
    'feedback.dev.revisionTask',
    'Revise one sentence by adding a concrete example from your work.',
    12,
    8,
    'clarity'
  )
  on conflict (submission_id) do update
    set student_profile_id = excluded.student_profile_id,
        grade_level = excluded.grade_level,
        submitted_text_excerpt = excluded.submitted_text_excerpt,
        strength_key = excluded.strength_key,
        strength_fallback = excluded.strength_fallback,
        improvement_key = excluded.improvement_key,
        improvement_fallback = excluded.improvement_fallback,
        next_revision_task_key = excluded.next_revision_task_key,
        next_revision_task_fallback = excluded.next_revision_task_fallback,
        progress_minutes = excluded.progress_minutes,
        progress_points = excluded.progress_points,
        progress_skill = excluded.progress_skill
  returning id into v_feedback_id;

  delete from public.feedback_rubric_scores where feedback_id = v_feedback_id;
  delete from public.grammar_suggestions where feedback_id = v_feedback_id;
  delete from public.revision_tasks where feedback_id = v_feedback_id;

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
    'clarity',
    'revision.dev.instruction',
    'Add a specific example to one sentence.',
    'revision.dev.guidingQuestion',
    'What exact feedback did you use, and what changed after it?',
    'Feedback helped me improve because it showed me which sentence was unclear.'
  )
  returning id into v_revision_task_id;

  insert into public.submission_revision_drafts (
    submission_id,
    student_profile_id,
    revised_text,
    client_updated_at
  )
  values (
    v_submission_id,
    v_student_profile_id,
    'Feedback helped me improve because my teacher pointed to one unclear sentence. I changed that sentence by naming the exact detail, and my paragraph made more sense.',
    now() - interval '6 hours'
  )
  on conflict (submission_id) do update
    set student_profile_id = excluded.student_profile_id,
        revised_text = excluded.revised_text,
        client_updated_at = excluded.client_updated_at;

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
    'grammar.dev.specificNouns.title',
    'Use a specific noun',
    'grammar.dev.specificNouns.explanation',
    'Specific nouns help the reader understand what changed.',
    'which sentence was unclear',
    'grammar.dev.specificNouns.action',
    'Name the sentence or detail you revised.'
  );

  insert into public.feedback_rubric_scores (
    feedback_id,
    rubric_criterion_id,
    score,
    max_score,
    level,
    coaching_note_key,
    coaching_note_fallback
  )
  values
    (v_feedback_id, v_organization_criterion_id, 3, 4, 'meeting', 'rubric.dev.organization.note', 'Your paragraph follows one focused idea.'),
    (v_feedback_id, v_clarity_criterion_id, 2, 4, 'building', 'rubric.dev.clarity.note', 'The next step is adding a more specific example.'),
    (v_feedback_id, v_revision_criterion_id, 3, 4, 'meeting', 'rubric.dev.revision.note', 'You are ready for a focused revision task.');

  insert into public.student_progress_totals (
    student_profile_id,
    assignments_completed,
    minutes_this_week,
    weekly_minutes_goal,
    words_written,
    revisions_completed,
    rubric_improvement,
    ai_feedback_applied,
    handwriting_minutes,
    current_streak_days,
    best_streak_days,
    practiced_today_on,
    streak_status
  )
  values (v_student_profile_id, 4, 54, 75, 640, 3, 12.5, 2, 18, 4, 9, current_date, 'continued')
  on conflict (student_profile_id) do update
    set assignments_completed = excluded.assignments_completed,
        minutes_this_week = excluded.minutes_this_week,
        weekly_minutes_goal = excluded.weekly_minutes_goal,
        words_written = excluded.words_written,
        revisions_completed = excluded.revisions_completed,
        rubric_improvement = excluded.rubric_improvement,
        ai_feedback_applied = excluded.ai_feedback_applied,
        handwriting_minutes = excluded.handwriting_minutes,
        current_streak_days = excluded.current_streak_days,
        best_streak_days = excluded.best_streak_days,
        practiced_today_on = excluded.practiced_today_on,
        streak_status = excluded.streak_status;

  insert into public.student_skill_progress (
    student_profile_id,
    skill,
    current_score,
    previous_score,
    level
  )
  values
    (v_student_profile_id, 'organization', 72, 66, 3),
    (v_student_profile_id, 'clarity', 64, 60, 3),
    (v_student_profile_id, 'revision_quality', 59, 52, 2),
    (v_student_profile_id, 'handwriting', 68, 62, 3)
  on conflict (student_profile_id, skill) do update
    set current_score = excluded.current_score,
        previous_score = excluded.previous_score,
        level = excluded.level;

  insert into public.student_activity_days (
    student_profile_id,
    activity_date,
    practiced_skills,
    assignments_completed,
    minutes_practiced,
    words_written,
    revisions_completed,
    feedback_applied,
    handwriting_minutes
  )
  values
    (v_student_profile_id, current_date, array['organization','clarity']::text[], 0, 15, 120, 0, 0, 0),
    (v_student_profile_id, current_date - 1, array['clarity','revision_quality']::text[], 1, 18, 140, 1, 1, 0),
    (v_student_profile_id, current_date - 2, array['organization','handwriting']::text[], 1, 11, 80, 0, 0, 11),
    (v_student_profile_id, current_date - 3, array['revision_quality']::text[], 1, 10, 95, 1, 1, 0)
  on conflict (student_profile_id, activity_date) do update
    set practiced_skills = excluded.practiced_skills,
        assignments_completed = excluded.assignments_completed,
        minutes_practiced = excluded.minutes_practiced,
        words_written = excluded.words_written,
        revisions_completed = excluded.revisions_completed,
        feedback_applied = excluded.feedback_applied,
        handwriting_minutes = excluded.handwriting_minutes;

  insert into public.practice_sessions (
    student_profile_id,
    skill_id,
    task_id,
    estimated_minutes,
    used_canvas,
    attachment_count,
    extracted_text_excerpt,
    response_text,
    completed_on,
    completed_at
  )
  values
    (
      v_student_profile_id,
      'sentence-combining',
      'forest',
      5,
      true,
      1,
      'The old trees leaned over the path and made the forest feel quiet.',
      'I combined two short ideas into one clearer sentence.',
      current_date,
      now() - interval '20 minutes'
    ),
    (
      v_student_profile_id,
      'vivid-verbs',
      'walked',
      5,
      false,
      0,
      null,
      'I changed walked to hurried so the sentence shows more action.',
      current_date - 1,
      now() - interval '1 day'
    ),
    (
      v_student_profile_id,
      'show-dont-tell',
      'nervous',
      8,
      false,
      0,
      null,
      'I showed nervous by adding shaky hands and a quiet voice.',
      current_date - 2,
      now() - interval '2 days'
    )
  on conflict (student_profile_id, skill_id, task_id, completed_on) do update
    set estimated_minutes = excluded.estimated_minutes,
        used_canvas = excluded.used_canvas,
        attachment_count = excluded.attachment_count,
        extracted_text_excerpt = excluded.extracted_text_excerpt,
        response_text = excluded.response_text,
        completed_at = excluded.completed_at;

  insert into public.grade3_writing_progress (
    student_profile_id,
    day,
    draft,
    stronger_sentence,
    favorite_sentence,
    checklist,
    planning,
    completed,
    client_updated_at
  )
  values
    (
      v_student_profile_id,
      1,
      'The tiny dragon hid under the porch. It sneezed smoke when Mia offered it a cracker.',
      'The tiny dragon sneezed silver smoke under the porch.',
      'It sneezed smoke when Mia offered it a cracker.',
      '{"capital":true,"punctuation":true,"details":true}'::jsonb,
      '{"talkIdea":"A dragon visits a backyard.","beginning":"Mia hears a sneeze.","middle":"She finds a tiny dragon.","end":"She helps it feel safe."}'::jsonb,
      true,
      now() - interval '3 days'
    ),
    (
      v_student_profile_id,
      2,
      'The garden looked empty until the sunflower turned its head and whispered hello.',
      'The tallest sunflower bent close and whispered hello.',
      'the sunflower turned its head and whispered hello',
      '{"capital":true,"punctuation":true,"details":false}'::jsonb,
      '{"talkIdea":"A talking sunflower surprises a kid.","beginning":"The garden is quiet.","middle":"The sunflower talks.","end":"The kid asks a question."}'::jsonb,
      true,
      now() - interval '2 days'
    ),
    (
      v_student_profile_id,
      3,
      'I would invent shoes that remember every path and glow when you are close to home.',
      '',
      '',
      '{"capital":true,"punctuation":false}'::jsonb,
      '{"talkIdea":"Magic shoes that help you get home.","beginning":"Someone puts on the shoes.","middle":"The shoes glow on old paths.","end":""}'::jsonb,
      false,
      now() - interval '1 day'
    )
  on conflict (student_profile_id, day) do update
    set draft = excluded.draft,
        stronger_sentence = excluded.stronger_sentence,
        favorite_sentence = excluded.favorite_sentence,
        checklist = excluded.checklist,
        planning = excluded.planning,
        completed = excluded.completed,
        client_updated_at = excluded.client_updated_at;

  insert into public.weekly_reviews (
    student_profile_id,
    week_start,
    week_end,
    celebration_key,
    celebration_fallback,
    focus_for_next_week_key,
    focus_for_next_week_fallback
  )
  values (
    v_student_profile_id,
    current_date - extract(dow from current_date)::int,
    current_date - extract(dow from current_date)::int + 6,
    'weeklyReview.dev.celebration',
    'You kept a four-day writing streak and revised with feedback.',
    'weeklyReview.dev.focus',
    'Next week, keep practicing clear examples after your topic sentence.'
  )
  on conflict (student_profile_id, week_start, week_end) do update
    set celebration_key = excluded.celebration_key,
        celebration_fallback = excluded.celebration_fallback,
        focus_for_next_week_key = excluded.focus_for_next_week_key,
        focus_for_next_week_fallback = excluded.focus_for_next_week_fallback;

  insert into public.badges (
    code,
    name_key,
    name_fallback,
    description_key,
    description_fallback,
    icon_name,
    unlock_condition_key,
    unlock_condition_fallback,
    criteria,
    active
  )
  values
    ('dev-streak-3', 'badges.dev.streak3.name', 'Three-day streak', 'badges.dev.streak3.description', 'Practiced writing three days in a row.', 'flame', 'badges.dev.streak3.condition', 'Practice three days in a row.', '{"streakDays":3}'::jsonb, true),
    ('dev-revision-starter', 'badges.dev.revisionStarter.name', 'Revision starter', 'badges.dev.revisionStarter.description', 'Completed a focused revision task.', 'sparkles', 'badges.dev.revisionStarter.condition', 'Complete one revision task.', '{"revisionsCompleted":1}'::jsonb, true)
  on conflict (code) do update
    set name_key = excluded.name_key,
        name_fallback = excluded.name_fallback,
        description_key = excluded.description_key,
        description_fallback = excluded.description_fallback,
        icon_name = excluded.icon_name,
        unlock_condition_key = excluded.unlock_condition_key,
        unlock_condition_fallback = excluded.unlock_condition_fallback,
        criteria = excluded.criteria,
        active = excluded.active;

  select id into v_badge_id from public.badges where code = 'dev-streak-3';
  insert into public.student_badges (student_profile_id, badge_id, status, progress_percent, unlocked_at)
  values (v_student_profile_id, v_badge_id, 'unlocked', 100, now() - interval '1 day')
  on conflict (student_profile_id, badge_id) do update
    set status = excluded.status,
        progress_percent = excluded.progress_percent,
        unlocked_at = excluded.unlocked_at;

  select id into v_badge_id from public.badges where code = 'dev-revision-starter';
  insert into public.student_badges (student_profile_id, badge_id, status, progress_percent, unlocked_at)
  values (v_student_profile_id, v_badge_id, 'in_progress', 70, null)
  on conflict (student_profile_id, badge_id) do update
    set status = excluded.status,
        progress_percent = excluded.progress_percent,
        unlocked_at = excluded.unlocked_at;

  delete from public.entitlements
  where owner_user_id = v_user_id
    and provider = 'manual'
    and provider_subscription_id = 'dev-local-plus';

  insert into public.entitlements (
    owner_user_id,
    scope_type,
    status,
    can_access_premium,
    current_plan_id,
    billing_period,
    provider,
    provider_customer_id,
    provider_subscription_id,
    current_period_ends_at,
    provider_last_event_id,
    provider_last_event_timestamp_ms,
    provider_last_event_type
  )
  values (
    v_user_id,
    'personal',
    'active',
    true,
    'WriterHabit_plus_monthly',
    'month',
    'manual',
    'dev-user',
    'dev-local-plus',
    now() + interval '30 days',
    'dev-seed',
    extract(epoch from now())::bigint * 1000,
    'DEV_SEED'
  );

  delete from public.ai_coach_interactions
  where student_profile_id = v_student_profile_id
    and provider_request_id = 'dev-seed';

  insert into public.ai_coach_interactions (
    student_profile_id,
    student_assignment_id,
    action,
    status,
    safety_flags,
    draft_excerpt,
    selected_text_excerpt,
    response_title_key,
    response_message_key,
    next_step_key,
    question_key,
    provider_request_id
  )
  values (
    v_student_profile_id,
    v_daily_student_assignment_id,
    'hint',
    'completed',
    '{}'::text[],
    'Practice matters more than talent because people can improve when they try again.',
    'people can improve',
    'aiCoach.dev.hint.title',
    'aiCoach.dev.hint.message',
    'aiCoach.dev.hint.nextStep',
    'aiCoach.dev.hint.question',
    'dev-seed'
  );

  insert into public.student_messages (
    id,
    student_profile_id,
    sender_kind,
    sender_name,
    sender_initials,
    preview,
    sent_at
  )
  values
    (
      v_teacher_message_id,
      v_student_profile_id,
      'teacher',
      'Ms. Rivera',
      'MR',
      'Lovely progress on your paragraph draft. Keep that vivid detail going!',
      now() - interval '2 hours'
    ),
    (
      v_coach_message_id,
      v_student_profile_id,
      'coach',
      'Writing Coach',
      '',
      'Ready when you are for your next revision. I will ask the questions, you write the words.',
      now() - interval '1 day'
    )
  on conflict (id) do update
    set student_profile_id = excluded.student_profile_id,
        sender_kind = excluded.sender_kind,
        sender_name = excluded.sender_name,
        sender_initials = excluded.sender_initials,
        preview = excluded.preview,
        sent_at = excluded.sent_at;
end $$;

select
  u.id as user_id,
  sp.id as student_profile_id,
  count(distinct sa.id) as student_assignments,
  count(distinct wd.id) as writing_drafts,
  count(distinct s.id) as submissions,
  count(distinct f.id) as feedback_items,
  count(distinct cd.id) as canvas_documents,
  count(distinct ssp.id) as skill_progress_rows,
  count(distinct g3.id) as grade3_progress_rows,
  count(distinct srd.submission_id) as revision_drafts,
  count(distinct sm.id) as student_messages,
  count(distinct ps.id) as practice_sessions,
  count(distinct satt.id) as submission_attachments,
  max(cd.object_path) filter (where cd.title = 'Dev handwriting plan') as canvas_artifact_path,
  max(satt.storage_object_path) filter (where satt.client_attachment_id = 'dev-reviewed-upload-1') as submission_attachment_path
from public.users u
join public.student_profiles sp on sp.user_id = u.id
left join public.student_assignments sa on sa.student_profile_id = sp.id
left join public.writing_drafts wd on wd.student_profile_id = sp.id
left join public.submissions s on s.student_profile_id = sp.id
left join public.feedback f on f.student_profile_id = sp.id
left join public.canvas_documents cd on cd.student_profile_id = sp.id
left join public.student_skill_progress ssp on ssp.student_profile_id = sp.id
left join public.grade3_writing_progress g3 on g3.student_profile_id = sp.id
left join public.submission_revision_drafts srd on srd.student_profile_id = sp.id
left join public.student_messages sm on sm.student_profile_id = sp.id
left join public.practice_sessions ps on ps.student_profile_id = sp.id
left join public.submission_attachments satt on satt.student_profile_id = sp.id
where u.id = ${sqlLiteral(userId)}::uuid
group by u.id, sp.id;
`;
}

function buildCanvasArtifactPayload(row) {
  return JSON.stringify(
    {
      canvasDocumentId: row.canvas_document_id,
      clientVersion: 2,
      createdAt: "2026-06-10T16:00:00.000Z",
      strokes: [
        {
          color: "#1F2937",
          createdAt: "2026-06-10T16:00:00.000Z",
          id: "stroke-1",
          points: [
            { pressure: 0.5, x: 24, y: 40 },
            { pressure: 0.6, x: 90, y: 46 },
            { pressure: 0.55, x: 150, y: 42 },
          ],
          tool: "pen",
          width: 4,
        },
        {
          color: "#1F2937",
          createdAt: "2026-06-10T16:01:00.000Z",
          id: "stroke-2",
          points: [
            { pressure: 0.5, x: 28, y: 82 },
            { pressure: 0.6, x: 120, y: 86 },
            { pressure: 0.55, x: 210, y: 84 },
          ],
          tool: "pen",
          width: 4,
        },
      ],
      studentId: row.student_profile_id,
      template: "lined_paper",
      title: "Dev handwriting plan",
      updatedAt: "2026-06-10T16:01:00.000Z",
    },
    null,
    2,
  );
}

async function uploadSeedObjects(row) {
  const uploads = [];

  if (row?.canvas_artifact_path) {
    uploads.push(
      uploadStorageObject({
        body: buildCanvasArtifactPayload({
          ...row,
          canvas_document_id: row.canvas_artifact_path.split("/")[2],
        }),
        bucket: "canvas-artifacts",
        contentType: "application/json",
        path: row.canvas_artifact_path,
      }),
    );
  }

  if (row?.submission_attachment_path) {
    uploads.push(
      uploadStorageObject({
        body: "WriterHabit dev seed placeholder image bytes for uploaded writing evidence.",
        bucket: "submission-attachments",
        contentType: "image/jpeg",
        path: row.submission_attachment_path,
      }),
    );
  }

  await Promise.all(uploads);

  if (row?.submission_attachment_path) {
    await runSql(`
update public.submission_attachments
set upload_status = 'uploaded',
    uploaded_at = now()
where storage_object_path = ${sqlLiteral(row.submission_attachment_path)};
`);
  }
}

function assertSeedVerification(row) {
  const failures = [];

  if (!row) {
    throw new Error("Dev seed verification returned no rows.");
  }

  if (Number(row.student_assignments) < 3) failures.push("student_assignments");
  if (Number(row.user_onboarding_progress) < 1) failures.push("user_onboarding_progress");
  if (Number(row.teacher_profiles) < 1) failures.push("teacher_profiles");
  if (Number(row.teacher_dashboard_preferences) < 1) failures.push("teacher_dashboard_preferences");
  if (Number(row.classes) < 1) failures.push("classes");
  if (Number(row.class_students) < 1) failures.push("class_students");
  if (Number(row.notification_preferences) < 1) failures.push("notification_preferences");
  if (Number(row.parent_settings) < 1) failures.push("parent_settings");
  if (Number(row.writing_drafts) < 1) failures.push("writing_drafts");
  if (Number(row.submissions) < 1) failures.push("submissions");
  if (Number(row.submission_contents) < 1) failures.push("submission_contents");
  if (Number(row.feedback_items) < 1) failures.push("feedback_items");
  if (Number(row.revision_tasks) < 1) failures.push("revision_tasks");
  if (Number(row.grammar_suggestions) < 1) failures.push("grammar_suggestions");
  if (Number(row.feedback_rubric_scores) < 3) failures.push("feedback_rubric_scores");
  if (Number(row.canvas_documents) < 1) failures.push("canvas_documents");
  if (Number(row.canvas_document_contents) < 1) failures.push("canvas_document_contents");
  if (Number(row.progress_totals) < 1) failures.push("progress_totals");
  if (Number(row.skill_progress_rows) < 3) failures.push("skill_progress_rows");
  if (Number(row.activity_days) < 4) failures.push("activity_days");
  if (Number(row.grade3_progress_rows) < 1) failures.push("grade3_progress_rows");
  if (Number(row.weekly_reviews) < 1) failures.push("weekly_reviews");
  if (Number(row.student_badges) < 2) failures.push("student_badges");
  if (Number(row.revision_drafts) < 1) failures.push("revision_drafts");
  if (Number(row.student_messages) < 2) failures.push("student_messages");
  if (Number(row.practice_sessions) < 1) failures.push("practice_sessions");
  if (Number(row.entitlements) < 1) failures.push("entitlements");
  if (Number(row.ai_coach_interactions) < 1) failures.push("ai_coach_interactions");
  if (Number(row.submission_attachments) < 1) failures.push("submission_attachments");
  if (Number(row.canvas_storage_objects) < 1) failures.push("canvas_storage_objects");
  if (Number(row.submission_attachment_storage_objects) < 1) {
    failures.push("submission_attachment_storage_objects");
  }
  if (row.submission_attachment_upload_status !== "uploaded") {
    failures.push("submission_attachment_upload_status");
  }

  if (failures.length > 0) {
    throw new Error(`Dev seed verification failed: ${failures.join(", ")}`);
  }
}

function buildVerificationSql(userId) {
  return `
select
  u.id as user_id,
  sp.id as student_profile_id,
  count(distinct sa.id) as student_assignments,
  count(distinct u.id) filter (
    where jsonb_typeof(u.onboarding_progress) = 'object'
      and u.onboarding_progress->>'role' = 'student'
      and u.onboarding_progress ? 'gradeLevel'
  ) as user_onboarding_progress,
  count(distinct tp.id) as teacher_profiles,
  count(distinct tp.id) filter (
    where jsonb_typeof(tp.dashboard_preferences) = 'object'
      and tp.dashboard_preferences ? 'insightDismissed'
  ) as teacher_dashboard_preferences,
  count(distinct cls.id) as classes,
  count(distinct cs.id) as class_students,
  count(distinct np.id) as notification_preferences,
  count(distinct pset.parent_user_id) as parent_settings,
  count(distinct wd.id) as writing_drafts,
  count(distinct s.id) as submissions,
  count(distinct sc.submission_id) as submission_contents,
  count(distinct f.id) as feedback_items,
  count(distinct rt.id) as revision_tasks,
  count(distinct gs.id) as grammar_suggestions,
  count(distinct frs.id) as feedback_rubric_scores,
  count(distinct cd.id) as canvas_documents,
  count(distinct cdc.canvas_document_id) as canvas_document_contents,
  count(distinct spt.student_profile_id) as progress_totals,
  count(distinct ssp.id) as skill_progress_rows,
  count(distinct sad.id) as activity_days,
  count(distinct g3.id) as grade3_progress_rows,
  count(distinct wr.id) as weekly_reviews,
  count(distinct sb.id) as student_badges,
  count(distinct srd.submission_id) as revision_drafts,
  count(distinct sm.id) as student_messages,
  count(distinct ps.id) as practice_sessions,
  count(distinct e.id) as entitlements,
  count(distinct aci.id) as ai_coach_interactions,
  count(distinct satt.id) as submission_attachments,
  count(distinct canvas_object.id) as canvas_storage_objects,
  count(distinct attachment_object.id) as submission_attachment_storage_objects,
  max(satt.upload_status) filter (where satt.client_attachment_id = 'dev-reviewed-upload-1') as submission_attachment_upload_status,
  max(cd.object_path) filter (where cd.title = 'Dev handwriting plan') as canvas_artifact_path,
  max(satt.storage_object_path) filter (where satt.client_attachment_id = 'dev-reviewed-upload-1') as submission_attachment_path
from public.users u
join public.student_profiles sp on sp.user_id = u.id
left join public.student_assignments sa on sa.student_profile_id = sp.id
left join public.teacher_profiles tp on tp.user_id = u.id
left join public.classes cls on cls.teacher_profile_id = tp.id and cls.status = 'active'
left join public.class_students cs on cs.class_id = cls.id and cs.student_profile_id = sp.id and cs.status = 'active'
left join public.notification_preferences np on np.student_profile_id = sp.id
left join public.parent_settings pset on pset.parent_user_id = u.id
left join public.writing_drafts wd on wd.student_profile_id = sp.id
left join public.submissions s on s.student_profile_id = sp.id
left join public.submission_contents sc on sc.student_profile_id = sp.id
left join public.feedback f on f.student_profile_id = sp.id
left join public.revision_tasks rt on rt.feedback_id = f.id
left join public.grammar_suggestions gs on gs.feedback_id = f.id
left join public.feedback_rubric_scores frs on frs.feedback_id = f.id
left join public.canvas_documents cd on cd.student_profile_id = sp.id
left join public.canvas_document_contents cdc on cdc.student_profile_id = sp.id
left join public.student_progress_totals spt on spt.student_profile_id = sp.id
left join public.student_skill_progress ssp on ssp.student_profile_id = sp.id
left join public.student_activity_days sad on sad.student_profile_id = sp.id
left join public.grade3_writing_progress g3 on g3.student_profile_id = sp.id
left join public.weekly_reviews wr on wr.student_profile_id = sp.id
left join public.student_badges sb on sb.student_profile_id = sp.id
left join public.submission_revision_drafts srd on srd.student_profile_id = sp.id
left join public.student_messages sm on sm.student_profile_id = sp.id
left join public.practice_sessions ps on ps.student_profile_id = sp.id
left join public.entitlements e on e.owner_user_id = u.id
left join public.ai_coach_interactions aci on aci.student_profile_id = sp.id
left join public.submission_attachments satt on satt.student_profile_id = sp.id
left join storage.objects canvas_object
  on canvas_object.bucket_id = 'canvas-artifacts'
 and canvas_object.name = cd.object_path
left join storage.objects attachment_object
  on attachment_object.bucket_id = 'submission-attachments'
 and attachment_object.name = satt.storage_object_path
where u.id = ${sqlLiteral(userId)}::uuid
group by u.id, sp.id;
`;
}

async function verifySeededDevUser(userId) {
  const verificationRows = await runSql(buildVerificationSql(userId));
  const verified = verificationRows?.[0] ?? null;
  assertSeedVerification(verified);

  return verified;
}

async function runSeed() {
  const authUser = await upsertAuthUser();
  const rows = await runSql(buildSeedSql(authUser.id));
  const seeded = rows?.[0] ?? null;
  await uploadSeedObjects(seeded);
  const verified = await verifySeededDevUser(authUser.id);

  return {
    authUser,
    seeded,
    verified,
  };
}

async function runVerify() {
  const authUser = await findAuthUserByEmail(devEmail);

  if (!authUser) {
    throw new Error(`Dev user ${devEmail} does not exist. Run the seed command first.`);
  }

  return {
    authUser,
    verified: await verifySeededDevUser(authUser.id),
  };
}

const [command] = process.argv.slice(2);

try {
  if (command === "help" || command === "--help" || command === "-h") {
    printUsage();
    process.exit(0);
  }

  if (command && command !== "verify") {
    throw new Error(`Unknown command: ${command}`);
  }

  requireConfig();
  const result = command === "verify" ? await runVerify() : await runSeed();

  console.log(
    JSON.stringify(
      {
        command: command === "verify" ? "verify" : "seed",
        email: devEmail,
        ...(command === "verify" ? {} : { signInPassword: devPassword }),
        storageObjectsUploaded:
          command === "verify"
            ? undefined
            : Boolean(
                result.seeded?.canvas_artifact_path &&
                  result.seeded?.submission_attachment_path,
              ),
        supabaseUrl,
        userId: result.authUser.id,
        seeded: result.verified,
      },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
