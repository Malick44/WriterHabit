# Prompt 27 — 27 Final Qa Release Checklist

You are a senior release engineer and product QA lead.

Use `00_CONTEXT_BRIEF.md` and `prompts/01_master_agent_rules.md` as required context.

## Goal

Perform final MVP readiness QA and create release checklist.

## Files and Folders to Create or Update

- `docs/FINAL_QA_REPORT.md`
- `docs/RELEASE_CHECKLIST.md`
- `docs/KNOWN_ISSUES.md`

## Required Tasks

1. Check architecture boundaries
2. Verify Flow 1 and Flow 2
3. Verify parent, teacher, paywall flows
4. Run typecheck, lint, tests, build check
5. Check loading/empty/error/offline states
6. Check AI safety CTAs and policies
7. Create realistic readiness score

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

- QA report exists
- Release checklist exists
- Known issues exist
- Final response includes readiness score and priority fixes

## Final Response Required from Agent

After implementation, respond with:

1. Summary of what changed.
2. Files created or modified.
3. Tests run and results.
4. Known limitations.
5. Next recommended prompt.
