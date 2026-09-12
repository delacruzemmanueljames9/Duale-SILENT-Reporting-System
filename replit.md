# Duale SILENT Reporting System

An anonymous-capable child protection reporting and oversight platform for Barangay Duale, Limay, Bataan.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Preview env: `VITE_API_BASE_URL=/api`; Supabase deployment variables are documented in `artifacts/duale-silent/.env.example`.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + TypeScript + Tailwind CSS
- API: Express 5 under `/api`
- Production data model: Supabase Postgres + Auth + RLS + private Storage
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/duale-silent` — public reporting and responder web app
- `artifacts/api-server/src/routes/reports.ts` — preview API and seeded cases
- `lib/api-spec/openapi.yaml` — API source of truth
- `artifacts/duale-silent/supabase/migrations/001_silent_reporting.sql` — Supabase tables and RLS

## Architecture decisions

- The public flow uses a light calm room while responder views use the dark operations deck.
- Preview data lives in the API process so the app works without secrets; Supabase migration files define the production boundary.
- Tracking codes are the only public status identifier; public status responses never expose free text or contact data.
- The API contract is generated from OpenAPI before frontend work.

## Product

- Public report submission with anonymous or identified choice, emergency warning, and tracking code receipt.
- Anonymous status lookup and youth feedback.
- DCPC triage with status changes, notes, and PNP escalation.
- PNP restricted view and anonymized oversight statistics.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
