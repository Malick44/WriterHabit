export type {
  AssignmentType,
  GradeLevel,
  UserRole,
  WritingGoal,
  WritingSkill,
} from "./schemas";

import type { AssignmentType, GradeLevel, UserRole, WritingSkill } from "./schemas";

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  title: string;
  prompt: string;
  assignmentType: AssignmentType;
  gradeLevelMin: GradeLevel;
  gradeLevelMax: GradeLevel;
  skillFocus: WritingSkill[];
  difficulty: "easy" | "moderate" | "challenging";
  estimatedMinutes: number;
  rubricId: string;
}
