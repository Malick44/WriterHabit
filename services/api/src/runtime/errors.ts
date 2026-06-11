import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";

export interface ApiErrorResponse {
  error: {
    code: string;
    details?: Record<string, unknown>;
    fallbackMessage: string;
    messageKey: string;
    requestId: string;
    retryable: boolean;
  };
}

interface ErrorCatalogEntry {
  fallbackMessage: string;
  messageKey: string;
  retryable: boolean;
  statusCode: number;
}

const errorCatalog = {
  "auth.expired_token": {
    fallbackMessage: "Your session expired. Sign in again.",
    messageKey: "errors.auth.expiredToken",
    retryable: true,
    statusCode: 401,
  },
  "auth.invalid_token": {
    fallbackMessage: "Your session could not be verified.",
    messageKey: "errors.auth.invalidToken",
    retryable: false,
    statusCode: 401,
  },
  "auth.missing_token": {
    fallbackMessage: "Sign in to continue.",
    messageKey: "errors.auth.missingToken",
    retryable: false,
    statusCode: 401,
  },
  "authorization.parent_link_required": {
    fallbackMessage: "This student is not linked to your parent account.",
    messageKey: "errors.authorization.parentLinkRequired",
    retryable: false,
    statusCode: 403,
  },
  "authorization.role_denied": {
    fallbackMessage: "Your account cannot perform this action.",
    messageKey: "errors.authorization.roleDenied",
    retryable: false,
    statusCode: 403,
  },
  "authorization.student_scope_denied": {
    fallbackMessage: "You do not have access to this student profile.",
    messageKey: "errors.authorization.studentScopeDenied",
    retryable: false,
    statusCode: 403,
  },
  "authorization.teacher_class_scope_denied": {
    fallbackMessage: "This class or student is outside your teacher account.",
    messageKey: "errors.authorization.teacherClassScopeDenied",
    retryable: false,
    statusCode: 403,
  },
  "conflict.duplicate_idempotency_key": {
    fallbackMessage: "This request was already processed differently.",
    messageKey: "errors.conflict.duplicateIdempotencyKey",
    retryable: false,
    statusCode: 409,
  },
  "conflict.status_transition_invalid": {
    fallbackMessage: "This assignment is not ready for that step.",
    messageKey: "errors.conflict.statusTransitionInvalid",
    retryable: false,
    statusCode: 409,
  },
  "conflict.version_mismatch": {
    fallbackMessage: "A newer version exists. Reload before saving.",
    messageKey: "errors.conflict.versionMismatch",
    retryable: true,
    statusCode: 409,
  },
  "feature.disabled": {
    fallbackMessage: "This feature is not available yet.",
    messageKey: "errors.feature.disabled",
    retryable: false,
    statusCode: 501,
  },
  "resource.not_found": {
    fallbackMessage: "We could not find that item.",
    messageKey: "errors.resource.notFound",
    retryable: false,
    statusCode: 404,
  },
  "system.unavailable": {
    fallbackMessage: "WriterHabit is temporarily unavailable.",
    messageKey: "errors.system.unavailable",
    retryable: true,
    statusCode: 503,
  },
  "system.unexpected": {
    fallbackMessage: "Something went wrong. Try again.",
    messageKey: "errors.system.unexpected",
    retryable: true,
    statusCode: 500,
  },
  "validation.empty_submission": {
    fallbackMessage: "Add your own writing before submitting.",
    messageKey: "errors.validation.emptySubmission",
    retryable: false,
    statusCode: 422,
  },
  "validation.invalid_field": {
    fallbackMessage: "Check the highlighted fields and try again.",
    messageKey: "errors.validation.invalidField",
    retryable: false,
    statusCode: 400,
  },
  "validation.invalid_json": {
    fallbackMessage: "The request could not be read.",
    messageKey: "errors.validation.invalidJson",
    retryable: false,
    statusCode: 400,
  },
} satisfies Record<string, ErrorCatalogEntry>;

export type ApiErrorCode = keyof typeof errorCatalog | (string & {});

export interface ApiHttpErrorInput {
  code: ApiErrorCode;
  details?: Record<string, unknown>;
  fallbackMessage?: string;
  messageKey?: string;
  retryable?: boolean;
  statusCode?: number;
}

export class ApiHttpError extends Error {
  readonly code: ApiErrorCode;
  readonly details?: Record<string, unknown>;
  readonly fallbackMessage: string;
  readonly messageKey: string;
  readonly retryable: boolean;
  readonly statusCode: number;

  constructor(input: ApiHttpErrorInput) {
    const defaults = errorCatalog[input.code as keyof typeof errorCatalog] ?? errorCatalog["system.unexpected"];

    super(input.fallbackMessage ?? defaults.fallbackMessage);
    this.name = "ApiHttpError";
    this.code = input.code;
    this.details = input.details;
    this.fallbackMessage = input.fallbackMessage ?? defaults.fallbackMessage;
    this.messageKey = input.messageKey ?? defaults.messageKey;
    this.retryable = input.retryable ?? defaults.retryable;
    this.statusCode = input.statusCode ?? defaults.statusCode;
    Object.setPrototypeOf(this, ApiHttpError.prototype);
  }
}

export function createFeatureDisabledError(input: {
  endpoint: string;
  feature: string;
}): ApiHttpError {
  return new ApiHttpError({
    code: "feature.disabled",
    details: {
      endpoint: input.endpoint,
      feature: input.feature,
    },
    fallbackMessage: "This production API route is registered but disabled until persistence and authorization are implemented.",
  });
}

export type ForbiddenErrorCode =
  | "authorization.parent_link_required"
  | "authorization.role_denied"
  | "authorization.student_scope_denied"
  | "authorization.teacher_class_scope_denied";

export function createForbiddenError(input: {
  code?: ForbiddenErrorCode;
  details?: Record<string, unknown>;
} = {}): ApiHttpError {
  return new ApiHttpError({
    code: input.code ?? "authorization.role_denied",
    ...(input.details ? { details: input.details } : {}),
  });
}

export function createResourceNotFoundError(details?: Record<string, unknown>): ApiHttpError {
  return new ApiHttpError({
    code: "resource.not_found",
    ...(details ? { details } : {}),
  });
}

function zodIssuesToDetails(error: ZodError): Record<string, unknown> {
  return {
    issues: error.issues.map((issue) => ({
      code: issue.code,
      message: issue.message,
      path: issue.path.join("."),
    })),
  };
}

export function createValidationError(error: ZodError): ApiHttpError {
  return new ApiHttpError({
    code: "validation.invalid_field",
    details: zodIssuesToDetails(error),
  });
}

function isInvalidJsonError(error: FastifyError): boolean {
  return error.code === "FST_ERR_CTP_INVALID_JSON_BODY";
}

function normalizeError(error: FastifyError | Error): ApiHttpError {
  if (error instanceof ApiHttpError) {
    return error;
  }

  if (error instanceof ZodError) {
    return createValidationError(error);
  }

  const fastifyError = error as FastifyError;

  if (isInvalidJsonError(fastifyError)) {
    return new ApiHttpError({
      code: "validation.invalid_json",
    });
  }

  if (fastifyError.validation) {
    return new ApiHttpError({
      code: "validation.invalid_field",
      details: {
        issues: fastifyError.validation,
      },
    });
  }

  return new ApiHttpError({
    code: "system.unexpected",
  });
}

export function toApiErrorResponse(error: ApiHttpError, requestId: string): ApiErrorResponse {
  return {
    error: {
      code: error.code,
      ...(error.details ? { details: error.details } : {}),
      fallbackMessage: error.fallbackMessage,
      messageKey: error.messageKey,
      requestId,
      retryable: error.retryable,
    },
  };
}

export function createErrorHandler() {
  return (error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply): void => {
    const apiError = normalizeError(error);

    if (!(error instanceof ApiHttpError)) {
      request.log.error({ err: error, requestId: request.id }, "Unhandled API error");
    }

    reply
      .code(apiError.statusCode)
      .header("x-request-id", request.id)
      .send(toApiErrorResponse(apiError, request.id));
  };
}

export function createNotFoundHandler() {
  return (request: FastifyRequest, reply: FastifyReply): void => {
    const apiError = new ApiHttpError({
      code: "resource.not_found",
      details: {
        method: request.method,
        path: request.url,
      },
    });

    reply
      .code(apiError.statusCode)
      .header("x-request-id", request.id)
      .send(toApiErrorResponse(apiError, request.id));
  };
}
