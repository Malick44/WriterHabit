import type { FastifyInstance, HTTPMethods, preHandlerHookHandler } from "fastify";

import {
  aiCoachEndpoints,
  aiReviewEndpoints,
  assignmentEndpoints,
  authEndpoints,
  canvasEndpoints,
  notificationEndpoints,
  onboardingEndpoints,
  parentEndpoints,
  progressEndpoints,
  studentEndpoints,
  submissionEndpoints,
  subscriptionEndpoints,
  teacherEndpoints,
} from "../features";
import { createFeatureDisabledError } from "../runtime/errors";
import { jsonObjectBodySchema, validateRequestBody } from "../runtime/validation";

interface FeatureEndpointGroup {
  endpoints: readonly string[];
  feature: string;
}

interface ParsedEndpoint {
  endpoint: string;
  feature: string;
  method: HTTPMethods;
  path: string;
}

const featureEndpointGroups: readonly FeatureEndpointGroup[] = [
  { endpoints: authEndpoints, feature: "auth" },
  { endpoints: studentEndpoints, feature: "students" },
  { endpoints: onboardingEndpoints, feature: "onboarding" },
  { endpoints: assignmentEndpoints, feature: "assignments" },
  { endpoints: submissionEndpoints, feature: "submissions" },
  { endpoints: canvasEndpoints, feature: "canvas" },
  { endpoints: aiCoachEndpoints, feature: "ai-coach" },
  { endpoints: aiReviewEndpoints, feature: "feedback" },
  { endpoints: progressEndpoints, feature: "progress" },
  { endpoints: parentEndpoints, feature: "parent" },
  { endpoints: teacherEndpoints, feature: "teacher" },
  { endpoints: subscriptionEndpoints, feature: "subscriptions" },
  { endpoints: notificationEndpoints, feature: "notifications" },
];

const baseImplementedEndpoints: ReadonlySet<string> = new Set(["GET /api/v1/auth/session"]);
const publicDisabledEndpoints = new Set([
  "POST /api/v1/auth/sign-in",
  "POST /api/v1/auth/sign-up",
  "POST /api/v1/webhooks/revenuecat",
  "POST /api/v1/webhooks/stripe",
]);
const bodyMethods = new Set<HTTPMethods>(["POST", "PUT", "PATCH"]);

function parseEndpoint(endpoint: string, feature: string): ParsedEndpoint {
  const match = /^(GET|POST|PUT|PATCH|DELETE)\s+\/api\/v1(\/.*)$/.exec(endpoint);

  if (!match) {
    throw new Error(`Unsupported endpoint format: ${endpoint}`);
  }

  return {
    endpoint,
    feature,
    method: match[1] as HTTPMethods,
    path: match[2] ?? "/",
  };
}

function collectEndpoints(implementedEndpoints: ReadonlySet<string>): ParsedEndpoint[] {
  const seen = new Set<string>();
  const endpoints: ParsedEndpoint[] = [];

  featureEndpointGroups.forEach((group) => {
    group.endpoints.forEach((endpoint) => {
      if (implementedEndpoints.has(endpoint)) {
        return;
      }

      const parsed = parseEndpoint(endpoint, group.feature);
      const key = `${parsed.method} ${parsed.path}`;

      if (seen.has(key)) {
        return;
      }

      seen.add(key);
      endpoints.push(parsed);
    });
  });

  return endpoints;
}

export interface RegisterPlaceholderRoutesOptions {
  /**
   * Endpoints implemented by real route registrations in this server build.
   * They are excluded from the fail-closed placeholders; everything else
   * keeps returning 501 feature.disabled.
   */
  implementedEndpoints?: ReadonlySet<string>;
}

export async function registerPlaceholderRoutes(
  app: FastifyInstance,
  authenticate: preHandlerHookHandler,
  options: RegisterPlaceholderRoutesOptions = {},
): Promise<void> {
  const implementedEndpoints = new Set([
    ...baseImplementedEndpoints,
    ...(options.implementedEndpoints ?? []),
  ]);

  collectEndpoints(implementedEndpoints).forEach((endpoint) => {
    app.route({
      handler: async (request) => {
        if (bodyMethods.has(endpoint.method)) {
          validateRequestBody(request, jsonObjectBodySchema.optional().default({}));
        }

        throw createFeatureDisabledError({
          endpoint: endpoint.endpoint,
          feature: endpoint.feature,
        });
      },
      method: endpoint.method,
      preHandler: publicDisabledEndpoints.has(endpoint.endpoint) ? undefined : authenticate,
      url: endpoint.path,
    });
  });
}
