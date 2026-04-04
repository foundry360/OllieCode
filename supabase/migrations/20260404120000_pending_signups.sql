/*
  Parent-approved child signups — pending until parent clicks approval link.
  Apply in Supabase SQL Editor if you manage migrations manually.
*/

create table if not exists public.pending_signups (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  password_ciphertext text not null,
  age_gate_acknowledged boolean not null default false,
  parent_email text not null,
  approval_token uuid not null unique default gen_random_uuid(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

comment on table public.pending_signups is 'Child account requests awaiting parent email approval.';

create unique index if not exists pending_signups_username_lower
  on public.pending_signups (lower(username));

alter table public.pending_signups enable row level security;
