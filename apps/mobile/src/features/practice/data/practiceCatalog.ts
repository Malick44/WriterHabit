import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

type IconName = ComponentProps<typeof Ionicons>["name"];

export type PracticeSkillTone = "green" | "gold" | "sage";

export type PracticeDifficulty = "easy" | "moderate" | "challenging";

export interface PracticeTask {
  id: string;
  title: string;
  estimatedMinutes: number;
  difficulty: PracticeDifficulty;
  /** What the student should do — shown as the prompt label. */
  instruction: string;
  /** The sample text the student works from. */
  sourceText: string;
}

export interface PracticeSkill {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  tone: PracticeSkillTone;
  tasks: readonly PracticeTask[];
}

// UI-first practice catalog. Replace with a real practice service when one
// exists; the screens read everything through the selectors below.
export const practiceSkills: readonly PracticeSkill[] = [
  {
    id: "sentence-combining",
    title: "Sentence combining",
    description: "Join short, choppy sentences into one strong sentence.",
    icon: "git-merge-outline",
    tone: "green",
    tasks: [
      {
        id: "forest",
        title: "A brave moment",
        estimatedMinutes: 5,
        difficulty: "easy",
        instruction: "Combine these into one stronger sentence:",
        sourceText: "“The forest was dark. Alex was not afraid.”",
      },
      {
        id: "loud-dog",
        title: "Two small facts",
        estimatedMinutes: 5,
        difficulty: "easy",
        instruction: "Combine these into one smooth sentence:",
        sourceText: "“The dog was small. The dog barked loudly.”",
      },
    ],
  },
  {
    id: "vivid-verbs",
    title: "Vivid verbs",
    description: "Swap dull verbs for ones that show real action.",
    icon: "flash-outline",
    tone: "gold",
    tasks: [
      {
        id: "walked",
        title: "Walk it back",
        estimatedMinutes: 5,
        difficulty: "easy",
        instruction: "Replace the weak verb with a vivid one:",
        sourceText: "“She walked quickly to the door.”",
      },
      {
        id: "said",
        title: "Say it stronger",
        estimatedMinutes: 5,
        difficulty: "moderate",
        instruction: "Rewrite so the verb shows how it was said:",
        sourceText: "“Stop!” he said.",
      },
    ],
  },
  {
    id: "show-dont-tell",
    title: "Show, don't tell",
    description: "Show feelings with details instead of naming them.",
    icon: "eye-outline",
    tone: "sage",
    tasks: [
      {
        id: "nervous",
        title: "A nervous moment",
        estimatedMinutes: 8,
        difficulty: "moderate",
        instruction: "Show this feeling without using the word:",
        sourceText: "“He was nervous.”",
      },
      {
        id: "excited",
        title: "Pure excitement",
        estimatedMinutes: 8,
        difficulty: "moderate",
        instruction: "Show this feeling with actions and details:",
        sourceText: "“She was very excited.”",
      },
    ],
  },
  {
    id: "strong-openings",
    title: "Strong openings",
    description: "Hook your reader from the very first line.",
    icon: "flag-outline",
    tone: "green",
    tasks: [
      {
        id: "summer",
        title: "A better hook",
        estimatedMinutes: 8,
        difficulty: "moderate",
        instruction: "Rewrite this opening so it grabs the reader:",
        sourceText: "“My summer was fun. I did a lot of things.”",
      },
    ],
  },
  {
    id: "dialogue",
    title: "Dialogue",
    description: "Make characters sound like real people.",
    icon: "chatbubbles-outline",
    tone: "gold",
    tasks: [
      {
        id: "flat-lines",
        title: "Bring it to life",
        estimatedMinutes: 8,
        difficulty: "challenging",
        instruction: "Rewrite this dialogue so it sounds natural:",
        sourceText: "“Hello.” “Hello.” “How are you?” “Fine.”",
      },
    ],
  },
  {
    id: "editing",
    title: "Editing & grammar",
    description: "Catch mistakes and polish your writing.",
    icon: "checkmark-done-outline",
    tone: "sage",
    tasks: [
      {
        id: "run-on",
        title: "Fix the run-on",
        estimatedMinutes: 5,
        difficulty: "moderate",
        instruction: "Break this run-on into clear sentences:",
        sourceText: "“I like to write it is fun I do it every day.”",
      },
    ],
  },
];

export function getPracticeSkill(
  skillId: string | undefined,
): PracticeSkill | undefined {
  return practiceSkills.find((skill) => skill.id === skillId);
}

export function getPracticeTask(
  skillId: string | undefined,
  taskId: string | undefined,
): { skill: PracticeSkill; task: PracticeTask } | undefined {
  const skill = getPracticeSkill(skillId);
  const task = skill?.tasks.find((candidate) => candidate.id === taskId);

  return skill && task ? { skill, task } : undefined;
}
