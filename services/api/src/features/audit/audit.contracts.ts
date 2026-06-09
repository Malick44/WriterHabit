export const auditActorRoles = ["student", "parent", "teacher", "admin", "provider", "system"] as const;
export type AuditActorRole = (typeof auditActorRoles)[number];

export const auditResults = ["success", "denied", "failed"] as const;
export type AuditResult = (typeof auditResults)[number];

export const requiredAuditActions = [
  "auth.sign_in_abuse_threshold",
  "parent_student_link.created",
  "parent_student_link.revoked",
  "teacher_roster.changed",
  "assignment.published",
  "assignment.submitted",
  "ai_coach.safety_blocked",
  "ai_review.created",
  "ai_review.completed",
  "canvas.signed_url_created",
  "canvas.exported",
  "canvas.recognition_requested",
  "subscription.checkout_started",
  "subscription.restored",
  "subscription.webhook_processed",
  "admin.resource_accessed",
] as const;

export type RequiredAuditAction = (typeof requiredAuditActions)[number];

export type AuditMetadataValue =
  | string
  | number
  | boolean
  | null
  | AuditMetadataValue[]
  | { [key: string]: AuditMetadataValue };

export type AuditMetadata = Record<string, AuditMetadataValue>;

export interface AuditEventInput {
  action: RequiredAuditAction | (string & {});
  actorRole: AuditActorRole;
  actorUserId: string | null;
  ipHash?: string | null;
  metadata?: Record<string, unknown>;
  requestId: string;
  result: AuditResult;
  targetId?: string | null;
  targetType: string;
  userAgentHash?: string | null;
}

export interface AuditEventRecord {
  action: string;
  actorRole: AuditActorRole;
  actorUserId: string | null;
  createdAt: string;
  ipHash: string | null;
  metadata: AuditMetadata;
  requestId: string;
  result: AuditResult;
  targetId: string | null;
  targetType: string;
  userAgentHash: string | null;
}

export interface AuditLogDatabaseRow {
  action: string;
  actor_role: AuditActorRole;
  actor_user_id: string | null;
  created_at: string;
  ip_hash: string | null;
  metadata: AuditMetadata;
  request_id: string;
  result: AuditResult;
  target_id: string | null;
  target_type: string;
  user_agent_hash: string | null;
}

export interface AuditLogSink {
  writeAuditEvent(event: AuditEventRecord): Promise<void>;
}
