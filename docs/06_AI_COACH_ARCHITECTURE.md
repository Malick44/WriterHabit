# 06 — AI Coach Architecture

## Product Principle

The AI is a writing coach, not a ghostwriter.

It should help students think, plan, revise, and improve. It should not complete school assignments for them.

## AI Capabilities

### Allowed

- Give hints
- Ask guiding questions
- Explain grammar
- Suggest stronger words
- Help brainstorm ideas
- Review a topic sentence
- Give rubric feedback
- Create a revision task
- Explain why a sentence is unclear
- Provide short examples for learning

### Not Allowed

- Write the full essay
- Finish an assignment without student input
- Generate final answers for live tests
- Rewrite the whole student response as a polished final submission
- Encourage cheating
- Provide inappropriate or age-unsuitable content

## AI Services

```txt
features/ai-coach/
  api/
    aiCoachApi.ts
  components/
    AiCoachDrawer.tsx
  hooks/
    useAiCoach.ts
  services/
    aiCoachContextService.ts
    aiCoachPolicyService.ts
  prompts/
    coachPrompt.ts
    reviewPrompt.ts
  types.ts
```

Current implementation is a deterministic local mock boundary. It does not call a
backend AI service or include model credentials. The mock facade is intentionally
shaped like the future service boundary: build bounded context, validate policy,
build a grade-aware prompt, validate output, and return a structured coaching
packet.

## Grade-Level Tone

### Grades 1–2

- Short sentences
- Warm tone
- One suggestion at a time
- Simple words
- Optional read-aloud

### Grades 3–5

- Simple explanations
- Focus on sentence completeness, capitalization, punctuation, and details

### Grades 6–8

- Paragraph structure
- Claims
- Evidence
- Transitions
- Summaries

### Grades 9–12

- Thesis
- Argument
- Evidence
- Analysis
- Tone
- Style
- Citations when relevant

## Prompt Contract

Every AI request must include:

```ts
interface AiCoachContext {
  studentId: string;
  gradeLevel: number;
  writingLevel: "early_elementary" | "upper_elementary" | "middle" | "high";
  assignmentId: string;
  assignmentTitle: string;
  assignmentType: string;
  skillFocus: string[];
  assignmentPrompt: string;
  draftExcerpt: string;
  canvasContext?: {
    canvasId: string;
    pageCount: number;
    recognizedTextExcerpt?: string;
    title: string;
    updatedLabel?: string;
  } | null;
  rubric: Array<{
    description: string;
    id: string;
    label: string;
  }>;
  metrics: {
    paragraphCount: number;
    sentenceCount: number;
    wordCount: number;
  };
  requestedAction: AiCoachAction;
  studentRequest?: string;
  connectionStatus: "online" | "offline_cached";
}
```

`draftExcerpt`, `canvasContext.recognizedTextExcerpt`, and `studentRequest` are
bounded before validation so the coach does not retain full drafts, full canvas
documents, or large freeform payloads.

## Response Contract

```ts
interface AiCoachResponse {
  action: AiCoachAction;
  state: "success" | "empty" | "safety_blocked";
  strength?: string;
  improvement?: string;
  nextStep?: string;
  guidingQuestion?: string;
  safetyFlags: string[];
  learningMode: true;
  generatedAt: string;
}
```

## Sample Prompt Rule

```txt
You are a writing coach for a Grade {{gradeLevel}} student.

Your job is to help the student improve their own writing.

Do not write the full answer.
Do not complete the assignment.
Do not rewrite the entire response.

Give:
1. One thing the student did well.
2. One specific improvement.
3. One action the student can take next.

Use age-appropriate language.
```

## Safety Pipeline

AI request flow:

```txt
User action
  -> Build AI context
  -> Validate academic-integrity policy
  -> Build grade-level prompt
  -> Run deterministic mock response or future backend AI call
  -> Validate output policy
  -> Return coach response
```

Current explicit UI states:

- idle/empty choice state
- loading
- empty result when a draft-dependent action has no student text
- error with retry
- offline with recovery to choices
- safety-blocked with recovery to approved actions
- success with one strength, one improvement, one next step, and one question

Current mock scenarios can be selected with
`EXPO_PUBLIC_WRITEWISE_AI_COACH_SCENARIO`:

- `success`
- `empty`
- `error`
- `offline`
- `safety_blocked`

## AI Usage Cost Controls

- Cache rubric feedback when submission does not change.
- Use smaller model for hints.
- Use larger model only for full review.
- Limit daily AI coach interactions on free plan.
- Queue long feedback jobs.
- Summarize canvas text before review if too long.

## Important UI Rule

Never expose these CTAs:

- Write it for me
- Finish my essay
- Give me the answer
- Generate final draft

Use these instead:

- Give me a hint
- Help me brainstorm
- Check my sentence
- Explain this mistake
- Help me revise
- Suggest a stronger word
- Ask me a question
