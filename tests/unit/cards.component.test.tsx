import { fireEvent, render } from "@testing-library/react-native";
import { Text } from "react-native";

import { Card } from "@/shared/components/cards";
import { ChoiceCard } from "@/shared/components/forms";
import { I18nProvider } from "@/shared/i18n";
import { DailyAssignmentCard } from "@/features/assignments/components/DailyAssignmentCard";
import { FeedbackSummaryCard } from "@/features/feedback-review/components/FeedbackSummaryCard";
import type { FeedbackReview } from "@/features/feedback-review/types";
import type { Assignment } from "@WriterHabit/shared";

function createAssignment(): Assignment {
  return {
    assignmentType: "paragraph_writing",
    difficulty: "moderate",
    estimatedMinutes: 15,
    gradeLevelMax: 8,
    gradeLevelMin: 6,
    id: "assignment-1",
    prompt: "Explain why practice helps writers improve.",
    rubricId: "rubric-1",
    skillFocus: ["clarity"],
    title: "Practice paragraph",
  };
}

function createFeedbackReview(): FeedbackReview {
  return {
    assignmentId: "assignment-1",
    assignmentPrompt: "Explain why practice helps writers improve.",
    assignmentTitle: "Practice paragraph",
    assignmentType: "paragraph_writing",
    connectionStatus: "online",
    createdAt: "2026-06-09T09:00:00.000Z",
    gradeLevel: 7,
    grammarSuggestions: [
      {
        explanation: "A sentence boundary may be clearer with punctuation.",
        id: "sentence-boundary",
        originalExcerpt: "Practice helps writers improve because feedback shows what to try next.",
        studentAction: "Check one long sentence and decide where it should end.",
        title: "Sentence boundary",
      },
    ],
    id: "feedback-1",
    progressEarned: {
      minutes: 8,
      points: 24,
      skill: "clarity",
    },
    rubricScores: [
      {
        coachingNote: "Your main idea is on track.",
        criterionId: "claim",
        description: "The paragraph has one clear idea.",
        label: "Claim",
        level: "meeting",
        maxScore: 4,
        score: 3,
      },
    ],
    revisionTask: {
      focusLabel: "Paragraph clarity",
      guidingQuestion: "Which sentence needs one clearer reason?",
      id: "revision-1",
      instruction: "Revise one sentence so it explains the reason more clearly.",
      originalExcerpt: "Practice helps writers improve because feedback shows what to try next.",
      targetSkill: "clarity",
    },
    status: "completed",
    studentId: "student-1",
    submissionId: "submission-1",
    submittedTextExcerpt: "Practice helps writers improve because feedback shows what to try next.",
    summary: {
      improvement: "Add one reason that makes your idea clearer.",
      nextRevisionTask: "Revise one sentence with one more detail.",
      strength: "You answered the prompt in your own words.",
    },
  };
}

describe("shared and feature card components", () => {
  it("renders a pressable shared card with an accessible button role", async () => {
    const onPress = jest.fn();
    const { getByLabelText, getByText } = await render(
      <Card
        accessibilityHint="Open the practice details."
        accessibilityLabel="Practice details"
        onPress={onPress}
        title="Daily practice"
      >
        <Text>Keep one focused writing habit.</Text>
      </Card>,
    );

    await fireEvent.press(getByLabelText("Practice details"));

    expect(getByText("Daily practice")).toBeTruthy();
    expect(getByText("Keep one focused writing habit.")).toBeTruthy();
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders a choice card with selected state and grade-adapted touch behavior", async () => {
    const onPress = jest.fn();
    const { getByLabelText, getByTestId, getByText } = await render(
      <ChoiceCard
        accessibilityHint="Choose this writing goal."
        accessibilityLabel="Improve paragraphs"
        description="Practice clear topic sentences and support."
        gradeBand="elementary"
        label="Paragraphs"
        onPress={onPress}
        selected
        testID="goal-choice-card"
      />,
    );

    await fireEvent.press(getByLabelText("Improve paragraphs"));

    expect(getByText("Paragraphs")).toBeTruthy();
    expect(getByText("Practice clear topic sentences and support.")).toBeTruthy();
    expect(getByTestId("goal-choice-card").props.accessibilityState).toMatchObject({
      disabled: false,
      selected: true,
    });
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders assignment card content without adding assignment-completion actions", async () => {
    const { getByText, queryByText } = await render(
      <DailyAssignmentCard assignment={createAssignment()} />,
    );

    expect(getByText("Practice paragraph")).toBeTruthy();
    expect(getByText("Explain why practice helps writers improve.")).toBeTruthy();
    expect(getByText("15 min")).toBeTruthy();
    expect(queryByText(/write my essay/i)).toBeNull();
    expect(queryByText(/generate final draft/i)).toBeNull();
  });

  it("renders feedback summary actions as coaching and calls the expected handlers", async () => {
    const onRevisionPress = jest.fn();
    const onRubricPress = jest.fn();
    const { getByLabelText, getByText, queryByText } = await render(
      <I18nProvider>
        <FeedbackSummaryCard
          gradeBand="middle"
          onRevisionPress={onRevisionPress}
          onRubricPress={onRubricPress}
          progressValue={0.75}
          review={createFeedbackReview()}
        />
      </I18nProvider>,
    );

    await fireEvent.press(getByLabelText("View rubric scores"));
    await fireEvent.press(getByLabelText("Start revision task"));

    expect(getByText("Strength")).toBeTruthy();
    expect(getByText("You answered the prompt in your own words.")).toBeTruthy();
    expect(getByText("Start revision task")).toBeTruthy();
    expect(queryByText(/finish for me/i)).toBeNull();
    expect(queryByText(/give me the answer/i)).toBeNull();
    expect(onRubricPress).toHaveBeenCalledTimes(1);
    expect(onRevisionPress).toHaveBeenCalledTimes(1);
  });
});
