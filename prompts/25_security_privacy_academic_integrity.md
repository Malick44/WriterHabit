# Prompt 25 — 25 Security Privacy Academic Integrity

You are a senior security and child-safety engineer.

Use `00_CONTEXT_BRIEF.md` and `prompts/01_master_agent_rules.md` as required context.

## Goal

Implement and document security, privacy, and academic-integrity safeguards.

## Files and Folders to Create or Update

- `docs/SECURITY_PRIVACY.md`
- `docs/ACADEMIC_INTEGRITY_POLICY.md`
- `docs/CHILD_SAFETY_REQUIREMENTS.md`
- `docs/DATA_RETENTION_POLICY.md`
- `src/features/ai-coach/services/academicIntegrityService.ts`
- `services/api/src/features/audit/`

## Required Tasks

1. Document role-based access rules
2. Add AI policy guard
3. Add academic integrity redirects
4. Scaffold audit logs
5. Document data minimization and deletion
6. Document signed URL and rate limit requirements

## Product Requirements

- Preserve feature-based architecture.
- Keep route files thin.
- Use TypeScript strictly.
- Use localization-ready copy.
- Add accessibility labels to interactive controls.
- Include loading, empty, error, and success states where applicable.
- Do not add cheating-oriented AI actions.
- Do not rewrite unrelated files.

## Grade Adaptation Requirements

When the feature touches student UI, support these variants:

- Grades 1–5: larger controls, simpler wording, fewer visible metrics, friendly visual cues.
- Grades 6–8: structured learning cards, skill progress, paragraph and revision support.
- Grades 9–12: mature layout, essay tools, rubric detail, productivity-focused UI.

## Acceptance Criteria

- Security docs exist
- Academic integrity policy exists
- Client and backend policy guards are scaffolded
- Audit logging is planned

## Final Response Required from Agent

After implementation, respond with:

1. Summary of what changed.
2. Files created or modified.
3. Tests run and results.
4. Known limitations.
5. Next recommended prompt.
