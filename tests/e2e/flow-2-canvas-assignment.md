# Flow 2: Canvas Assignment

Purpose: verify a student can plan or handwrite with canvas, attach the canvas to an assignment, submit, and review feedback without losing local work.

Preconditions:

- app is launched with a deterministic student session
- canvas, assignment, and feedback scenarios are set to success
- backend canvas sync remains provider-free unless a test backend is intentionally configured
- no real AI provider is called

Scenario:

1. Open the student home dashboard.
2. Open today's assignment.
3. Choose the canvas option.
4. Open the canvas template picker.
5. Select a grade-appropriate template.
6. Draw or handwrite at least one stroke on the canvas.
7. Save the canvas.
8. Attach the canvas to the assignment.
9. Return to the writing workspace.
10. Confirm the attached canvas preview or summary is visible.
11. Add a short typed note in the student's own words.
12. Submit the assignment.
13. Open feedback when the review is ready.
14. Confirm feedback focuses on coaching and a next revision task.

Safety assertions:

- canvas work is preserved as student work and is not replaced by generated text
- feedback does not provide a polished full rewrite
- coach actions remain hint, brainstorm, sentence check, explain mistake, revise help, stronger word, or ask question

Offline and recovery assertions:

- if the device goes offline after saving, the canvas shows saved/offline state instead of losing strokes
- attaching a missing canvas shows a recoverable error path
- submission remains blocked when no typed or canvas work exists

Accessibility assertions:

- canvas toolbar controls have accessible labels
- attachment and submit actions have accessible labels and hints
- elementary grades use larger controls and simplified template detail, while high school grades keep detailed rubric/template affordances
