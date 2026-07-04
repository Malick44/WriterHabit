import type { FastifyRequest } from "fastify";

import type {
  ClassRecord,
  Database,
  StudentAssignmentWithAssignment,
  StudentProfileRecord,
  SubmissionRecord,
  TeacherProfileRecord,
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

/**
 * Owner-only student scope: only the student whose verified JWT subject owns
 * the profile may act. Parents and teachers read through summary surfaces but
 * never mutate a student's work (e.g. Grade 3 day completion).
 */
export async function authorizeOwnedStudentScope(
  database: Database,
  principal: AuthPrincipal,
  studentId: string,
): Promise<StudentProfileRecord> {
  if (principal.role === "student") {
    const profile = await resolveOwnedStudentProfile(database, principal, studentId);

    if (profile) {
      return profile;
    }
  }

  throw createForbiddenError({
    code: "authorization.student_scope_denied",
    details: { studentId },
  });
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
 * Parent dashboard routes are parent-owned: the caller must hold the trusted
 * `parent` role and `parentId` must be their own auth user id
 * (`parent_student_links.parent_user_id`). Everything else is a 403 without
 * revealing whether the parent id exists.
 */
export function authorizeOwnedParentScope(principal: AuthPrincipal, parentId: string): void {
  if (principal.role !== "parent" || parentId !== principal.id) {
    throw createForbiddenError({ details: { parentId } });
  }
}

/**
 * Parents may read a linked student only through an active
 * parent_student_links row; this is the parent-route variant of
 * authorizeStudentScopeRead that never grants student or teacher access.
 */
export async function authorizeParentLinkedStudentRead(
  database: Database,
  principal: AuthPrincipal,
  parentId: string,
  studentId: string,
): Promise<StudentProfileRecord> {
  authorizeOwnedParentScope(principal, parentId);

  const profile = await database.getStudentProfileById(studentId);

  if (!profile || !(await database.hasActiveParentLink(principal.id, profile.id))) {
    throw createForbiddenError({
      code: "authorization.parent_link_required",
      details: { studentId },
    });
  }

  return profile;
}

/**
 * Teacher dashboard routes are teacher-owned. `teacherId` is the
 * `teacher_profiles.id`; as with students, a teacher calling with their own
 * auth user id resolves to their own profile. Ownership is always re-checked
 * against the verified JWT subject.
 */
export async function authorizeOwnedTeacherScope(
  database: Database,
  principal: AuthPrincipal,
  teacherId: string,
): Promise<TeacherProfileRecord> {
  if (principal.role !== "teacher") {
    throw createForbiddenError({ details: { teacherId } });
  }

  const byProfileId = await database.getTeacherProfileById(teacherId);

  if (byProfileId) {
    if (byProfileId.userId !== principal.id) {
      throw createForbiddenError({
        code: "authorization.teacher_class_scope_denied",
        details: { teacherId },
      });
    }

    return byProfileId;
  }

  if (teacherId === principal.id) {
    const byUserId = await database.getTeacherProfileByUserId(principal.id);

    if (byUserId) {
      return byUserId;
    }
  }

  throw createForbiddenError({
    code: "authorization.teacher_class_scope_denied",
    details: { teacherId },
  });
}

export interface OwnedClassContext {
  classRecord: ClassRecord;
  teacherProfile: TeacherProfileRecord;
}

/**
 * Class-scoped reads require the caller to be the owning teacher. Classes the
 * teacher does not own respond with 404 instead of 403 so the endpoint does
 * not leak which class ids exist.
 */
export async function authorizeOwnedClassRead(
  database: Database,
  principal: AuthPrincipal,
  classId: string,
): Promise<OwnedClassContext> {
  if (principal.role !== "teacher") {
    throw createForbiddenError({ details: { classId } });
  }

  const teacherProfile = await database.getTeacherProfileByUserId(principal.id);
  const classRecord = await database.getClassById(classId);

  if (!teacherProfile || !classRecord || classRecord.teacherProfileId !== teacherProfile.id) {
    throw createResourceNotFoundError({ classId });
  }

  return { classRecord, teacherProfile };
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
