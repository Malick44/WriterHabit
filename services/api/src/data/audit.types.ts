export type AuditActorRole = "student" | "parent" | "teacher" | "admin" | "system" | "provider";
export type AuditResult = "success" | "denied" | "failed";
export type AuditMetadataValue = string | number | boolean | null | AuditMetadata | AuditMetadataValue[];

export interface AuditMetadata {
  [key: string]: AuditMetadataValue;
}

export interface AuditEventInput {
  action: string;
  actorRole: AuditActorRole;
  actorUserId: string | null;
  metadata?: AuditMetadata;
  requestId: string;
  result: AuditResult;
  targetId?: string | null;
  targetType?: string | null;
}

export interface AuditEventRecord extends AuditEventInput {
  createdAt: string;
  id: string;
}

export type AiCoachInteractionAction =
  | "hint"
  | "brainstorm"
  | "check_sentence"
  | "explain_grammar"
  | "suggest_vocabulary"
  | "revision_question";

export type AiCoachInteractionStatus = "completed" | "failed" | "safety_blocked";

export interface RecordAiCoachInteractionInput {
  action: AiCoachInteractionAction;
  draftExcerpt?: string | null;
  providerRequestId?: string | null;
  responseMessageKey?: string | null;
  responseTitleKey?: string | null;
  safetyFlags: string[];
  selectedTextExcerpt?: string | null;
  status: AiCoachInteractionStatus;
  studentAssignmentId?: string | null;
  studentProfileId: string;
}
