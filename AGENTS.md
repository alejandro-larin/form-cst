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
- `app/page.tsx` — all form state, submit/cookie logic, and markup (`'use client'`).
- `app/api/evaluaciones/route.ts` — `POST` handler: validates with zod, appends one row to a Google Sheet via `googleapis`, and sets the `corsatur_evaluacion_enviada` cookie.
- `lib/evaluacion.ts` — shared `criteria`/`ratings`/`rubros`, criterion keys, sheet column names, cookie constants, and payload type. Keep it in sync with `page.tsx` and the route.
- `app/globals.css` — Tailwind v4 (`@import 'tailwindcss'`, no `tailwind.config`) plus nearly all actual styling as hand-written semantic classes (`.topbar`, `.criterion-row`, `.rating-choice`, ...). Colors are CSS variables (`--gold*`, `--surface*`, `--text-*`, ...) with light/dark values; change the tokens instead of adding hardcoded hex colors. The light theme keeps the original blue/slate palette; gold is applied only under `.dark`. When changing markup in `page.tsx`, update matching rules here; do not assume utility classes alone style the page.
- `components/theme-toggle.tsx` — toggles `.dark` on `<html>` and persists the choice in `localStorage` (`corsatur-theme`). The class is applied before hydration by an inline script in `app/layout.tsx`; keep `suppressHydrationWarning` on `<html>`.
- `lib/utils.ts` — `cn()` helper (clsx + tailwind-merge).
- `components/ui/` — shadcn-generated primitives (currently only `button.tsx`).

## Behavior notes

- Submissions go to `POST /api/evaluaciones`; there is no database. All visible fields and all 13 rating criteria are required, validated on the client and re-validated with zod on the server. Rows are appended to the sheet configured by env vars. The route auto-creates the header row only when the sheet is empty and uses `RAW` values to avoid formula injection.
- Required server env vars (also set in Vercel): `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` (with `\n` escapes), `GOOGLE_SHEET_ID`; optional `GOOGLE_SHEET_RANGE` (tab name or A1 range). When it is unset, the route uses the spreadsheet's first tab. Share the spreadsheet with the service account as Editor.
- On success the API sets the 7-day `corsatur_evaluacion_enviada` cookie (not HttpOnly, no PII). `page.tsx` reads it on mount to show the confirmation and disables resubmission until "Enviar otra evaluación" / "Limpiar formulario" clears it.
- `BrandMark` in `app/page.tsx` uses the local transparent logo `public/corsatur-logo.png` in light mode (blue) and `public/corsatur-logo-dark.png` in dark mode (white emblem, yellow stars); both are stacked in the SVG and swapped with `.dark` rules in `globals.css`.
- All images are unoptimized (`images.unoptimized: true`).
- No `.env*` files are committed (`.gitignore` ignores them); analytics only activates in production.
