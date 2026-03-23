create extension if not exists pgcrypto;

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_name text not null,
  client_mobile text,
  metal text not null check (metal in ('Gold', 'Silver')),
  deal_type text not null check (deal_type in ('Buy', 'Sell')),
  weight numeric(14, 3) not null check (weight > 0),
  unit text not null check (unit in ('grams', 'kg', 'tola')),
  purity text not null,
  rate numeric(14, 2) not null check (rate > 0),
  vendor_name text,
  vendor_deal_type text not null default 'Buy' check (vendor_deal_type in ('Buy', 'Sell')),
  vendor_rate numeric(14, 2),
  vendor_weight numeric(14, 3),
  vendor_unit text not null default 'grams' check (vendor_unit in ('grams', 'kg', 'tola')),
  deal_date date not null,
  customer_delivery_status text not null default 'Pending' check (customer_delivery_status in ('Pending', 'Delivered')),
  vendor_delivery_status text not null default 'Pending' check (vendor_delivery_status in ('Pending', 'Delivered')),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists deals_set_updated_at on public.deals;

create trigger deals_set_updated_at
before update on public.deals
for each row
execute function public.set_updated_at();

create index if not exists deals_created_at_idx on public.deals (created_at desc);
create index if not exists deals_client_name_idx on public.deals (client_name);
create index if not exists deals_vendor_name_idx on public.deals (vendor_name);
create index if not exists deals_user_id_idx on public.deals (user_id);
