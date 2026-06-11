import type { FastifyRequest } from "fastify";

import type {
  Database,
  StudentAssignmentWithAssignment,
  StudentProfileRecord,
  SubmissionRecord,
} from "../data/types";
import type { AuthPrincipal } from "./auth";
import { createForbiddenError, createResourceNotFoundError } from "./errors";

export function requirePrincipal(request: FastifyRequest): AuthPrincipal {
  const principal = request.principal;

  if (!principal) {
    throw new Error("Authenticated route missing principal");
  }

  return principal;
}

/**
 * Resolves the student profile the authenticated student principal owns.
 *
 * `studentId` is the `student_profiles.id` per the database schema. As a
 * convenience for clients that only know the auth user id, a student calling
 * with their own auth user id resolves to their own profile; ownership is
 * always re-checked against the verified JWT subject.
 */
async function resolveOwnedStudentProfile(
  database: Database,
  principal: AuthPrincipal,
  studentId: string,
): Promise<StudentProfileRecord | null> {
  const byProfileId = await database.getStudentProfileById(studentId);

  if (byProfileId) {
    return byProfileId.userId === principal.id ? byProfileId : null;
  }

  if (studentId === principal.id) {
    return database.getStudentProfileByUserId(principal.id);
  }

  return null;
}

/**
 * Authorizes read access to a student scope per docs/AUTHORIZATION_RULES.md:
 * the student themselves, parents with an active parent_student_links row, or
 * teachers with the student actively enrolled in an owned class. Everyone
 * else gets a 403 with the standard error shape.
 */
export async function authorizeStudentScopeRead(
  database: Database,
  principal: AuthPrincipal,
  studentId: string,
): Promise<StudentProfileRecord> {
  switch (principal.role) {
    case "student": {
      const profile = await resolveOwnedStudentProfile(database, principal, studentId);

      if (!profile) {
        throw createForbiddenError({
          code: "authorization.student_scope_denied",
          details: { studentId },
        });
      }

      return profile;
    }
    case "parent": {
      const profile = await database.getStudentProfileById(studentId);

      if (!profile || !(await database.hasActiveParentLink(principal.id, profile.id))) {
        throw createForbiddenError({
          code: "authorization.parent_link_required",
          details: { studentId },
        });
      }

      return profile;
    }
    case "teacher": {
      const profile = await database.getStudentProfileById(studentId);

      if (!profile || !(await database.hasActiveTeacherLink(principal.id, profile.id))) {
        throw createForbiddenError({
          code: "authorization.teacher_class_scope_denied",
          details: { studentId },
        });
      }

      return profile;
    }
    default:
      throw createForbiddenError({ details: { studentId } });
  }
}

export interface OwnedStudentAssignmentContext {
  profile: StudentProfileRecord;
  studentAssignment: StudentAssignmentWithAssignment;
}

/**
 * Draft and submission mutations are student-owned: only the student whose
 * verified JWT subject maps to the student assignment's profile may act.
 */
export async function authorizeOwnedStudentAssignment(
  database: Database,
  principal: AuthPrincipal,
  studentAssignmentId: string,
): Promise<OwnedStudentAssignmentContext> {
  if (principal.role !== "student") {
    throw createForbiddenError({ details: { studentAssignmentId } });
  }

  const studentAssignment = await database.getStudentAssignmentById(studentAssignmentId);

  if (!studentAssignment) {
    throw createResourceNotFoundError({ studentAssignmentId });
  }

  const profile = await database.getStudentProfileByUserId(principal.id);

  if (!profile || profile.id !== studentAssignment.studentProfileId) {
    throw createForbiddenError({
      code: "authorization.student_scope_denied",
      details: { studentAssignmentId },
    });
  }

  return { profile, studentAssignment };
}

export async function authorizeOwnedSubmission(
  database: Database,
  principal: AuthPrincipal,
  submissionId: string,
): Promise<SubmissionRecord> {
  if (principal.role !== "student") {
    throw createForbiddenError({ details: { submissionId } });
  }

  const submission = await database.getSubmissionById(submissionId);

  if (!submission) {
    throw createResourceNotFoundError({ submissionId });
  }

  const profile = await database.getStudentProfileByUserId(principal.id);

  if (!profile || profile.id !== submission.studentProfileId) {
    throw createForbiddenError({
      code: "authorization.student_scope_denied",
      details: { submissionId },
    });
  }

  return submission;
}

/**
 * Read access to a submission: owning student, linked parent, or teacher with
 * the student enrolled in an owned class. Responses are already bounded to
 * excerpts, matching the parent/teacher read-only rules.
 */
export async function authorizeSubmissionRead(
  database: Database,
  principal: AuthPrincipal,
  submissionId: string,
): Promise<SubmissionRecord> {
  const submission = await database.getSubmissionById(submissionId);

  if (!submission) {
    throw createResourceNotFoundError({ submissionId });
  }

  switch (principal.role) {
    case "student": {
      const profile = await database.getStudentProfileByUserId(principal.id);

      if (profile && profile.id === submission.studentProfileId) {
        return submission;
      }

      throw createForbiddenError({
        code: "authorization.student_scope_denied",
        details: { submissionId },
      });
    }
    case "parent": {
      if (await database.hasActiveParentLink(principal.id, submission.studentProfileId)) {
        return submission;
      }

      throw createForbiddenError({
        code: "authorization.parent_link_required",
        details: { submissionId },
      });
    }
    case "teacher": {
      if (await database.hasActiveTeacherLink(principal.id, submission.studentProfileId)) {
        return submission;
      }

      throw createForbiddenError({
        code: "authorization.teacher_class_scope_denied",
        details: { submissionId },
      });
    }
    default:
      throw createForbiddenError({ details: { submissionId } });
  }
}

/**
 * Resolves the student profile ids visible to the principal for assignment
 * detail lookups: the student's own profile, a parent's actively linked
 * students, or a teacher's actively enrolled students.
 */
export async function listVisibleStudentProfileIds(
  database: Database,
  principal: AuthPrincipal,
): Promise<string[]> {
  switch (principal.role) {
    case "student": {
      const profile = await database.getStudentProfileByUserId(principal.id);

      if (!profile) {
        throw createForbiddenError({ code: "authorization.student_scope_denied" });
      }

      return [profile.id];
    }
    case "parent": {
      const linked = await database.listParentLinkedStudentProfileIds(principal.id);

      if (linked.length === 0) {
        throw createForbiddenError({ code: "authorization.parent_link_required" });
      }

      return linked;
    }
    case "teacher": {
      const linked = await database.listTeacherLinkedStudentProfileIds(principal.id);

      if (linked.length === 0) {
        throw createForbiddenError({ code: "authorization.teacher_class_scope_denied" });
      }

      return linked;
    }
    default:
      throw createForbiddenError();
  }
}
