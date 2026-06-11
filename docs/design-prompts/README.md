# WriterHabit AI — Design Prompts

One prompt file per feature. Each file is **standalone**: paste the entire file into Claude design (or any design agent) as a single prompt and it will produce a prototype for that one feature in **3 distinct versions**.

Every prompt embeds the shared design guide (brand, integrity rules, copy system, exact color tokens from `apps/mobile/src/design/tokens/colors.ts`) plus a feature brief grounded in the real product copy from `apps/mobile/src/shared/i18n/en.ts`.

| # | File | Feature | Screens covered |
|---|------|---------|-----------------|
| 01 | [01-auth.md](01-auth.md) | Auth & Launch | Launch, Welcome, Sign In, Sign Up |
| 02 | [02-onboarding.md](02-onboarding.md) | Onboarding | Role, Grade, Goals, Confidence, Daily Goal, Plan Summary |
| 03 | [03-student-home.md](03-student-home.md) | Student Home | Dashboard + tab bar |
| 04 | [04-assignments.md](04-assignments.md) | Assignments | History, Detail, Submission |
| 05 | [05-writing-workspace.md](05-writing-workspace.md) | Writing Workspace | Workspace, Outline Builder |
| 06 | [06-ai-coach.md](06-ai-coach.md) | AI Coach | Coach drawer + response states |
| 07 | [07-canvas.md](07-canvas.md) | Canvas | Home, Template Picker, Handwriting Canvas, Attachment |
| 08 | [08-feedback-review.md](08-feedback-review.md) | Feedback Review | AI Review Loading, Summary, Rubric, Revision, Celebration |
| 09 | [09-progress.md](09-progress.md) | Progress | Dashboard, Skill Detail, Badges, Weekly Review |
| 10 | [10-subscriptions.md](10-subscriptions.md) | Subscriptions | Paywall, Upgrade Prompt |
| 11 | [11-profile-settings.md](11-profile-settings.md) | Profile & Settings | Profile, App Settings, Accessibility |
| 12 | [12-parent.md](12-parent.md) | Parent | Home, Assignments, Review, Student Report, Settings |
| 13 | [13-teacher.md](13-teacher.md) | Teacher | Dashboard, Assignments, Create, Submissions, Review, Class Progress |

## How to use

1. Open a prompt file and copy the whole thing.
2. Paste it into Claude design as one message.
3. The agent returns 3 labeled versions (A/B/C) — pick a direction or remix.
4. Iterate inside the design tool; the "What must stay constant" section keeps revisions on-brand.
