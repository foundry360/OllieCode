-- Daily contract MRR snapshots (UTC) for admin month-over-month vs prior month-end.
-- Written by the admin dashboard server using the service role.

create table if not exists public.admin_stripe_mrr_daily (
  day_utc date not null primary key,
  mrr_cents bigint not null check (mrr_cents >= 0),
  currency text not null,
  updated_at timestamptz not null default now()
);

comment on table public.admin_stripe_mrr_daily is
  'Contract MRR (run rate) from Stripe active subscriptions, one row per UTC day; used for MoM vs prior month-end.';

alter table public.admin_stripe_mrr_daily enable row level security;

revoke all on public.admin_stripe_mrr_daily from public;
revoke all on public.admin_stripe_mrr_daily from anon;
revoke all on public.admin_stripe_mrr_daily from authenticated;

grant select, insert, update, delete on public.admin_stripe_mrr_daily to service_role;
