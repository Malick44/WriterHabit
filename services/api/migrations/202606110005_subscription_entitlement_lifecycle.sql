-- WriterHabit subscription entitlement lifecycle hardening.
-- RevenueCat webhooks and restore reconciliation need explicit terminal and
-- recoverable states beyond the original local paywall scaffold.

alter table public.entitlements
  drop constraint if exists entitlements_status_check;

alter table public.entitlements
  add constraint entitlements_status_check check (
    status in (
      'free',
      'trial',
      'active',
      'past_due',
      'canceled',
      'expired',
      'refunded',
      'grace_period'
    )
  );

create index if not exists entitlements_owner_updated_idx
  on public.entitlements (owner_user_id, updated_at desc);
