-- Persist last-applied provider event metadata so delayed RevenueCat webhooks
-- cannot re-enable access after a newer refund, expiration, or billing issue.

alter table public.entitlements
  add column if not exists provider_last_event_id text,
  add column if not exists provider_last_event_timestamp_ms bigint,
  add column if not exists provider_last_event_type text;

create index if not exists entitlements_provider_event_order_idx
  on public.entitlements (
    provider,
    provider_subscription_id,
    provider_last_event_timestamp_ms desc
  )
  where provider is not null
    and provider_subscription_id is not null
    and provider_last_event_timestamp_ms is not null;
