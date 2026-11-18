# AGENTS.md

Single-page Next.js 16 (App Router) form for CORSATUR activity evaluations. UI text is Spanish (`lang="es"`); keep it that way.

## Commands

Package manager is pnpm (`packageManager: pnpm@12.3.4`), not npm/yarn.

- `pnpm install`
- `pnpm dev` — Next dev server (Turbopack is the default in Next 16)
- `pnpm build` && `pnpm start`
- `pnpm exec tsc --noEmit` — the only available typecheck

There is **no** lint, format, or test script/config; do not invent or add one unless asked. There is also no CI or pre-commit config.

## Important quirks

- `next.config.mjs` sets `typescript.ignoreBuildErrors: true`, so `pnpm build` will NOT catch type errors. Run `pnpm exec tsc --noEmit` to verify types.
- `pnpm-workspace.yaml` only holds pnpm settings (`minimumReleaseAgeExclude`); it has no `packages:` entry. This is **not** a monorepo.
- `next-env.d.ts` and `.next/**` are generated; never edit them.
- Path alias `@/*` maps to the repo root (`@/lib/utils`, `@/components/ui/...`), configured in `tsconfig.json`.
- shadcn is configured in `components.json` with style `base-nova`; UI primitives come from `@base-ui/react` (e.g. `components/ui/button.tsx`), **not** Radix. Add components via `pnpm dlx shadcn@latest add <name>`.

## Architecture

- `app/layout.tsx` — root layout, metadata/icons, `@vercel/analytics` loaded only in production.
- `app/page.tsx` — the entire app: a `'use client'` component holding form state, `criteria`/`ratings`/`rubros` data arrays, and all markup.
- `app/globals.css` — Tailwind v4 (`@import 'tailwindcss'`, no `tailwind.config`) plus nearly all actual styling as hand-written semantic classes (`.topbar`, `.criterion-row`, `.rating-choice`, ...). When changing markup in `page.tsx`, update matching rules here; do not assume utility classes alone style the page.
- `lib/utils.ts` — `cn()` helper (clsx + tailwind-merge).
- `components/ui/` — shadcn-generated primitives (currently only `button.tsx`).

## Behavior notes

- The form has no backend/API. "Enviar evaluación" only sets local `sent` state; "Descargar" builds a JSON Blob client-side.
- `BrandMark` in `app/page.tsx` hotlinks its logo image from an external `hebbkx1anhila5yf.public.blob.vercel-storage.com` URL.
- All images are unoptimized (`images.unoptimized: true`).
- No `.env*` files are committed (`.gitignore` ignores them); analytics only activates in production.
