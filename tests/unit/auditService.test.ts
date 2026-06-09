import {
  auditEventToDatabaseRow,
  createAuditEvent,
  shouldAuditAction,
} from "../../services/api/src/features/audit";

describe("audit service scaffold", () => {
  it("creates metadata-only audit events for required actions", () => {
    const event = createAuditEvent(
      {
        action: "ai_coach.safety_blocked",
        actorRole: "student",
        actorUserId: "user-1",
        metadata: {
          draftText: "Student writing should not be logged.",
          requestKind: "student_request",
          safetyFlags: ["assignment_completion_request"],
        },
        requestId: "req-1",
        result: "denied",
        targetId: "11111111-1111-1111-1111-111111111111",
        targetType: "ai_coach_interaction",
      },
      new Date("2026-06-09T09:00:00.000Z"),
    );
    const row = auditEventToDatabaseRow(event);

    expect(shouldAuditAction("ai_coach.safety_blocked")).toBe(true);
    expect(event).toMatchObject({
      action: "ai_coach.safety_blocked",
      createdAt: "2026-06-09T09:00:00.000Z",
      metadata: {
        draftText: "[redacted]",
        requestKind: "student_request",
        safetyFlags: ["assignment_completion_request"],
      },
    });
    expect(row).toMatchObject({
      actor_role: "student",
      actor_user_id: "user-1",
      request_id: "req-1",
      target_type: "ai_coach_interaction",
    });
  });
});
