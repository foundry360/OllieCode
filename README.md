# Ollie Code

Front-end scaffold for a kids coding platform (ages 7–13): Next.js, Blockly, p5.js, Howler.js, optional GSAP and Interact.js, and Supabase hooks for auth and project storage.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the landing page and `/workspace` for the Blockly + canvas.

## Environment

Copy `.env.example` to `.env.local` and add your Supabase URL and anon key. Without them, **Save** still writes to `localStorage`; cloud save and auth need Supabase.

Create a Storage bucket named `projects` (or change the name in `src/lib/supabase/projectStorage.ts`) and configure RLS for your use case.

## Deploy (Vercel)

Connect this repo to [Vercel](https://vercel.com), set the same `NEXT_PUBLIC_*` env vars, and deploy. No extra config is required for a standard Next.js app.

## Project layout

- `src/app/` — routes: landing (`/`), workspace (`/workspace`), auth placeholder (`/auth/login`)
- `src/components/landing/` — marketing sections
- `src/components/workspace/` — Blockly UI, p5 canvas, missions, gamification placeholders
- `src/lib/blockly/` — custom blocks, toolbox, execution
- `src/lib/supabase/` — browser client and storage helpers
- `public/placeholders/` — SVG placeholders for hero, features, avatars
- `public/sounds/` — add `pop.mp3`, `boing.mp3`, `cheer.mp3` for Howler (fallback beeps work without files)

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — run production build locally
- `npm run lint` — ESLint
