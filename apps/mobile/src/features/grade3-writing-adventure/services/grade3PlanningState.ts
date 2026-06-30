import type { Grade3PlanningState } from "../types";

export const defaultGrade3PlanningState: Grade3PlanningState = {
  beginning: "",
  end: "",
  middle: "",
  talkIdea: "",
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.slice(0, 1200) : "";
}

export function normalizeGrade3PlanningState(value: unknown): Grade3PlanningState {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return defaultGrade3PlanningState;
  }

  const record = value as Record<string, unknown>;

  return {
    beginning: normalizeText(record.beginning),
    end: normalizeText(record.end),
    middle: normalizeText(record.middle),
    talkIdea: normalizeText(record.talkIdea),
  };
}

export function serializeGrade3PlanningState(planning: Grade3PlanningState): string {
  return JSON.stringify(normalizeGrade3PlanningState(planning));
}

export function deserializeGrade3PlanningState(value: string | null | undefined): Grade3PlanningState {
  if (!value) {
    return defaultGrade3PlanningState;
  }

  try {
    return normalizeGrade3PlanningState(JSON.parse(value) as unknown);
  } catch {
    return defaultGrade3PlanningState;
  }
}
