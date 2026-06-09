# Flow 1: Student First Assignment

Purpose: verify a student can onboard, start a daily assignment, submit their own writing, review coaching feedback, complete one revision task, and see progress update.

Preconditions:

- app is launched with a clean student session or deterministic mock auth session
- assignment, AI review, progress, and entitlement scenarios are set to success
- no real AI provider is called

Scenario:

1. Open the app at the welcome/auth entry.
2. Sign in or enter the demo student session.
3. Select the student role.
4. Select grade 7.
5. Choose writing goals that include paragraph writing and grammar.
6. Select a writing confidence level.
7. Select a daily practice goal.
8. Confirm the personalized plan summary.
9. Land on the student home dashboard.
10. Open today's assignment.
11. Confirm the assignment detail screen shows start-writing and canvas options.
12. Start writing.
13. Enter an original student draft that answers the prompt.
14. Submit the assignment.
15. Wait for the AI review loading state to show coaching copy.
16. Open the feedback summary.
17. Open rubric scores and return to feedback.
18. Start the revision task.
19. Revise one sentence in the student's own words.
20. Submit the revision.
21. Confirm the completion state appears.
22. Open progress and verify streak, points, or badge progress updated.

Safety assertions:

- no screen shows "Write my essay", "Give me the answer", "Generate final draft", or equivalent cheating actions
- feedback includes one strength, one improvement, and one next revision task
- revision flow asks the student to edit their own writing instead of replacing it

Accessibility assertions:

- primary actions have accessible labels
- loading, error, empty, and success states have clear labels
- grade 7 uses middle-grade density with structured learning cards
