# Ollie Code

Front-end scaffold for a kids coding platform (ages 7–13): Next.js, Blockly, p5.js, Howler.js, optional GSAP and Interact.js, and Supabase hooks for auth and project storage.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page and `/workspace` for the Blockly + canvas.

## Environment

Copy `.env.example` to `.env.local` and add your Supabase URL and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). Without them, **Save** still uses `localStorage`; cloud save and sign-in need Supabase.

### Supabase: tables vs storage

- **Auth** (`auth.users`) is created for you when people sign up — you do not add those tables yourself.
- **Projects** in this app are **not** stored in Postgres rows. They are JSON files in **Storage** (bucket `projects`, path `{userId}/{projectId}.json`). See `src/lib/supabase/projectStorage.ts`.
- **Tables:** optional SQL lives in `supabase/migrations/`. If you **already** have the private `projects` bucket and policies, skip `20260403120000_storage_projects.sql` and only run `20260403120001_ollie_profiles.sql` if you want the `public.profiles` table (Dashboard → **SQL Editor** → paste → Run).

### Supabase dashboard

1. **Authentication → URL configuration:** set **Site URL** to `http://localhost:3000` (and your production URL when deployed). Under **Redirect URLs**, add:
   - `http://localhost:3000/auth/callback` (and production `https://…/auth/callback`) — magic links, OAuth, and **password recovery** exchange the session here before redirecting to `next`.
   - `http://localhost:3000/auth/update-password` — optional to list explicitly; recovery emails redirect via `/auth/callback?next=/auth/update-password`.
2. **Storage:** If the bucket is not set up yet, run `supabase/migrations/20260403120000_storage_projects.sql`. If you already configured the `projects` bucket and policies in the dashboard, you do not need that file.

The app uses `@supabase/ssr` with `src/middleware.ts` to refresh sessions and `src/app/auth/callback/route.ts` for the PKCE exchange after email links.

## Deploy (Vercel)

Connect this repo to [Vercel](https://vercel.com), set the same `NEXT_PUBLIC_*` env vars, and deploy. No extra config is required for a standard Next.js app.

## Project layout

- `src/app/` — routes: landing (`/`), workspace (`/workspace`), auth (`/auth/login` sign-in & sign-up, `/auth/update-password` after reset email, `/auth/callback` for email links)
- `src/components/landing/` — marketing sections
- `src/components/workspace/` — Blockly UI, p5 canvas, gamification placeholder
- `src/lib/blockly/` — Scratch-style blocks (unique hue per Ollie block in `blockHues.ts`), bright Zelos theme in `ollieTheme.ts`, plus Blockly library blocks; `@blockly/field-colour` supplies Blockly’s color blocks (not in core `blockly/blocks`)
- `src/lib/supabase/` — env helper, browser + server clients (`@supabase/ssr`), middleware session refresh, storage helpers
- `supabase/migrations/` — optional SQL: `*_storage_projects.sql` (bucket + policies) and `*_ollie_profiles.sql` (profiles table only)
- `src/middleware.ts` — refreshes Supabase auth cookies on each request
- `src/app/auth/callback/route.ts` — PKCE exchange after magic link / OAuth
- `public/placeholders/` — SVG placeholders for hero, features, avatars
- `public/sounds/` — add `pop.mp3`, `boing.mp3`, `cheer.mp3` for Howler (fallback beeps work without files)

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — run production build locally
- `npm run lint` — ESLint
