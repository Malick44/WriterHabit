# Child Safety Requirements

Status: Prompt 25 child-safety requirements for the current Expo mobile app and
planned backend. These requirements are engineering guardrails, not a legal
compliance certification.

## Safety Principles

- WriterHabit serves students in Grades 1-12, so privacy, age-appropriate coaching,
  and student-owned work are core requirements.
- AI must coach. It must not complete assignments, produce final drafts for
  submission, or encourage cheating.
- Student writing, canvas content, feedback, and progress are sensitive
  educational records and must be handled with least privilege.
- Parent and teacher visibility must support learning and safety without
  exposing more student content than needed.

## Age-Appropriate Product Rules

| Grade Band | Requirements |
| --- | --- |
| Grades 1-5 | Simple language, large controls, friendly cues, fewer visible metrics, read-aloud affordances where implemented, and one-step coaching. |
| Grades 6-8 | Structured planning and revision cards, paragraph support, clear recovery states, and coaching that explains one decision at a time. |
| Grades 9-12 | Mature layout, essay-planning support, rubric detail, evidence/analysis guidance, and no final-draft generation. |

## AI Child-Safety Requirements

- Moderate AI input and output before showing a student any generated coaching.
- Keep all coaching responses bounded to one strength, one improvement, one next
  revision task, and one optional guiding question.
- Do not store model-provider secrets or service credentials in mobile code or
  client-visible payloads.
- Do not use student data to train models unless an explicit future consent and
  policy process exists.
- Offline coaching must degrade to non-generative helpers unless safety and
  academic-integrity checks can still run.
- Parent restrictions for AI coach access must be enforced by the backend once
  parent settings are persisted server-side.

Current implementation:

- Mobile AI coach guardrails live under `apps/mobile/src/features/ai-coach/`.
- Backend AI safety scaffolds live under `services/api/src/features/ai/safety/`.
- Current AI calls are deterministic local or mock service boundaries, not a
  connected model provider.

## Access And Supervision Requirements

- Students can access only their own writing, canvas, feedback, and progress.
- Parents can access linked-student reports and summaries through active links.
- Teachers can access students only in classes they own.
- Admin access is operational, scoped, and audited.
- Parent-student link changes and class roster changes must be audited in the
  future backend.
- User-facing copy and accessibility labels must remain localization-ready.

## Unsafe Content And Escalation Requirements

The production backend must be able to block age-inappropriate, self-harm,
sexual, violent, hateful, or harassment content according to the selected safety
provider and internal policy.

Minimum handling:

- Return a localized, age-appropriate blocked state for the student.
- Preserve the student's draft locally where applicable.
- Write metadata-only audit and safety events.
- Avoid sending unsafe content to parent/teacher dashboards without an explicit
  safety review workflow.
- Provide future escalation hooks for support or school/family safety workflows
  before shipping production moderation.

## Communication And Social Features

WriterHabit currently has no student-to-student messaging or public sharing
surfaces. Future communication features must require a separate safety design,
moderation plan, reporting flow, audit plan, and parent/teacher visibility model
before implementation.

## Data Safety Requirements

- Use encrypted transport for backend traffic.
- Keep auth tokens and sensitive session data in secure storage.
- Keep local drafts and canvas JSON in non-secret local storage with bounded
  payload sizes and validation.
- Use server-side authorization and RLS for persisted student data.
- Use signed URLs for canvas/object access once object storage is connected.
- Do not write secrets, raw provider payloads, full prompts, full student
  writing, raw push tokens, or service-role keys to logs or audit metadata.
