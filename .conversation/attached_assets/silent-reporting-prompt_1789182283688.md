# Replit AI Build Prompt — Duale Digital SILENT Reporting System

Copy-paste this whole prompt into Replit's AI Agent.

---

## PROJECT OVERVIEW

Build a full-stack web application called **"Duale SILENT Reporting System"** — a secure, anonymous-capable digital and physical child protection reporting and participatory oversight platform for Barangay Duale, Limay, Bataan, operated by the Duale Child Protection Council (DCPC) with supervisory access for the PNP Women and Children Protection Desk (WCPD).

**Tech stack (required, do not substitute):**
- Frontend: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- Backend/Database: Supabase (Postgres + Auth + Row Level Security + Storage for evidence attachments)
- Hosting: Vercel (frontend/API routes)
- Version control: GitHub (push-ready repo structure, clean commit-able code, working `.gitignore`, `.env.example`)
- No other backend framework. No ORM other than Supabase's JS client (`@supabase/supabase-js`) and `@supabase/ssr` for auth session handling.

**Non-negotiable requirement: zero build errors, zero TypeScript errors, zero missing environment variable crashes.** Include a `.env.example` file listing every required variable with placeholder values. Include a `README.md` with setup steps for Supabase project creation, running SQL migrations, and deploying to Vercel.

---

## VISUAL DESIGN DIRECTION — "Signal in the Dark"

This is not a generic government form site and not a generic SaaS dashboard. The design concept: **a quiet, futuristic beacon network** — the feeling of sending a signal for help into a system that is always watching, calm, and safe. Modern, a little sci-fi, but never cold or intimidating, since a frightened child may be the one opening it.

**Color — 6 named tokens, use exactly these:**
- `--ink-950: #0A0E1A` — near-black indigo-navy, the base background (not pure black, not cream — avoid both defaults)
- `--ink-800: #131A2C` — elevated surface (cards, panels)
- `--signal-teal: #2FE6B8` — the "beacon" accent: used ONLY for the report/send action and active-signal states, so it stays meaningful, not decorative
- `--signal-amber: #FFB454` — reserved strictly for urgency/emergency states (the "I need help right now" path) — never used decoratively elsewhere, so amber always means "urgent" at a glance
- `--mist-300: #B8C2D9` — muted body text on dark surfaces
- `--paper-50: #F6F7FB` — the one light surface, used only for the public-facing report form itself (a "safe, calm room" inside the otherwise dark, technical shell) — this is a deliberate contrast, not an inconsistency

**Typography:**
- Headline/display face: a geometric, slightly technical sans with distinct character — e.g. "Space Grotesk" or "General Sans" — used for section titles and the hero
- Body/UI face: a humanist sans built for small sizes and data density — e.g. "Inter" or "IBM Plex Sans" — used for everything else, forms, dashboard tables
- Do not use a serif anywhere. Do not use a monospace face for labels — this is not a dev-tool aesthetic.

**Layout concept:**
- Public landing (`/`) and report form (`/report`) are the "calm room": generous whitespace on `--paper-50`, centered, single-column, large tap targets, nothing that feels like a bureaucratic form — one question visible at a time on mobile, not a wall of fields
- Authenticated dashboards (`/dashboard`, `/pnp`, `/oversight`) are the "operations deck": dark (`--ink-950`/`--ink-800`), data-dense, asymmetric layout with a persistent left rail for navigation and a live-feed-style case list, not identical rounded SaaS cards
- The one signature visual moment: on the public landing page, a slow, subtle pulsing ring/beacon animation around the primary "Report Now" button — a single orchestrated moment, not motion scattered across the page — representing a signal being sent safely into the network. Respect `prefers-reduced-motion`.
- Avoid generic AI-design tells: no tracked-out ALL-CAPS eyebrow labels, no numbered 01/02/03 markers unless content is truly sequential, no identical drop-shadow cards, no terracotta/cream palette, no arrow (→) appended to every button.

**Tone of writing in the UI:** plain, calm, second-person, never bureaucratic. Buttons say exactly what happens ("Send report," not "Submit"). Empty/error states explain what happened and what to do next, without sounding like a form filing a complaint.

---

## CORE USER ROLES

1. **Reporter (public, unauthenticated)** — anyone submitting a report. No login required. Can choose "Anonymous" or "Identified" at submission time.
2. **DCPC Officer** — triages incoming reports, adds internal notes, changes status, cannot see raw evidence of a case unless assigned.
3. **DCPC Chair** (E.J.'s role) — full access to all reports, manages officer accounts, generates monthly anonymized summary reports, manages the Oversight Committee module.
4. **PNP WCPD Supervisor** — read access to urgent/high-risk flagged cases only, can mark a case "escalated to PNP," cannot edit report content, all access is logged.
5. **Oversight Committee Member** (SK rep, parent/guardian rep) — sees only aggregated/anonymized monthly statistics and trends, never individual case content.

Use Supabase Auth with email/password for roles 2–5. Role assignment via a `profiles` table with a `role` enum column, enforced by Row Level Security (RLS) — never trust client-side role checks alone.

---

## FEATURES TO BUILD

### 1. Public Reporting Interface
- On `--paper-50` "calm room" styling. Large, simple, mobile-first form accessible via QR code landing page (`/report`)
- Toggle: "Report Anonymously" (default ON) vs "Include My Contact Info"
- Fields: what happened (free text), who is involved (optional, free text), when/where (optional), urgency self-assessment (dropdown: "I need help right now" / "This needs attention soon" / "General concern"), optional file upload (photo/screenshot) stored in a private Supabase Storage bucket
- On "I need help right now," show a prominent `--signal-amber` banner with PNP emergency hotline and Barangay emergency contact BEFORE they can submit — the form must never be the only channel for an active emergency
- After submission: generate a random **tracking code** (e.g. `DCPC-XXXXXX`) shown once to the reporter so they can check status later at `/status/[code]` WITHOUT logging in — this preserves anonymity while allowing follow-up
- Multi-language toggle: English / Tagalog

### 2. Physical Drop-Box Companion
- Simple internal form (`/intake/physical`) that a DCPC officer uses to manually log a report retrieved from the physical drop-box, entered into the same database with a `source: 'physical_dropbox'` tag, same tracking-code system generated and written on a slip given back via the school/barangay hall drop-off point

### 3. DCPC Triage Dashboard (`/dashboard`, authenticated, "operations deck" styling)
- List of incoming reports sorted by urgency and date, live-feed style
- Status pipeline: `New` → `Under Review` → `Referred` → `Resolved` → `Closed`
- Internal notes thread per case (visible only to DCPC Officer/Chair and, for escalated cases, PNP WCPD)
- One-click "Escalate to PNP WCPD" action that flags the case and notifies the PNP supervisor account
- Full audit log table: every view/edit of a case is logged with user, timestamp, action — visible to DCPC Chair only

### 4. PNP WCPD Supervisor View (`/pnp`, authenticated, restricted role)
- Read-only list of escalated/urgent cases only
- Cannot see non-escalated or low-urgency reports
- Can mark case as "PNP action taken" with a short note
- All access auto-logged

### 5. Oversight Committee / Transparency Module (`/oversight`, authenticated, restricted role)
- Aggregated statistics only: number of reports per month, category breakdown, average response time, resolution rate — NO names, NO free-text content, NO identifying details ever surfaced here
- Auto-generates a "Monthly Summary Report" (downloadable PDF or on-page) matching the DCPC's existing "State of Duale Youth" transparency concept

### 6. Youth Feedback Loop
- Simple anonymous feedback form (`/feedback`) separate from case reporting — "How safe/comfortable did you feel using this system?" — results only visible in aggregate to DCPC Chair and Oversight Committee

---

## DATABASE SCHEMA (Supabase / Postgres) — required tables

```sql
-- profiles: extends auth.users
create table profiles (
  id uuid references auth.users primary key,
  full_name text,
  role text check (role in ('dcpc_officer','dcpc_chair','pnp_supervisor','oversight_member')) not null,
  created_at timestamptz default now()
);

-- reports: the core case table
create table reports (
  id uuid primary key default gen_random_uuid(),
  tracking_code text unique not null,
  is_anonymous boolean not null default true,
  reporter_contact text, -- nullable, only if not anonymous
  description text not null,
  people_involved text,
  incident_datetime text,
  urgency text check (urgency in ('emergency','soon','general')) not null,
  status text check (status in ('new','under_review','referred','resolved','closed')) default 'new',
  source text check (source in ('digital','physical_dropbox')) default 'digital',
  escalated_to_pnp boolean default false,
  assigned_officer uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- report_attachments: evidence files (stored in Supabase Storage, this table holds metadata only)
create table report_attachments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references reports(id) on delete cascade,
  storage_path text not null,
  uploaded_at timestamptz default now()
);

-- case_notes: internal triage notes
create table case_notes (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references reports(id) on delete cascade,
  author_id uuid references profiles(id),
  note text not null,
  visible_to_pnp boolean default false,
  created_at timestamptz default now()
);

-- audit_log: every access/action on a case
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references reports(id),
  actor_id uuid references profiles(id),
  action text not null,
  created_at timestamptz default now()
);

-- feedback: anonymous youth feedback on the system itself
create table feedback (
  id uuid primary key default gen_random_uuid(),
  comfort_rating int check (comfort_rating between 1 and 5),
  comments text,
  created_at timestamptz default now()
);
```

Write full Row Level Security policies for every table:
- `reports`: public can INSERT only (no SELECT/UPDATE/DELETE); `dcpc_officer`/`dcpc_chair` can SELECT/UPDATE all; `pnp_supervisor` can SELECT only where `escalated_to_pnp = true`; nobody except `dcpc_chair` can DELETE.
- `case_notes`: only `dcpc_officer`/`dcpc_chair` can INSERT; `pnp_supervisor` can SELECT only rows where `visible_to_pnp = true` and the parent report is escalated.
- `audit_log`: INSERT allowed by any authenticated role automatically (via trigger, not client), SELECT restricted to `dcpc_chair` only.
- `feedback`: public INSERT only, SELECT restricted to `dcpc_chair`/`oversight_member`, and only in aggregate (build the aggregation in a Postgres view, not raw row access).

Also create a Postgres **view** `oversight_stats` that pre-aggregates reports by month/category/status with no free-text or identifying columns, and grant SELECT on that view only (not the base `reports` table) to the `oversight_member` role.

---

## SECURITY / CONFIDENTIALITY REQUIREMENTS

- All traffic HTTPS only (Vercel default)
- Supabase Storage bucket for attachments must be **private**, accessed only via signed URLs generated server-side, never public
- No analytics/tracking scripts on `/report` or `/status/[code]` pages that could deanonymize a visitor
- Rate-limit the public report submission endpoint to prevent spam/abuse
- Session timeout for all authenticated dashboards (e.g. 30 min idle)
- Every environment variable (Supabase URL, anon key, service role key) documented in `.env.example`; service role key used **only** in server-side API routes, never exposed to the client

---

## DEPLOYMENT INSTRUCTIONS TO INCLUDE IN README

1. Create a new Supabase project, run the SQL migration file provided, copy the project URL + anon key + service role key into `.env.local`
2. Push repo to GitHub
3. Import repo into Vercel, add the same environment variables in Vercel's project settings
4. Deploy; generate the `/report` QR code pointing to the production URL

---

## VERCEL DEPLOYMENT — ERROR PREVENTION CHECKLIST

Follow these explicitly to avoid the most common Replit-works-but-Vercel-fails issues:

1. Run `npm run build` locally (or in Replit's shell) before considering the app done — not just `npm run dev`. `dev` mode hides TypeScript and build errors that only surface in production builds.
2. Add an `"engines": { "node": ">=18.18.0" }` field in `package.json` to pin a Node version compatible with Vercel's default.
3. Never import `SUPABASE_SERVICE_ROLE_KEY` (or any `service_role` usage) into a file that ships to the client — it must only appear in files under `app/api/*` or server components/actions that never execute in the browser. Double-check no client component imports a file that imports the service role key, even indirectly.
4. Set `NEXT_PUBLIC_` prefix ONLY on the two keys that are safe for the browser (Supabase URL and anon key). The service role key must never have that prefix.
5. List every required environment variable in `.env.example` AND in the README's deployment steps, with an explicit reminder: "these must be re-entered in Vercel's Project Settings → Environment Variables — Vercel does not read your local `.env.local` file."
6. Avoid any Node-only APIs (like `fs`, `path` file-system calls) inside code that runs in Edge Runtime API routes; if unsure, force `export const runtime = 'nodejs'` on API routes that touch Supabase Storage or the service role key.
7. After first Vercel deploy, check the Vercel deployment logs (not just "Ready" status) for build-time warnings before sharing the live link.

## FINAL INSTRUCTION TO THE AI AGENT

Build this as a complete, working, deployable Next.js + Supabase project with no placeholder "TODO" logic in core flows (report submission, triage dashboard, status lookup by tracking code, RLS policies). Follow the Visual Design Direction section precisely and consistently across every page — do not fall back to default shadcn/Tailwind starter styling. Test that a fresh clone with a new Supabase project and the documented env vars builds and runs with zero errors on `npm run build` and deploys cleanly to Vercel.
