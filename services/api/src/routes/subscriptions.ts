import type { FastifyInstance, preHandlerHookHandler } from "fastify";

import type { Database } from "../data";
import { SubscriptionsService } from "../features/subscriptions/subscriptions.service";
import {
  revenueCatWebhookBodySchema,
  subscriptionCheckoutBodySchema,
  subscriptionRestoreBodySchema,
} from "../features/subscriptions/subscriptions.contracts";
import { requirePrincipal } from "../runtime/authorization";
import type { ApiConfig } from "../runtime/config";
import { validateRequestBody } from "../runtime/validation";

export async function registerSubscriptionRoutes(
  app: FastifyInstance,
  authenticate: preHandlerHookHandler,
  database: Database,
  payments: ApiConfig["payments"],
): Promise<void> {
  const service = new SubscriptionsService({ database, payments });

  app.get("/me/entitlements", { preHandler: authenticate }, async (request) => {
    const principal = requirePrincipal(request);
    return service.getEntitlements(principal);
  });

  app.post("/subscriptions/checkout", { preHandler: authenticate }, async (request) => {
    const principal = requirePrincipal(request);
    const body = validateRequestBody(request, subscriptionCheckoutBodySchema);

    return service.startCheckout({
      planId: body.planId,
      principal,
    });
  });

  app.post("/subscriptions/restore", { preHandler: authenticate }, async (request) => {
    const principal = requirePrincipal(request);
    validateRequestBody(request, subscriptionRestoreBodySchema.default({}));

    return service.restorePurchases(principal);
  });

  app.post("/webhooks/revenuecat", async (request, reply) => {
    const body = validateRequestBody(request, revenueCatWebhookBodySchema);
    const response = await service.handleRevenueCatWebhook({
      authorizationHeader: request.headers.authorization,
      body,
    });

    reply.code(200);
    return response;
  });
}
