# Belcoda

Belcoda is a web application for organizing communities: people and teams, events and petitions, email and WhatsApp communications, and organization settings—with real-time data sync, role-based access, and internationalization.

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/belcoda/belcoda)

## Documentation

- **[Belcoda on DeepWiki](https://deepwiki.com/belcoda/belcoda)** — Indexed, narrative documentation (overview, architecture, domains such as events, petitions, communications, auth, and deployment). Content may lag the repo slightly; verify critical details in source.
- **`AGENTS.md`** — Agent and developer guide: stack, folder layout, Zero queries/mutators, auth, and conventions.

## Tech stack

| Area              | Technology                                                                                                                                                                                   |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI                | [Svelte 5](https://svelte.dev/), [SvelteKit](https://kit.svelte.dev/), [Tailwind CSS 4](https://tailwindcss.com/), [shadcn-svelte](https://www.shadcn-svelte.com/)                           |
| Data & sync       | [PostgreSQL](https://www.postgresql.org/), [Drizzle ORM](https://orm.drizzle.team/), [Zero](https://zero.rocicorp.dev/) (Rocicorp), [drizzle-zero](https://github.com/rocicorp/drizzle-zero) |
| Auth              | [better-auth](https://www.better-auth.com/)                                                                                                                                                  |
| Validation & i18n | [Valibot](https://valibot.dev/), [Wuchale](https://github.com/wuchale/wuchale)                                                                                                               |

## Prerequisites

- **Node.js** (CI workflows use Node 24)
- **PostgreSQL** for the app database and Zero upstream
- **Environment** — Copy `.env.example` to `.env` and fill in values (database URL, Zero URLs, auth secrets, etc.)

## Getting started

```bash
npm ci
cp .env.example .env
# Edit .env with your DATABASE_URL, Zero settings, and secrets.

# App + Zero cache (typical local dev)
npm run dev
```

For app-only or other variants, see `package.json` scripts (e.g. `app:dev`, `zero:dev`).

## Common commands

| Command                                        | Purpose                                                    |
| ---------------------------------------------- | ---------------------------------------------------------- |
| `npm run dev`                                  | Run Vite dev server and Zero cache together                |
| `npm run build`                                | Production build                                           |
| `npm run check`                                | Typecheck (`svelte-check`)                                 |
| `npm run lint`                                 | ESLint + Prettier check                                    |
| `npm run generate`                             | Regenerate Zero schema from Drizzle (`zero-schema.gen.ts`) |
| `npm run db:push` / `db:migrate` / `db:studio` | Drizzle database workflows                                 |
| `npm run test:unit`                            | Vitest                                                     |
| `npm run test:e2e`                             | Playwright (see `.env.example` for `E2E_BASE_URL`)         |

## Database and Zero schema

Schema lives in Drizzle; Zero’s client schema is generated from it. After material schema changes, run `npm run generate` so `src/lib/zero/zero-schema.gen.ts` stays in sync. See `AGENTS.md` for the drizzle-zero config path and query/mutator patterns.

## Background jobs (pg-boss)

Background jobs are processed with **[pg-boss](https://github.com/timgit/pg-boss)**.

### HMR limitation

Queue workers do not support Hot Module Replacement (HMR). Workers register their handlers once at startup, and the running processes retain references to the initial handler code. **To see changes in queue handlers, you must restart the dev server.**

## Testing

- **Unit:** `npm run test:unit`
- **E2E:** `npm run test:e2e` (Playwright; base URL configurable via `E2E_BASE_URL`)

## Repository layout (overview)

| Path              | Role                                                  |
| ----------------- | ----------------------------------------------------- |
| `src/routes/`     | SvelteKit routes (`(app)`, `(auth)`, `(page)`, API)   |
| `src/lib/zero/`   | Zero schema, queries, client mutators                 |
| `src/lib/server/` | Server auth, Drizzle, API data layer, server mutators |
| `src/lib/schema/` | Valibot schemas                                       |
| `drizzle/`        | SQL migrations                                        |

For a full tree and data-flow details, see **`AGENTS.md`** and the [architecture topics on DeepWiki](https://deepwiki.com/belcoda/belcoda) (e.g. data layer, Zero, mutators, hooks).
