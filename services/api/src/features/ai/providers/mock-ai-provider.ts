import {
  MAX_AI_REVIEW_EXCERPT_LENGTH,
  type AiCoachAction,
  type AiModelProvider,
  type AiModelProviderCoachInput,
  type AiModelProviderCoachOutput,
  type AiModelProviderReviewInput,
  type AiModelProviderReviewOutput,
  type FeedbackRubricLevel,
  type GradeBand,
  type WritingSkill,
  compactWhitespace,
  createBoundedExcerpt,
  createLocalizedCopy,
  getDraftMetrics,
  getGradeBandForGrade,
} from "../contracts";

type CoachGuidance = Pick<
  AiModelProviderCoachOutput["response"],
  "coachingMessage" | "nextStep" | "questionForStudent" | "title"
>;

function getPrimarySkill(input: AiModelProviderReviewInput | AiModelProviderCoachInput): WritingSkill {
  if ("skillFocus" in input.request && input.request.skillFocus.length > 0) {
    return input.request.skillFocus[0];
  }

  return input.request.rubricCriteria.find((criterion) => criterion.skill)?.skill ?? "clarity";
}

function getSkillLabel(skill: WritingSkill): string {
  return skill.replace(/_/g, " ");
}

function getRubricLevel(score: 1 | 2 | 3 | 4): FeedbackRubricLevel {
  if (score === 4) {
    return "strong";
  }

  if (score === 3) {
    return "meeting";
  }

  if (score === 2) {
    return "building";
  }

  return "starting";
}

function getCoachGuidance(action: AiCoachAction, gradeBand: GradeBand, skill: WritingSkill): CoachGuidance {
  const skillLabel = getSkillLabel(skill);

  if (gradeBand === "elementary") {
    const elementary: Record<AiCoachAction, CoachGuidance> = {
      brainstorm: {
        coachingMessage: createLocalizedCopy(
          "aiCoach.mock.elementary.brainstorm.message",
          "Think of three tiny ideas, then pick the one that feels most like yours.",
        ),
        nextStep: createLocalizedCopy("aiCoach.mock.elementary.brainstorm.nextStep", "Circle one idea and write it your way."),
        questionForStudent: createLocalizedCopy("aiCoach.mock.elementary.brainstorm.question", "Which idea do you like best?"),
        title: createLocalizedCopy("aiCoach.mock.elementary.brainstorm.title", "Pick one idea"),
      },
      check_sentence: {
        coachingMessage: createLocalizedCopy(
          "aiCoach.mock.elementary.checkSentence.message",
          "Read one sentence slowly and check that it has a beginning, middle, and ending mark.",
        ),
        nextStep: createLocalizedCopy("aiCoach.mock.elementary.checkSentence.nextStep", "Fix one sentence you can hear clearly."),
        questionForStudent: createLocalizedCopy("aiCoach.mock.elementary.checkSentence.question", "Does the sentence tell one idea?"),
        title: createLocalizedCopy("aiCoach.mock.elementary.checkSentence.title", "Check one sentence"),
      },
      explain_grammar: {
        coachingMessage: createLocalizedCopy(
          "aiCoach.mock.elementary.explainGrammar.message",
          "Grammar is a pattern. Look for one capital letter, word space, or ending mark to check.",
        ),
        nextStep: createLocalizedCopy("aiCoach.mock.elementary.explainGrammar.nextStep", "Choose one pattern and fix it once."),
        questionForStudent: createLocalizedCopy("aiCoach.mock.elementary.explainGrammar.question", "What mark can you check first?"),
        title: createLocalizedCopy("aiCoach.mock.elementary.explainGrammar.title", "Try one grammar check"),
      },
      hint: {
        coachingMessage: createLocalizedCopy(
          "aiCoach.mock.elementary.hint.message",
          "Start with one thing you know, then add one detail in your own words.",
        ),
        nextStep: createLocalizedCopy("aiCoach.mock.elementary.hint.nextStep", "Write one sentence starter."),
        questionForStudent: createLocalizedCopy("aiCoach.mock.elementary.hint.question", "What do you already know?"),
        title: createLocalizedCopy("aiCoach.mock.elementary.hint.title", "Try one hint"),
      },
      revision_question: {
        coachingMessage: createLocalizedCopy(
          "aiCoach.mock.elementary.revisionQuestion.message",
          `Look at one ${skillLabel} choice and make it clearer.`,
        ),
        nextStep: createLocalizedCopy("aiCoach.mock.elementary.revisionQuestion.nextStep", "Pick one sentence and make it easier to read."),
        questionForStudent: createLocalizedCopy("aiCoach.mock.elementary.revisionQuestion.question", "Which sentence could be clearer?"),
        title: createLocalizedCopy("aiCoach.mock.elementary.revisionQuestion.title", "Revise one part"),
      },
      suggest_vocabulary: {
        coachingMessage: createLocalizedCopy(
          "aiCoach.mock.elementary.suggestVocabulary.message",
          "Choose one plain word and think of a word that tells the reader exactly what you mean.",
        ),
        nextStep: createLocalizedCopy("aiCoach.mock.elementary.suggestVocabulary.nextStep", "Circle one word and try a more exact word."),
        questionForStudent: createLocalizedCopy("aiCoach.mock.elementary.suggestVocabulary.question", "What word paints the clearest picture?"),
        title: createLocalizedCopy("aiCoach.mock.elementary.suggestVocabulary.title", "Try a stronger word"),
      },
    };

    return elementary[action];
  }

  if (gradeBand === "middle") {
    const middle: Record<AiCoachAction, CoachGuidance> = {
      brainstorm: {
        coachingMessage: createLocalizedCopy(
          "aiCoach.mock.middle.brainstorm.message",
          "List a claim, one detail, and one explanation before expanding the paragraph.",
        ),
        nextStep: createLocalizedCopy("aiCoach.mock.middle.brainstorm.nextStep", "Choose the idea you can support best."),
        questionForStudent: createLocalizedCopy("aiCoach.mock.middle.brainstorm.question", "Which idea has the clearest support?"),
        title: createLocalizedCopy("aiCoach.mock.middle.brainstorm.title", "Shape your idea"),
      },
      check_sentence: {
        coachingMessage: createLocalizedCopy(
          "aiCoach.mock.middle.checkSentence.message",
          "Check whether the sentence has one clear subject, action, and purpose in the paragraph.",
        ),
        nextStep: createLocalizedCopy("aiCoach.mock.middle.checkSentence.nextStep", "Revise one sentence for clarity, then reread the paragraph."),
        questionForStudent: createLocalizedCopy("aiCoach.mock.middle.checkSentence.question", "How does this sentence support the main idea?"),
        title: createLocalizedCopy("aiCoach.mock.middle.checkSentence.title", "Check sentence clarity"),
      },
      explain_grammar: {
        coachingMessage: createLocalizedCopy(
          "aiCoach.mock.middle.explainGrammar.message",
          "Name the pattern first, then fix only that pattern so the sentence stays yours.",
        ),
        nextStep: createLocalizedCopy("aiCoach.mock.middle.explainGrammar.nextStep", "Mark the spot where the sentence becomes unclear."),
        questionForStudent: createLocalizedCopy("aiCoach.mock.middle.explainGrammar.question", "What pattern do you notice?"),
        title: createLocalizedCopy("aiCoach.mock.middle.explainGrammar.title", "Understand the pattern"),
      },
      hint: {
        coachingMessage: createLocalizedCopy(
          "aiCoach.mock.middle.hint.message",
          "Turn the prompt into one focused writing task before adding more sentences.",
        ),
        nextStep: createLocalizedCopy("aiCoach.mock.middle.hint.nextStep", "Underline the task word and draft one topic sentence."),
        questionForStudent: createLocalizedCopy("aiCoach.mock.middle.hint.question", "What does the prompt ask you to prove or explain?"),
        title: createLocalizedCopy("aiCoach.mock.middle.hint.title", "Find the task"),
      },
      revision_question: {
        coachingMessage: createLocalizedCopy(
          "aiCoach.mock.middle.revisionQuestion.message",
          `Strengthen one ${skillLabel} move with a clearer detail or explanation.`,
        ),
        nextStep: createLocalizedCopy("aiCoach.mock.middle.revisionQuestion.nextStep", "Choose one sentence and add or clarify the support."),
        questionForStudent: createLocalizedCopy("aiCoach.mock.middle.revisionQuestion.question", "Which sentence needs more support?"),
        title: createLocalizedCopy("aiCoach.mock.middle.revisionQuestion.title", "Focus the revision"),
      },
      suggest_vocabulary: {
        coachingMessage: createLocalizedCopy(
          "aiCoach.mock.middle.suggestVocabulary.message",
          "Replace one vague word with a precise word that fits your sentence and voice.",
        ),
        nextStep: createLocalizedCopy("aiCoach.mock.middle.suggestVocabulary.nextStep", "Test the new word by reading the sentence once."),
        questionForStudent: createLocalizedCopy("aiCoach.mock.middle.suggestVocabulary.question", "Which word would make the meaning more exact?"),
        title: createLocalizedCopy("aiCoach.mock.middle.suggestVocabulary.title", "Make wording precise"),
      },
    };

    return middle[action];
  }

  const high: Record<AiCoachAction, CoachGuidance> = {
    brainstorm: {
      coachingMessage: createLocalizedCopy(
        "aiCoach.mock.high.brainstorm.message",
        "Separate possible claims from evidence before deciding which direction to draft.",
      ),
      nextStep: createLocalizedCopy("aiCoach.mock.high.brainstorm.nextStep", "Draft a short plan: claim, evidence, analysis, revision check."),
      questionForStudent: createLocalizedCopy("aiCoach.mock.high.brainstorm.question", "Which idea can become a defensible claim?"),
      title: createLocalizedCopy("aiCoach.mock.high.brainstorm.title", "Plan the argument"),
    },
    check_sentence: {
      coachingMessage: createLocalizedCopy(
        "aiCoach.mock.high.checkSentence.message",
        "Check whether the sentence advances the claim, explains evidence, or clarifies reasoning.",
      ),
      nextStep: createLocalizedCopy("aiCoach.mock.high.checkSentence.nextStep", "Revise one sentence for purpose, then read it in context."),
      questionForStudent: createLocalizedCopy("aiCoach.mock.high.checkSentence.question", "What job does this sentence do?"),
      title: createLocalizedCopy("aiCoach.mock.high.checkSentence.title", "Check sentence purpose"),
    },
    explain_grammar: {
      coachingMessage: createLocalizedCopy(
        "aiCoach.mock.high.explainGrammar.message",
        "Diagnose whether the issue is grammar, clarity, evidence, or reasoning before revising.",
      ),
      nextStep: createLocalizedCopy("aiCoach.mock.high.explainGrammar.nextStep", "Label the issue, then revise only that issue."),
      questionForStudent: createLocalizedCopy("aiCoach.mock.high.explainGrammar.question", "What kind of issue is this?"),
      title: createLocalizedCopy("aiCoach.mock.high.explainGrammar.title", "Diagnose the issue"),
    },
    hint: {
      coachingMessage: createLocalizedCopy(
        "aiCoach.mock.high.hint.message",
        "Convert the prompt into a specific writing objective before changing the draft.",
      ),
      nextStep: createLocalizedCopy("aiCoach.mock.high.hint.nextStep", "Write a working claim or purpose statement in your own words."),
      questionForStudent: createLocalizedCopy("aiCoach.mock.high.hint.question", "What must the response argue, explain, or prove?"),
      title: createLocalizedCopy("aiCoach.mock.high.hint.title", "Clarify the objective"),
    },
    revision_question: {
      coachingMessage: createLocalizedCopy(
        "aiCoach.mock.high.revisionQuestion.message",
        `Target one ${skillLabel} decision instead of revising everything at once.`,
      ),
      nextStep: createLocalizedCopy("aiCoach.mock.high.revisionQuestion.nextStep", "Choose one paragraph or sentence and make a focused revision plan."),
      questionForStudent: createLocalizedCopy("aiCoach.mock.high.revisionQuestion.question", "Which revision would most improve the reasoning?"),
      title: createLocalizedCopy("aiCoach.mock.high.revisionQuestion.title", "Choose a revision move"),
    },
    suggest_vocabulary: {
      coachingMessage: createLocalizedCopy(
        "aiCoach.mock.high.suggestVocabulary.message",
        "Choose vocabulary that clarifies the idea rather than decorating it.",
      ),
      nextStep: createLocalizedCopy("aiCoach.mock.high.suggestVocabulary.nextStep", "Replace one imprecise word and check that the meaning is still yours."),
      questionForStudent: createLocalizedCopy("aiCoach.mock.high.suggestVocabulary.question", "Which word best matches the tone and purpose?"),
      title: createLocalizedCopy("aiCoach.mock.high.suggestVocabulary.title", "Refine the wording"),
    },
  };

  return high[action];
}

function getReviewSummary(gradeBand: GradeBand, skill: WritingSkill) {
  const skillLabel = getSkillLabel(skill);

  switch (gradeBand) {
    case "elementary":
      return {
        improvement: createLocalizedCopy(
          "aiReview.mock.elementary.summary.improvement",
          "Add one more clear detail so the reader can picture your idea.",
        ),
        nextRevisionTask: createLocalizedCopy(
          "aiReview.mock.elementary.summary.nextRevisionTask",
          "Choose one sentence and add a describing word or detail in your own words.",
        ),
        strength: createLocalizedCopy(
          "aiReview.mock.elementary.summary.strength",
          "You shared an idea that connects to the prompt.",
        ),
      };
    case "middle":
      return {
        improvement: createLocalizedCopy(
          "aiReview.mock.middle.summary.improvement",
          `Strengthen one ${skillLabel} move with a clearer detail or explanation.`,
          { skill: skillLabel },
        ),
        nextRevisionTask: createLocalizedCopy(
          "aiReview.mock.middle.summary.nextRevisionTask",
          "Revise one sentence so it explains the reason more clearly.",
        ),
        strength: createLocalizedCopy(
          "aiReview.mock.middle.summary.strength",
          "Your draft has a focused response that can become a stronger paragraph.",
        ),
      };
    case "high":
      return {
        improvement: createLocalizedCopy(
          "aiReview.mock.high.summary.improvement",
          `Deepen one ${skillLabel} choice so the reasoning is easier to follow.`,
          { skill: skillLabel },
        ),
        nextRevisionTask: createLocalizedCopy(
          "aiReview.mock.high.summary.nextRevisionTask",
          "Revise one claim, evidence, or analysis sentence to explain why it matters.",
        ),
        strength: createLocalizedCopy(
          "aiReview.mock.high.summary.strength",
          "Your draft gives the assignment a clear direction and leaves room for a focused revision.",
        ),
      };
  }
}

export class MockAiProvider implements AiModelProvider {
  readonly kind = "mock" as const;

  async generateCoachResponse(input: AiModelProviderCoachInput): Promise<AiModelProviderCoachOutput> {
    const gradeBand = getGradeBandForGrade(input.request.gradeLevel);
    const guidance = getCoachGuidance(input.request.action, gradeBand, getPrimarySkill(input));

    return {
      requestId: `mock-coach-${input.request.studentAssignmentId}-${input.request.action}`,
      response: {
        ...guidance,
        action: input.request.action,
        safetyFlags: [],
        status: "completed",
      },
      usage: input.usage.estimatedTokens,
    };
  }

  async generateReviewFeedback(input: AiModelProviderReviewInput): Promise<AiModelProviderReviewOutput> {
    const gradeBand = getGradeBandForGrade(input.request.gradeLevel);
    const primarySkill = getPrimarySkill(input);
    const submittedTextExcerpt = createBoundedExcerpt(input.request.typedText, MAX_AI_REVIEW_EXCERPT_LENGTH);
    const sharedExcerpt = submittedTextExcerpt || "No submitted text excerpt was available.";
    const metrics = getDraftMetrics(input.request.typedText);
    const criteria =
      input.request.rubricCriteria.length > 0
        ? input.request.rubricCriteria
        : [
            {
              description: createLocalizedCopy("aiReview.mock.rubric.default.description", "Writing is clear and connected to the prompt."),
              id: "clarity",
              label: createLocalizedCopy("aiReview.mock.rubric.default.label", "Clarity"),
              maxScore: 4 as const,
              skill: "clarity" as const,
            },
          ];
    const rubricScores = criteria.map((criterion, index) => {
      const score: 1 | 2 | 3 | 4 = index === 0 && metrics.wordCount > 30 ? 3 : 2;

      return {
        coachingNote: createLocalizedCopy(
          `aiReview.mock.rubric.${criterion.id}.note`,
          score >= 3
            ? "This part is on track. Reread it once and keep the idea in your own words."
            : `Use the revision task to make this ${criterion.label.fallback.toLowerCase()} goal clearer.`,
        ),
        criterionId: criterion.id,
        level: getRubricLevel(score),
        maxScore: 4 as const,
        score,
      };
    });

    return {
      rawFeedback: {
        assignmentId: input.request.assignmentId,
        assignmentTitle: input.request.assignmentTitle,
        createdAt: new Date("2026-06-09T09:00:00.000Z").toISOString(),
        grammarSuggestions: [
          {
            explanation: createLocalizedCopy(
              "aiReview.mock.grammar.sentenceControl.explanation",
              "A focused sentence helps the reader follow the idea.",
            ),
            id: "sentence-control",
            originalExcerpt: createBoundedExcerpt(sharedExcerpt, 500),
            studentAction: createLocalizedCopy(
              "aiReview.mock.grammar.sentenceControl.studentAction",
              "Choose one sentence and check that it has one clear purpose.",
            ),
            title: createLocalizedCopy("aiReview.mock.grammar.sentenceControl.title", "Check sentence purpose"),
          },
        ],
        id: `feedback-${input.request.submissionId}`,
        progressEarned: {
          minutes: Math.min(12, Math.max(4, Math.ceil(metrics.wordCount / 28))),
          points: Math.min(40, 16 + Math.floor(metrics.wordCount / 12)),
          skill: primarySkill,
        },
        revisionTask: {
          guidingQuestion: createLocalizedCopy(
            "aiReview.mock.revision.guidingQuestion",
            gradeBand === "high"
              ? "Where can one sentence better connect claim, evidence, and analysis?"
              : gradeBand === "middle"
                ? "Which sentence needs more support for your reason?"
                : "What one detail helps the reader see your idea?",
          ),
          id: `revision-${input.request.submissionId}`,
          instruction: createLocalizedCopy(
            "aiReview.mock.revision.instruction",
            gradeBand === "high"
              ? "Revise one sentence to clarify the reasoning behind your claim or evidence."
              : gradeBand === "middle"
                ? "Revise one sentence so it adds or explains a supporting detail."
                : "Pick one sentence from your draft and make it clearer with one new detail.",
          ),
          originalExcerpt: sharedExcerpt,
          targetSkill: primarySkill,
        },
        rubricScores,
        studentId: input.request.studentId,
        submissionId: input.request.submissionId,
        submittedTextExcerpt: compactWhitespace(sharedExcerpt),
        summary: getReviewSummary(gradeBand, primarySkill),
      },
      requestId: `mock-review-${input.request.submissionId}`,
      usage: input.usage.estimatedTokens,
    };
  }
}
