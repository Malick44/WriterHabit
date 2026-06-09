# Prompt 02 — 02 Repo Audit And Implementation Plan

You are a senior software architect.

Use `00_CONTEXT_BRIEF.md` and `prompts/01_master_agent_rules.md` as required context.

## Goal

Audit the current repository and create a practical implementation plan before feature work begins.

## Files and Folders to Create or Update

- `docs/IMPLEMENTATION_PLAN.md`
- `docs/ARCHITECTURE_DECISIONS.md`
- `docs/FEATURE_ROADMAP.md`

## Required Tasks

1. Inspect repository structure and package manager
2. Detect Expo Router, TypeScript, TanStack Query, Zustand, React Hook Form, Zod, localization, testing framework
3. Identify existing components, routes, screens, services, and theme files
4. Identify files that should not be touched
5. Propose migration to feature-based architecture
6. Create a phased implementation roadmap

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

- No product features are implemented in this step
- Architecture docs are created
- Risk areas are clearly documented
- Next prompt is identified

## Final Response Required from Agent

After implementation, respond with:

1. Summary of what changed.
2. Files created or modified.
3. Tests run and results.
4. Known limitations.
5. Next recommended prompt.
