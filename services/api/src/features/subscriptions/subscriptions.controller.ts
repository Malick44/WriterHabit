export const subscriptionEndpoints = [
  "GET /api/v1/me/entitlements",
  "POST /api/v1/subscriptions/checkout",
  "POST /api/v1/subscriptions/restore",
  "POST /api/v1/webhooks/revenuecat",
  "POST /api/v1/webhooks/stripe",
] as const;

export type SubscriptionEndpoint = (typeof subscriptionEndpoints)[number];

// Framework-neutral placeholder for entitlements and provider webhook routes.
export class SubscriptionsController {}
