# 02 — Screen to Feature Map

This file maps current mobile route files to their owning feature modules. It should stay aligned with `apps/mobile/app/`.

## Entry and Auth

| Screen | Route file | Feature |
|---|---|---|
| Launch redirect | `apps/mobile/app/index.tsx` | auth |
| Welcome / auth entry / demo roles | `apps/mobile/app/(auth)/welcome.tsx` | auth |
| Sign in | `apps/mobile/app/(auth)/sign-in.tsx` | auth |
| Sign up | `apps/mobile/app/(auth)/sign-up.tsx` | auth |
| Fallback not found | `apps/mobile/app/+not-found.tsx` | auth |

## Student Onboarding

| Screen | Route file | Feature |
|---|---|---|
| Role selection / onboarding gate | `apps/mobile/app/(onboarding)/role-selection.tsx` | onboarding |
| Grade selection | `apps/mobile/app/(onboarding)/grade-selection.tsx` | onboarding |
| Writing goals | `apps/mobile/app/(onboarding)/writing-goals.tsx` | onboarding |
| Writing confidence | `apps/mobile/app/(onboarding)/writing-confidence.tsx` | onboarding |
| Daily practice goal | `apps/mobile/app/(onboarding)/daily-practice-goal.tsx` | onboarding |
| Personalized plan summary | `apps/mobile/app/(onboarding)/plan-summary.tsx` | onboarding |

## Student App

| Screen | Route file | Feature |
|---|---|---|
| Student home dashboard | `apps/mobile/app/(student)/home.tsx` | student-home |
| Assignment history | `apps/mobile/app/(student)/assignments/history.tsx` | assignments |
| Daily assignment detail | `apps/mobile/app/(student)/assignments/[assignmentId].tsx` | assignments |
| Assignment submission confirmation | `apps/mobile/app/(student)/assignments/submit.tsx` | assignments |
| Typed writing workspace | `apps/mobile/app/(student)/write/[assignmentId].tsx` | writing-workspace |
| AI review loading | `apps/mobile/app/(student)/review/[submissionId]/index.tsx` | feedback-review |
| Feedback summary | `apps/mobile/app/(student)/review/[submissionId]/summary.tsx` | feedback-review |
| Rubric score | `apps/mobile/app/(student)/review/[submissionId]/rubric.tsx` | feedback-review |
| Revision task | `apps/mobile/app/(student)/review/[submissionId]/revision.tsx` | feedback-review |
| Completion celebration | `apps/mobile/app/(student)/review/[submissionId]/complete.tsx` | feedback-review |
| Student progress dashboard | `apps/mobile/app/(student)/progress.tsx` | progress |
| Student profile | `apps/mobile/app/(student)/profile.tsx` | profile-settings |

## Canvas

| Screen | Route file | Feature |
|---|---|---|
| Canvas home | `apps/mobile/app/(student)/canvas/index.tsx` | canvas |
| Canvas template picker | `apps/mobile/app/(student)/canvas/templates.tsx` | canvas |
| Handwriting canvas | `apps/mobile/app/(student)/canvas/[canvasId].tsx` | canvas |

## Parent

| Screen | Route file | Feature |
|---|---|---|
| Parent home | `apps/mobile/app/(parent)/home.tsx` | parent |
| Reports tab | `apps/mobile/app/(parent)/reports.tsx` | parent |
| Student report detail | `apps/mobile/app/(parent)/students/[studentId]/report.tsx` | parent |
| Assignments tab | `apps/mobile/app/(parent)/assignments/index.tsx` | parent |
| Assignment review detail | `apps/mobile/app/(parent)/assignments/[submissionId].tsx` | parent |
| Parent settings tab | `apps/mobile/app/(parent)/settings.tsx` | profile-settings |

## Teacher

| Screen | Route file | Feature |
|---|---|---|
| Teacher dashboard | `apps/mobile/app/(teacher)/dashboard.tsx` | teacher |
| Assignments tab | `apps/mobile/app/(teacher)/assignments/index.tsx` | teacher |
| Create assignment | `apps/mobile/app/(teacher)/assignments/create.tsx` | teacher |
| Submissions tab | `apps/mobile/app/(teacher)/submissions/index.tsx` | teacher |
| Submission review detail | `apps/mobile/app/(teacher)/submissions/[submissionId].tsx` | teacher |

## Monetization

| Screen | Route file | Feature |
|---|---|---|
| Guarded paywall | `apps/mobile/app/paywall.tsx` | subscriptions |

## Embedded Feature UI

| Screen | Route | Feature |
|---|---|---|
| AI coach drawer | embedded in `apps/mobile/src/features/writing-workspace/components/CoachEntryPanel.tsx` | ai-coach |
