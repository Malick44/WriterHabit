import type { FastifyRequest } from "fastify";
import { z, type ZodType } from "zod";

import { createValidationError } from "./errors";

export const jsonObjectBodySchema = z.object({}).passthrough();

export function validateRequestBody<T>(request: FastifyRequest, schema: ZodType<T>): T {
  const parsed = schema.safeParse(request.body);

  if (!parsed.success) {
    throw createValidationError(parsed.error);
  }

  return parsed.data;
}

export function validateRequestParams<T>(request: FastifyRequest, schema: ZodType<T>): T {
  const parsed = schema.safeParse(request.params);

  if (!parsed.success) {
    throw createValidationError(parsed.error);
  }

  return parsed.data;
}

export function validateRequestQuery<T>(request: FastifyRequest, schema: ZodType<T>): T {
  const parsed = schema.safeParse(request.query);

  if (!parsed.success) {
    throw createValidationError(parsed.error);
  }

  return parsed.data;
}
