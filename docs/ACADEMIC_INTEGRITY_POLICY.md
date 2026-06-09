# Academic Integrity Policy

Status: Prompt 25 policy for WriteWise AI coaching and review. This policy is
implemented today in local mobile AI coach guards and framework-neutral backend
AI service scaffolds. A production backend AI provider is not connected yet.

## Product Rule

WriteWise is a learning app. AI features must help students think, plan, draft,
revise, and improve their own writing. They must not complete assignments,
produce final drafts for submission, or silently replace student thinking.

## Allowed Coaching

Approved student-facing actions:

- Give me a hint
- Help me brainstorm
- Check my sentence
- Explain this mistake
- Help me revise
- Suggest a stronger word
- Ask me a question

Allowed AI output shape:

- One strength.
- One improvement.
- One next revision task or guiding question.
- Age-appropriate wording by grade band.
- Bounded examples for learning only, not a full replacement answer.

## Blocked Requests

The app and backend scaffolds must block or redirect requests that ask for:

- Full essay, assignment, homework, paper, or response completion.
- Full, whole, final, polished, or entire draft rewrites.
- Direct answers, solutions, or "what to submit" language.
- Any action that bypasses student-authored drafting or revision.

Blocked requests should return a safety-blocked state or `422 ai_safety.*`
error and redirect the student toward approved coaching actions such as hints,
brainstorming, guiding questions, sentence checks, or focused revision help.

## Current Guardrails

Mobile:

- `apps/mobile/src/features/ai-coach/services/academicIntegrityService.ts`
  evaluates cheating-oriented language and returns approved redirect actions.
- `apps/mobile/src/features/ai-coach/services/aiCoachPolicyService.ts` blocks
  unsupported actions, assignment-completion intent, full-rewrite intent, answer
  requests, and unsafe output before display.
- `apps/mobile/src/features/ai-coach/components/AiCoachDrawer.tsx` exposes only
  approved coaching CTAs with accessibility labels and grade-band adaptation.

Backend scaffold:

- `services/api/src/features/ai/safety/academic-integrity.service.ts` evaluates
  student requests, model output, teacher prompts, and student work.
- `services/api/src/features/ai/safety/ai-safety-policy.service.ts` applies
  academic-integrity decisions to AI coach and AI review requests and outputs.
- `services/api/src/features/ai/prompts/ai-prompt-builder.service.ts` builds
  grade-aware prompts with coaching-only response rules.
- `services/api/src/features/ai/moderation/ai-moderation.service.ts` provides a
  deterministic input/output moderation placeholder.
- `services/api/src/features/audit/` scaffolds metadata-only audit events for AI
  safety blocks.

## Grade Adaptation

| Grade Band | Integrity Requirement |
| --- | --- |
| Grades 1-5 | Use simple wording, larger controls, fewer visible metrics, and friendly prompts that ask the student to add one idea or reread one sentence. |
| Grades 6-8 | Use structured cards for planning, paragraph decisions, sentence checks, and focused revision. |
| Grades 9-12 | Support mature essay planning, thesis/evidence/analysis checks, rubric detail, and productivity-focused revision decisions without generating final prose. |

## Parent And Teacher Boundaries

Parents and teachers can view progress, summaries, bounded excerpts, feedback
summaries, and coaching guidance within their authorized relationship scope.
They cannot ask AI to complete student work, submit assignments for students, or
turn feedback into a finished replacement draft.

Teacher-created prompts and teacher comments must also pass academic-integrity
and age-appropriate checks before publication or display in a production backend.

## Audit Requirements

The future backend must audit:

- AI coach safety blocks.
- AI review safety blocks.
- Teacher prompt safety blocks.
- Admin access to AI safety metadata.
- Any policy override or moderation escalation if such workflows are introduced.

Audit records must include actor ID, role, action, target type, target ID,
request ID, result, timestamp, and safety flags. They must not include full
student writing, full prompts, provider payloads, model credentials, or
service-role secrets.
