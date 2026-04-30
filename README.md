# Cyklodeník — frontend

Osobní cyklistický deník (PWA) pro záznam výjezdů a sledování statistik.

- **Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · TypeScript
- **Auth:** Supabase magic link (passwordless)
- **DB:** Supabase Postgres (tabulka `rides`)

## Spuštění lokálně

```bash
npm install
npm run dev
```

Otevři [http://localhost:3000](http://localhost:3000).

## Konfigurace prostředí

V kořeni projektu vytvoř `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-or-publishable-key>
```

Obě proměnné musí mít prefix `NEXT_PUBLIC_`, aby je client (browser) viděl.

## Architektura

```
src/
├── app/
│   ├── auth/callback/route.ts   # výměna kódu za session (Supabase exchange)
│   ├── dashboard/page.tsx       # přihlášený dashboard se statistikami
│   ├── layout.tsx               # root layout (PWA viewport, ikony)
│   ├── manifest.ts              # PWA manifest
│   ├── page.tsx                 # přihlášení magic linkem
│   └── globals.css              # Tailwind + safe-area utilities
├── lib/supabase.ts              # browser Supabase client
└── proxy.ts                     # Next.js 16 Proxy (chrání /dashboard)
```

> Next.js 16: konvence `middleware.ts` je deprecated a přejmenovaná na `proxy.ts`.
> Více v [docs](./node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md).

## Schéma databáze

```sql
create table public.rides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  km numeric(7,1) not null check (km > 0),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.rides enable row level security;

create policy "users manage own rides"
  on public.rides
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

## Backend

Související REST API (Express + Supabase) běží v repozitáři `km-denik-backend`
a poskytuje endpoint `/api/rides/summary` pro Make.com automatizaci týdenního
emailu.

## Deploy

Deploy na Vercel (auto-detekce Next.js). V Project Settings → Environment Variables
nastav `NEXT_PUBLIC_SUPABASE_URL` a `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
