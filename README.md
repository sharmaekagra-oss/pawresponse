# PawResponse

An on-call paravet dispatch app for home pet emergencies, built with Next.js
(App Router) and Supabase.

## Features

- **Auth** — sign up as a pet owner or a paravet, log in, log out
- **CRUD** — pet owners manage their pets' profiles (`/pets`)
- **Core business flow** — a three-tier emergency dispatch pipeline:
  1. **Triage tier** — owner submits a color-coded emergency request (Critical /
     Urgent / Non-urgent) for one of their pets
  2. **Assessment tier** — an available paravet claims the case, logs a triage
     note (simulating a quick phone/video assessment), and decides: dispatch a
     home visit, advise home care, or escalate to a partner clinic
  3. **Resolution tier** — home visits progress through en route → resolved;
     escalations surface the partner clinic's name, address, and phone to the
     owner

## Stack

- Next.js (App Router, Server Components, Server Actions)
- Supabase (Postgres + Auth) via `@supabase/ssr`
- Tailwind CSS

## Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a new project, then open
**Project Settings → API** and copy the **Project URL** and **anon public key**.

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in your Supabase URL and anon key.

### 3. Configure redirect URLs

Supabase's default confirmation email and OAuth flow both redirect back to our
app via a `code` parameter that `/auth/callback` exchanges for a session — no
custom email template needed (Supabase gates template editing behind custom
SMTP anyway).

1. Go to **Authentication → URL Configuration** and set **Site URL** to
   `http://localhost:3000` for local dev.
2. Under **Redirect URLs** on the same page, add:
   ```
   http://localhost:3000/**
   ```
   (or at minimum `http://localhost:3000/auth/callback`) — Supabase rejects
   redirects to URLs not on this allowlist.

### 4. Enable Google sign-in (optional but wired up in the app)

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
   create an **OAuth client ID** (Application type: **Web application**).
2. Add this **Authorized redirect URI** (found on Supabase's Google provider
   settings page, or use this pattern):
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
3. Copy the generated **Client ID** and **Client secret**.
4. In Supabase: **Authentication → Providers → Google**, toggle it on, paste the
   Client ID and secret, save.

Users who sign in with Google skip the confirmation-email step but land on
`/onboarding` once to pick their role (owner/paravet) and phone number, since
Google doesn't tell us that.

### 5. Set up the database

Open the Supabase SQL editor and run the contents of `supabase/schema.sql`. This
creates `profiles`, `pets`, `clinics`, and `emergency_requests`, sets up row-level
security, and seeds three partner clinics.

### 6. Install dependencies and run

```bash
npm install
npm run dev
```

### 7. Test both roles

Sign up twice with two different emails — once choosing **Pet owner**, once
choosing **Paravet**. As the owner, add a pet and submit an emergency request.
As the paravet, accept it from the queue, submit a triage note and a dispatch
decision, then progress it to resolved.

## How the business flow works

1. **Owner** picks a pet, sets urgency (color-coded), describes the emergency,
   and submits — this creates a `pending` request.
2. **Paravet** (if marked Available) sees it in the open queue and claims it —
   an atomic, race-safe update (`WHERE assigned_vet_id IS NULL`) ensures only one
   paravet can claim a given case.
3. The paravet logs a **triage note** and picks a **dispatch decision**:
   - *Home visit* → status moves to `triaged` → paravet marks `en_route` →
     `resolved`
   - *Advise home care* → resolved immediately, no visit needed
   - *Escalate to clinic* → owner is shown the referred partner clinic's
     contact details, then marked `resolved`
4. The owner's `/requests` page reflects every status change live on reload,
   including the assigned paravet's contact info or the referred clinic.

## Deploying

Push to GitHub, import into [Vercel](https://vercel.com), and add the same
environment variables in the Vercel project settings (including
`NEXT_PUBLIC_SITE_URL` set to your deployed URL — also update Supabase's Site
URL and the confirmation email template to match).
