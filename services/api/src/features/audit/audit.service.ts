import {
  auditActorRoles,
  auditResults,
  requiredAuditActions,
  type AuditActorRole,
  type AuditEventInput,
  type AuditEventRecord,
  type AuditLogDatabaseRow,
  type AuditLogSink,
  type AuditMetadata,
  type AuditMetadataValue,
  type AuditResult,
} from "./audit.contracts";

const maxMetadataDepth = 3;
const maxMetadataKeys = 40;
const maxMetadataArrayItems = 20;
const maxMetadataStringLength = 240;

const sensitiveMetadataKeyPattern =
  /(authorization|body|canvas.*strokes|content|draft|essay|full.*text|key|password|prompt|provider.*payload|secret|service.*role|student.*writing|token)/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function truncateMetadataString(value: string): string {
  if (value.length <= maxMetadataStringLength) {
    return value;
  }

  return `${value.slice(0, maxMetadataStringLength).trimEnd()}...`;
}

function sanitizeMetadataValue(value: unknown, depth: number): AuditMetadataValue | undefined {
  if (value === null || typeof value === "boolean" || typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return truncateMetadataString(value);
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, maxMetadataArrayItems)
      .map((item) => sanitizeMetadataValue(item, depth + 1))
      .filter((item): item is AuditMetadataValue => item !== undefined);
  }

  if (isRecord(value)) {
    return sanitizeAuditMetadata(value, depth + 1);
  }

  return undefined;
}

function ensureNonBlank(value: string, name: string) {
  if (value.trim().length === 0) {
    throw new Error(`Audit event ${name} must not be blank`);
  }
}

function ensureActorRole(value: AuditActorRole) {
  if (!(auditActorRoles as readonly string[]).includes(value)) {
    throw new Error(`Unsupported audit actor role: ${value}`);
  }
}

function ensureResult(value: AuditResult) {
  if (!(auditResults as readonly string[]).includes(value)) {
    throw new Error(`Unsupported audit result: ${value}`);
  }
}

export function sanitizeAuditMetadata(metadata: Record<string, unknown> = {}, depth = 0): AuditMetadata {
  if (depth >= maxMetadataDepth) {
    return {};
  }

  const sanitized: AuditMetadata = {};

  for (const [key, value] of Object.entries(metadata).slice(0, maxMetadataKeys)) {
    if (sensitiveMetadataKeyPattern.test(key)) {
      sanitized[key] = "[redacted]";
      continue;
    }

    const sanitizedValue = sanitizeMetadataValue(value, depth);

    if (sanitizedValue !== undefined) {
      sanitized[key] = sanitizedValue;
    }
  }

  return sanitized;
}

export function shouldAuditAction(action: string): boolean {
  return (requiredAuditActions as readonly string[]).includes(action);
}

export function createAuditEvent(input: AuditEventInput, now = new Date()): AuditEventRecord {
  ensureActorRole(input.actorRole);
  ensureResult(input.result);
  ensureNonBlank(input.action, "action");
  ensureNonBlank(input.requestId, "requestId");
  ensureNonBlank(input.targetType, "targetType");

  return {
    action: input.action,
    actorRole: input.actorRole,
    actorUserId: input.actorUserId,
    createdAt: now.toISOString(),
    ipHash: input.ipHash ?? null,
    metadata: sanitizeAuditMetadata(input.metadata),
    requestId: input.requestId,
    result: input.result,
    targetId: input.targetId ?? null,
    targetType: input.targetType,
    userAgentHash: input.userAgentHash ?? null,
  };
}

export function auditEventToDatabaseRow(event: AuditEventRecord): AuditLogDatabaseRow {
  return {
    action: event.action,
    actor_role: event.actorRole,
    actor_user_id: event.actorUserId,
    created_at: event.createdAt,
    ip_hash: event.ipHash,
    metadata: event.metadata,
    request_id: event.requestId,
    result: event.result,
    target_id: event.targetId,
    target_type: event.targetType,
    user_agent_hash: event.userAgentHash,
  };
}

export class AuditLogService {
  private readonly sink: AuditLogSink | null;

  constructor(sink: AuditLogSink | null = null) {
    this.sink = sink;
  }

  createEvent(input: AuditEventInput, now?: Date): AuditEventRecord {
    return createAuditEvent(input, now);
  }

  async recordEvent(input: AuditEventInput, now?: Date): Promise<AuditEventRecord> {
    const event = this.createEvent(input, now);

    if (this.sink) {
      await this.sink.writeAuditEvent(event);
    }

    return event;
  }
}
