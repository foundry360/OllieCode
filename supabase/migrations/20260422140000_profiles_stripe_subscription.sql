-- Stripe subscription state for workspace access (apply in Supabase SQL Editor if not using CLI migrate).

alter table public.profiles
  add column if not exists subscription_status text not null default 'none',
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

comment on column public.profiles.subscription_status is
  'Stripe subscription lifecycle: none (no sub), or Stripe status values e.g. active, trialing, canceled.';

alter table public.profiles
  drop constraint if exists profiles_subscription_status_check;

alter table public.profiles
  add constraint profiles_subscription_status_check
  check (
    subscription_status in (
      'none',
      'incomplete',
      'incomplete_expired',
      'trialing',
      'active',
      'past_due',
      'canceled',
      'unpaid',
      'paused'
    )
  );
