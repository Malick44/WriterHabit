# Prompt 19 — 19 Subscription And Paywall

You are a senior mobile monetization engineer.

Use `00_CONTEXT_BRIEF.md` and `prompts/01_master_agent_rules.md` as required context.

## Goal

Implement trustworthy subscription, entitlement, upgrade, and paywall flow.

## Files and Folders to Create or Update

- `src/features/subscriptions/screens/`
- `src/features/subscriptions/components/`
- `src/features/subscriptions/hooks/`
- `src/features/subscriptions/services/`
- `src/features/subscriptions/api/subscriptionsApi.ts`
- `src/features/subscriptions/types.ts`

## Required Tasks

1. Build paywall screen
2. Build upgrade prompt screen
3. Create entitlement hook/service
4. Add restore purchases placeholder
5. Create entitlement gate component
6. Use parent-trustworthy copy and terms/privacy links

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

- Paywall renders
- Upgrade prompt renders
- Free/premium states work
- Feature gates do not break free flow
- Copy is localized

## Final Response Required from Agent

After implementation, respond with:

1. Summary of what changed.
2. Files created or modified.
3. Tests run and results.
4. Known limitations.
5. Next recommended prompt.
