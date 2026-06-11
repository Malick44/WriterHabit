# Screen Design Prompts

Screen-specific design prompts live in:

`prompts/WriterHabit_screen_design_prompts/`

## Required First Read

Before using any screen-specific prompt, read:

1. `docs/00_CONTEXT_BRIEF.md`
2. `prompts/01_master_agent_rules.md`
3. `prompts/WriterHabit_screen_design_prompts/MASTER_SYSTEM_PROMPT.md`
4. `prompts/WriterHabit_screen_design_prompts/README.md`
5. `prompts/WriterHabit_screen_design_prompts/SCREEN_INVENTORY.md`

## Usage

Use one screen prompt at a time. Keep implementation aligned with:

- feature-based architecture in `apps/mobile/src/features/`
- thin Expo Router files in `apps/mobile/app/`
- localization-ready copy in `apps/mobile/src/shared/i18n/`
- canonical token path `apps/mobile/src/design/tokens/`
- academic-integrity rules from `prompts/01_master_agent_rules.md`

## Prompt Groups

- Public entry: `prompts/WriterHabit_screen_design_prompts/01_public_entry/`
- Student onboarding: `prompts/WriterHabit_screen_design_prompts/02_student_onboarding/`
- Student home and assignments: `prompts/WriterHabit_screen_design_prompts/03_student_home_assignments/`
- Writing workspace: `prompts/WriterHabit_screen_design_prompts/04_writing_workspace/`
- Canvas: `prompts/WriterHabit_screen_design_prompts/05_canvas/`
- Feedback and review: `prompts/WriterHabit_screen_design_prompts/06_feedback_review/`
- Progress: `prompts/WriterHabit_screen_design_prompts/07_progress/`
- Parent: `prompts/WriterHabit_screen_design_prompts/08_parent/`
- Teacher: `prompts/WriterHabit_screen_design_prompts/09_teacher/`
- Profile and settings: `prompts/WriterHabit_screen_design_prompts/10_profile_settings/`
- Subscription: `prompts/WriterHabit_screen_design_prompts/11_subscription/`
- Edge states: `prompts/WriterHabit_screen_design_prompts/12_edge_states/`

## Helpful Commands

List all screen prompts:

```bash
find prompts/WriterHabit_screen_design_prompts -type f -name '*.md' | sort
```

Open the inventory:

```bash
sed -n '1,220p' prompts/WriterHabit_screen_design_prompts/SCREEN_INVENTORY.md
```
