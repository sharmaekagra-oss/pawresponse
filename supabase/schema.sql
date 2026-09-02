-- PawResponse schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query)

-- Profile table, one row per auth user
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'owner' check (role in ('owner', 'paravet')),
  full_name text not null default '',
  phone text not null default '',
  -- default dispatch address, set during onboarding
  address_street text not null default '',
  address_locality text not null default '',
  address_city text not null default '',
  address_landmark text not null default '',
  address_pincode text not null default '' check (address_pincode = '' or address_pincode ~ '^[0-9]{6}$'),
  is_available boolean not null default true, -- only meaningful for paravets
  role_confirmed boolean not null default false, -- false until the user has explicitly picked owner/paravet
  created_at timestamptz not null default now()
);

-- Pets, owned by pet-owner users (the CRUD entity)
create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  species text not null default 'Dog',
  breed text not null default '',
  age_years numeric not null default 0,
  medical_notes text not null default '',
  created_at timestamptz not null default now()
);

-- Partner clinics, admin-seeded reference data for the escalation tier
create table if not exists public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  phone text not null default ''
);

-- Emergency requests: the core business flow entity
create table if not exists public.emergency_requests (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  description text not null,
  address_street text not null,
  address_locality text not null,
  address_city text not null,
  address_landmark text not null default '',
  address_pincode text not null check (address_pincode ~ '^[0-9]{6}$'),
  urgency text not null default 'yellow' check (urgency in ('red', 'yellow', 'green')),
  status text not null default 'pending' check (
    status in ('pending', 'triaged', 'accepted', 'en_route', 'reached', 'resolved', 'cancelled')
  ),
  assigned_vet_id uuid references public.profiles(id) on delete set null,
  triage_note text not null default '',
  triage_attachments text[] not null default '{}',
  dispatch_decision text check (dispatch_decision in ('home_visit', 'advise_home_care', 'escalate_clinic')),
  clinic_id uuid references public.clinics(id) on delete set null,
  -- proof of arrival for a home visit
  reached_at timestamptz,
  reached_photo_url text,
  -- post-visit summary, filled in right before resolving
  resolution_notes text not null default '',
  resolution_attachments text[] not null default '{}',
  visit_outcome text check (
    visit_outcome in ('resolved', 'follow_up_requested', 'ambulance_requested', 'referred_clinic')
  ),
  tests_recommended text not null default '',
  -- lightweight billing: fee is computed from urgency + dispatch decision at triage
  -- time, and settled in person (cash/UPI) — no payment gateway
  fee_amount integer not null default 0,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid')),
  payment_method text check (payment_method in ('cash', 'upi', 'other')),
  paid_at timestamptz,
  -- destination coordinates, geocoded once from the address at creation time
  dest_lat double precision,
  dest_lng double precision,
  -- paravet's live position while en route, and the ETA they've set
  vet_lat double precision,
  vet_lng double precision,
  vet_location_updated_at timestamptz,
  eta_minutes integer,
  photo_url text,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Service coverage area, keyed by pincode (like a Zepto/Blinkit serviceability check)
create table if not exists public.service_areas (
  pincode text primary key check (pincode ~ '^[0-9]{6}$'),
  city text not null,
  is_active boolean not null default true
);

-- Auto-create a profile row whenever a new auth user signs up.
-- Role, full_name, phone are passed via signUp's `options.data` and land in raw_user_meta_data.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id, email, role, full_name, phone,
    address_street, address_locality, address_city, address_landmark, address_pincode,
    role_confirmed
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'owner'),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'address_street', ''),
    coalesce(new.raw_user_meta_data ->> 'address_locality', ''),
    coalesce(new.raw_user_meta_data ->> 'address_city', ''),
    coalesce(new.raw_user_meta_data ->> 'address_landmark', ''),
    coalesce(new.raw_user_meta_data ->> 'address_pincode', ''),
    -- email/password signup passes `role` explicitly; OAuth sign-ins don't, so
    -- those land here unconfirmed and get routed to /onboarding to pick one.
    (new.raw_user_meta_data ? 'role')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Keep updated_at current on emergency_requests
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_emergency_requests_updated_at on public.emergency_requests;
create trigger set_emergency_requests_updated_at
  before update on public.emergency_requests
  for each row execute procedure public.set_updated_at();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.pets enable row level security;
alter table public.clinics enable row level security;
alter table public.emergency_requests enable row level security;
alter table public.service_areas enable row level security;

-- Profiles: readable by anyone signed in (owners need to see assigned vet's name/phone,
-- paravets need to see owner contact info); only the owner of the row can update it.
create policy "profiles are readable by authenticated users" on public.profiles
  for select to authenticated using (true);
create policy "users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- Pets: owners manage their own pets. Paravets can read any pet (needed to see
-- patient details on requests in their queue or assigned to them).
create policy "owners manage their own pets" on public.pets
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "paravets can read all pets" on public.pets
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'paravet')
  );

-- Clinics: readable by anyone signed in; no client-side writes (seed via SQL editor).
create policy "clinics are readable by authenticated users" on public.clinics
  for select to authenticated using (true);

-- Emergency requests:
-- Owners: full access to their own requests.
create policy "owners manage their own requests" on public.emergency_requests
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Paravets: can read the open queue (pending/triaged, unassigned) and anything assigned to them.
create policy "paravets can read the queue and their assignments" on public.emergency_requests
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'paravet')
    and (assigned_vet_id is null or assigned_vet_id = auth.uid())
  );

-- Paravets: can claim an unassigned request (accept) or update one already assigned to them.
create policy "paravets can claim or update requests" on public.emergency_requests
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'paravet')
    and (assigned_vet_id is null or assigned_vet_id = auth.uid())
  );

-- Enable live tracking: owners subscribe to their own request's row via Realtime
-- (postgres_changes), which Supabase filters through the same RLS SELECT policy above.
alter publication supabase_realtime add table public.emergency_requests;

-- Service areas: readable by anyone signed in; no client-side writes.
create policy "service areas are readable by authenticated users" on public.service_areas
  for select to authenticated using (true);

-- Seed a handful of serviceable pincodes (matching the seeded clinic cities) so the
-- coverage check has real "yes" and "no" cases to demo.
insert into public.service_areas (pincode, city) values
  ('560001', 'Bengaluru'),
  ('560034', 'Bengaluru'),
  ('560095', 'Bengaluru'),
  ('560100', 'Bengaluru'),
  ('400001', 'Mumbai'),
  ('400050', 'Mumbai'),
  ('110001', 'Delhi'),
  ('110016', 'Delhi')
on conflict do nothing;

-- Seed partner clinics
insert into public.clinics (name, address, phone) values
  ('Green Cross Veterinary Hospital', '12 MG Road, Bengaluru', '080-1234-5678'),
  ('Pawsitive Care Clinic', '45 Linking Road, Mumbai', '022-9876-5432'),
  ('CityVet Emergency Centre', '7 Ring Road, Delhi', '011-4455-6677')
on conflict do nothing;

-- Storage bucket for emergency request photos (public bucket: uploaded photos are
-- served directly via public URL, no signed URLs needed).
insert into storage.buckets (id, name, public)
values ('emergency-photos', 'emergency-photos', true)
on conflict do nothing;

drop policy if exists "authenticated users can upload emergency photos" on storage.objects;
create policy "authenticated users can upload emergency photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'emergency-photos');

-- Storage bucket for triage note attachments (photos, PDFs, Word docs, text files).
insert into storage.buckets (id, name, public)
values ('triage-attachments', 'triage-attachments', true)
on conflict do nothing;

drop policy if exists "authenticated users can upload triage attachments" on storage.objects;
create policy "authenticated users can upload triage attachments" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'triage-attachments');

-- After running this, promote yourself to a paravet if you want to test that role
-- (sign up first, then run):
-- update public.profiles set role = 'paravet' where email = 'you@example.com';
