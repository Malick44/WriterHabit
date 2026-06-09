# Prompt Index

Primary prompt order is maintained in `docs/00_PROMPT_ORDER.md`.

## Required Context

Before every implementation, review, debugging, documentation, or planning task, read:

1. `AGENTS.md`
2. `docs/00_CONTEXT_BRIEF.md`
3. `prompts/01_master_agent_rules.md`
4. `.codex/EXECUTION_STATE.md`

Then read the selected prompt and any relevant project skill.

## Implementation Prompts

1. `prompts/01_master_agent_rules.md`
2. `prompts/02_repo_audit_and_implementation_plan.md`
3. `prompts/03_project_scaffold_expo_router.md`
4. `prompts/04_design_system_and_shared_ui.md`
5. `prompts/05_navigation_and_role_routing.md`
6. `prompts/06_localization_accessibility_foundation.md`
7. `prompts/07_auth_and_session_flow.md`
8. `prompts/08_student_onboarding_flow.md`
9. `prompts/09_student_home_dashboard.md`
10. `prompts/10_assignment_feature.md`
11. `prompts/11_typed_writing_workspace.md`
12. `prompts/12_canvas_feature.md`
13. `prompts/13_ai_coach_feature.md`
14. `prompts/14_ai_review_feedback_revision.md`
15. `prompts/15_progress_tracking_and_badges.md`
16. `prompts/16_notifications_and_daily_assignment_logic.md`
17. `prompts/17_parent_experience.md`
18. `prompts/18_teacher_experience.md`
19. `prompts/19_subscription_and_paywall.md`
20. `prompts/20_backend_api_contract.md`
21. `prompts/21_database_schema_and_migrations.md`
22. `prompts/22_ai_backend_services.md`
23. `prompts/23_canvas_storage_and_sync.md`
24. `prompts/24_testing_strategy_implementation.md`
25. `prompts/25_security_privacy_academic_integrity.md`
26. `prompts/26_performance_offline_and_error_states.md`
27. `prompts/27_final_qa_release_checklist.md`

## Specialist Prompts

- `prompts/specialists/ai_safety_review_agent.md`
- `prompts/specialists/asset_generation_agent.md`
- `prompts/specialists/backend_review_agent.md`
- `prompts/specialists/design_review_agent.md`
- `prompts/specialists/frontend_polish_agent.md`
- `prompts/specialists/product_manager_review_agent.md`
- `prompts/specialists/testing_agent.md`

Automated Codex specialist actions are configured in `.codex/environments/environment.toml` and backed by `script/review_agent.sh`.

## Screen Design Prompts

Screen design prompts live in `prompts/writewise_screen_design_prompts/`.

Use `prompts/writewise_screen_design_prompts/MASTER_SYSTEM_PROMPT.md` before any screen-specific prompt in that folder.
