import type { FastifyInstance, preHandlerHookHandler } from "fastify";
import { z } from "zod";

import type { Database } from "../data/types";
import { AiCoachService } from "../features/ai/coach/ai-coach.service";
import {
  createLocalizedCopy,
  isGradeLevel,
  type AiCoachAction,
  type AssignmentRubricCriterion,
  type GradeLevel,
} from "../features/ai/contracts";
import { mapAiCoachApiResponse } from "../mappers/ai-coach.mapper";
import { authorizeStudentScopeRead, requirePrincipal } from "../runtime/authorization";
import { ApiHttpError, createResourceNotFoundError } from "../runtime/errors";
import { validateRequestBody } from "../runtime/validation";

export const implementedAiCoachEndpoints: ReadonlySet<string> = new Set([
  "POST /api/v1/ai/coach/hint",
  "POST /api/v1/ai/coach/brainstorm",
  "POST /api/v1/ai/coach/check-sentence",
  "POST /api/v1/ai/coach/explain-grammar",
  "POST /api/v1/ai/coach/suggest-vocabulary",
  "POST /api/v1/ai/coach/revision-question",
]);

const coachEndpointActions: Record<string, AiCoachAction> = {
  "/ai/coach/brainstorm": "brainstorm",
  "/ai/coach/check-sentence": "check_sentence",
  "/ai/coach/explain-grammar": "explain_grammar",
  "/ai/coach/hint": "hint",
  "/ai/coach/revision-question": "revision_question",
  "/ai/coach/suggest-vocabulary": "suggest_vocabulary",
};

const rubricCriterionSchema = z.object({
  description: z.string().min(1).max(500),
  id: z.string().min(1).max(128),
  label: z.string().min(1).max(160),
});

const coachRequestBodySchema = z.strictObject({
  assignmentId: z.string().min(1).max(128),
  canvasRecognizedText: z.string().max(600).optional(),
  clientAction: z
    .enum([
      "hint",
      "brainstorm",
      "sentence_check",
      "explain_mistake",
      "revision_help",
      "stronger_word",
      "ask_question",
    ])
    .optional(),
  draftExcerpt: z.string().max(1_200).default(""),
  gradeLevel: z.number().int().min(1).max(12),
  rubricCriteria: z.array(rubricCriterionSchema).max(8).default([]),
  selectedText: z.string().max(600).optional(),
  studentId: z.string().min(1).max(128),
  studentRequest: z.string().max(360).optional(),
  writingLevel: z.enum(["getting_started", "building", "steady", "confident"]).default("steady"),
});

function toGradeLevel(value: number): GradeLevel {
  return isGradeLevel(value) ? value : 7;
}

function mapRubricCriteria(values: z.infer<typeof rubricCriterionSchema>[]): AssignmentRubricCriterion[] {
  return values.map((criterion) => ({
    description: createLocalizedCopy(`aiCoach.rubric.${criterion.id}.description`, criterion.description),
    id: criterion.id,
    label: createLocalizedCopy(`aiCoach.rubric.${criterion.id}.label`, criterion.label),
    maxScore: 4,
  }));
}

function createServiceError(error: NonNullable<Awaited<ReturnType<AiCoachService["requestCoaching"]>>["error"]>): ApiHttpError {
  const statusCode = error.code.startsWith("rate_limit.")
    ? 429
    : error.code.startsWith("validation.") || error.code.startsWith("ai_safety.")
      ? 422
      : 503;

  return new ApiHttpError({
    code: error.code,
    fallbackMessage: error.message.fallback,
    messageKey: error.message.key,
    retryable: error.retryable,
    statusCode,
  });
}

export async function registerAiCoachRoutes(
  app: FastifyInstance,
  authenticate: preHandlerHookHandler,
  database: Database,
): Promise<void> {
  const aiCoachService = new AiCoachService();

  for (const [path, action] of Object.entries(coachEndpointActions)) {
    app.post(path, { preHandler: authenticate }, async (request) => {
      const principal = requirePrincipal(request);
      const body = validateRequestBody(request, coachRequestBodySchema);
      const profile = await authorizeStudentScopeRead(database, principal, body.studentId);
      const studentAssignment = await database.findStudentAssignmentForStudents(body.assignmentId, [
        profile.id,
      ]);

      if (!studentAssignment) {
        throw createResourceNotFoundError({ assignmentId: body.assignmentId, studentId: body.studentId });
      }

      const result = await aiCoachService.requestCoaching({
        action,
        canvasRecognizedText: body.canvasRecognizedText,
        draftExcerpt: body.draftExcerpt,
        gradeLevel: toGradeLevel(body.gradeLevel),
        locale: "en",
        rubricCriteria: mapRubricCriteria(body.rubricCriteria),
        selectedText: body.selectedText,
        studentAssignmentId: studentAssignment.id,
        studentId: profile.id,
        studentRequest: body.studentRequest,
        writingLevel: body.writingLevel,
      });

      if (result.error || !result.response) {
        await database.recordAiCoachInteraction({
          action,
          draftExcerpt: body.draftExcerpt,
          providerRequestId: null,
          safetyFlags: [],
          selectedTextExcerpt: body.selectedText ?? null,
          status: "failed",
          studentAssignmentId: studentAssignment.id,
          studentProfileId: profile.id,
        });

        if (result.error) {
          throw createServiceError(result.error);
        }

        throw new ApiHttpError({
          code: "system.unavailable",
          fallbackMessage: "WriterHabit is temporarily unavailable.",
          messageKey: "errors.system.unavailable",
          retryable: true,
          statusCode: 503,
        });
      }

      await database.recordAiCoachInteraction({
        action,
        draftExcerpt: body.draftExcerpt,
        providerRequestId: result.response.provider.requestId,
        responseMessageKey: result.response.coachingMessage.key,
        responseTitleKey: result.response.title.key,
        safetyFlags: result.response.safetyFlags,
        selectedTextExcerpt: body.selectedText ?? null,
        status: result.response.status === "completed" ? "completed" : "safety_blocked",
        studentAssignmentId: studentAssignment.id,
        studentProfileId: profile.id,
      });

      return mapAiCoachApiResponse({
        clientAction: body.clientAction,
        response: result.response,
      });
    });
  }
}
