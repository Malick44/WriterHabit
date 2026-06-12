import type { EntitlementRecord, EntitlementStatus, UpsertEntitlementInput } from "./types";

export const staleProviderEventIgnoredReason = "stale_provider_event";

const lifecyclePrecedence: Record<EntitlementStatus, number> = {
  free: 0,
  trial: 10,
  active: 10,
  canceled: 20,
  grace_period: 30,
  past_due: 40,
  expired: 50,
  refunded: 60,
};

function eventTimestamp(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function updatedAtTimestamp(value: string): number | null {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function isSameProviderSubscription(
  existing: EntitlementRecord,
  incoming: UpsertEntitlementInput,
): boolean {
  return Boolean(
    existing.provider &&
      incoming.provider &&
      existing.provider === incoming.provider &&
      existing.providerSubscriptionId &&
      incoming.providerSubscriptionId &&
      existing.providerSubscriptionId === incoming.providerSubscriptionId,
  );
}

function wouldLoosenExistingAccess(
  existing: EntitlementRecord,
  incoming: UpsertEntitlementInput,
): boolean {
  if (!existing.canAccessPremium && incoming.canAccessPremium) {
    return true;
  }

  return lifecyclePrecedence[incoming.status] < lifecyclePrecedence[existing.status];
}

export function shouldIgnoreStaleProviderEvent(input: {
  existing: EntitlementRecord | null;
  incoming: UpsertEntitlementInput;
}): boolean {
  const { existing, incoming } = input;

  if (!existing || !isSameProviderSubscription(existing, incoming)) {
    return false;
  }

  const existingTimestamp =
    eventTimestamp(existing.providerLastEventTimestampMs) ?? updatedAtTimestamp(existing.updatedAt);
  const incomingTimestamp = eventTimestamp(incoming.providerLastEventTimestampMs);

  if (existingTimestamp === null) {
    return false;
  }

  if (incomingTimestamp === null) {
    return wouldLoosenExistingAccess(existing, incoming);
  }

  if (incomingTimestamp < existingTimestamp) {
    return true;
  }

  return (
    incomingTimestamp === existingTimestamp &&
    lifecyclePrecedence[incoming.status] < lifecyclePrecedence[existing.status]
  );
}

export function withStaleProviderEventMetadata(input: {
  existing: EntitlementRecord;
  incoming: UpsertEntitlementInput;
  metadata: Record<string, unknown>;
}): Record<string, unknown> {
  return {
    ...input.metadata,
    ignoredComparedTo: {
      providerLastEventId: input.existing.providerLastEventId,
      providerLastEventTimestampMs: input.existing.providerLastEventTimestampMs,
      providerLastEventType: input.existing.providerLastEventType,
      status: input.existing.status,
    },
    ignoredReason: staleProviderEventIgnoredReason,
    incomingEventTimestampMs: input.incoming.providerLastEventTimestampMs ?? null,
  };
}
