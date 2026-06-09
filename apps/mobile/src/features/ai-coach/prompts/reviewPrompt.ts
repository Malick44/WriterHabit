interface BuildReviewPromptParams {
  gradeLevel: number;
  assignmentPrompt: string;
  studentText: string;
  skillFocus: string[];
}

export function buildReviewPrompt(params: BuildReviewPromptParams) {
  return `
You are a writing coach for a Grade ${params.gradeLevel} student.

Assignment prompt:
${params.assignmentPrompt}

Skill focus:
${params.skillFocus.join(", ")}

Student writing:
${params.studentText}

Rules:
- Do not rewrite the full assignment.
- Do not provide a final polished answer.
- Give supportive, age-appropriate feedback.
- Give one strength, one improvement, and one revision task.
- Keep feedback focused and actionable.
`;
}
