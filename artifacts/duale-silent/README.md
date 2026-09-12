# Duale SILENT Reporting System

Duale SILENT is a calm, anonymous-capable reporting and participatory oversight platform for Barangay Duale, Limay, Bataan. It gives a reporter a safe way to send a signal and gives authorized DCPC and PNP responders a focused triage surface.

## Run the preview

```bash
pnpm install
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/duale-silent run dev
```

The preview includes a small seeded API data set so the public report, status lookup, and responder views can be explored without credentials. The API is intentionally isolated from the browser and runs under `/api`.

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/migrations/001_silent_reporting.sql` in the Supabase SQL editor.
3. Create staff accounts in Supabase Auth and add matching rows to `profiles` with the correct role.
4. Add the values from `.env.example` to the local environment. The anon key and project URL are safe for browser use. Keep the service role key and session secret server-only.
5. Replace the preview API handlers with server-side Supabase calls before moving from demonstration data to production. Never use the service role key in a browser bundle.

## Deploy to Vercel

1. Push the repository to GitHub.
2. Import the repository into Vercel.
3. Re-enter every environment variable from `.env.example` in Vercel Project Settings → Environment Variables. Vercel does not read your local `.env.local` file.
4. Deploy and review the build logs before sharing the production URL.
5. Generate the `/report` QR code from the production URL.

## Safety notes

- The emergency path clearly shows the hotline reminder before a report can be sent.
- The evidence bucket is private and should only be accessed with server-generated signed URLs.
- Public report and tracking flows do not include analytics scripts.
- The supplied SQL enables RLS and separates DCPC, PNP, and oversight access.
- Production auth should add a 30-minute idle timeout and rate limiting at the report endpoint.