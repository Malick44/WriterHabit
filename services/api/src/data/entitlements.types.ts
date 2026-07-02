export type EntitlementStatus =
  | "free"
  | "trial"
  | "active"
  | "past_due"
  | "canceled"
  | "expired"
  | "refunded"
  | "grace_period";
export type EntitlementProvider = "revenuecat" | "stripe" | "manual";
export type EntitlementProviderEventStatus = "received" | "processed" | "ignored" | "failed";
export type EntitlementScopeType = "personal" | "family" | "class" | "school";
export type SubscriptionPlanId = "WriterHabit_plus_monthly" | "WriterHabit_plus_yearly";
export type BillingPeriod = "month" | "year";

export interface EntitlementRecord {
  billingPeriod: BillingPeriod | null;
  canAccessPremium: boolean;
  createdAt: string;
  currentPeriodEndsAt: string | null;
  currentPlanId: SubscriptionPlanId | null;
  id: string;
  managementUrl: string | null;
  ownerUserId: string;
  provider: EntitlementProvider | null;
  providerCustomerId: string | null;
  providerLastEventId: string | null;
  providerLastEventTimestampMs: number | null;
  providerLastEventType: string | null;
  providerSubscriptionId: string | null;
  scopeId: string | null;
  scopeType: EntitlementScopeType;
  status: EntitlementStatus;
  trialEndsAt: string | null;
  updatedAt: string;
}

export interface UpsertEntitlementInput {
  billingPeriod: BillingPeriod | null;
  canAccessPremium: boolean;
  currentPeriodEndsAt: string | null;
  currentPlanId: SubscriptionPlanId | null;
  managementUrl: string | null;
  ownerUserId: string;
  provider: EntitlementProvider | null;
  providerCustomerId: string | null;
  providerLastEventId?: string | null;
  providerLastEventTimestampMs?: number | null;
  providerLastEventType?: string | null;
  providerSubscriptionId: string | null;
  scopeId: string | null;
  scopeType: EntitlementScopeType;
  status: EntitlementStatus;
  trialEndsAt: string | null;
}

export interface EntitlementProviderEventRecord {
  eventType: string;
  id: string;
  metadata: Record<string, unknown>;
  ownerUserId: string | null;
  processedAt: string | null;
  processingStatus: EntitlementProviderEventStatus;
  provider: Extract<EntitlementProvider, "revenuecat" | "stripe">;
  providerEventId: string;
  receivedAt: string;
}

export interface ApplyEntitlementProviderEventInput {
  entitlement?: UpsertEntitlementInput;
  eventType: string;
  metadata: Record<string, unknown>;
  ownerUserId: string | null;
  provider: Extract<EntitlementProvider, "revenuecat" | "stripe">;
  providerEventId: string;
  processingStatus?: Extract<EntitlementProviderEventStatus, "ignored" | "processed">;
}

export interface ApplyEntitlementProviderEventResult {
  entitlement: EntitlementRecord | null;
  event: EntitlementProviderEventRecord;
  wasDuplicate: boolean;
}
