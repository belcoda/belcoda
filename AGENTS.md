# Belcoda – Agent Development Guide

This document provides AI agents and developers with a comprehensive overview of the Belcoda codebase architecture. The application is built with **Svelte 5**, **SvelteKit**, **Zero** (Rocicorp), **better-auth**, **shadcn-svelte**, and **Drizzle ORM**.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Frontend Layout Architecture](#frontend-layout-architecture)
4. [Data Layer: Queries, Mutators, and Data Functions](#data-layer-queries-mutators-and-data-functions)
5. [Authentication & Authorization](#authentication--authorization)
6. [Key Conventions](#key-conventions)

---

## Tech Stack

| Technology                  | Purpose                                                                                         |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| **Svelte 5**                | Reactive UI with runes (`$state`, `$derived`, `$props`, `$effect`) and snippets                 |
| **SvelteKit**               | Full-stack framework, routing, load functions, server actions                                   |
| **Zero** (`@rocicorp/zero`) | Real-time sync, offline-first client cache, query/mutate protocol                               |
| **zero-svelte**             | Svelte bindings for Zero (`z.createQuery`)                                                      |
| **better-auth**             | Authentication (email/password, Google OAuth, organizations, API keys, Stripe, one-time tokens) |
| **shadcn-svelte**           | UI components in `src/lib/components/ui/` (sidebar, form, select, etc.)                         |
| **Drizzle ORM**             | Database access, schema in `src/lib/schema/drizzle.ts`                                          |
| **drizzle-zero**            | Generates Zero schema from Drizzle (`zero-schema.gen.ts`)                                       |
| **Valibot**                 | Schema validation for forms, mutators, and API inputs                                           |
| **Wuchale**                 | i18n (locales: en, es, pt)                                                                      |
| **Tailwind CSS 4**          | Styling with CSS variables for theming                                                          |

---

## Project Structure

```
src/
├── lib/
│   ├── auth-client.ts           # better-auth client (organization, apiKey, stripe, oneTimeToken)
│   ├── zero.svelte.ts           # Zero instance + z proxy (initialized in app layout)
│   ├── state.svelte.ts          # appState: userId, organizationId, queryContext, derived queries
│   ├── schema/                  # Valibot schemas, Drizzle schema helpers
│   ├── zero/
│   │   ├── schema.ts            # Zero schema + QueryContext type
│   │   ├── zero-schema.gen.ts   # Generated from Drizzle via drizzle-zero
│   │   ├── drizzle-zero.config.ts
│   │   ├── query/               # Zero queries (list, read, filter) + permissions
│   │   └── mutate/              # Client mutators (thin wrappers)
│   ├── server/
│   │   ├── auth.ts              # better-auth config (buildBetterAuth)
│   │   ├── db/                  # Drizzle + Zero db provider
│   │   └── api/
│   │       ├── data/            # Business logic, Drizzle queries, auth checks
│   │       ├── mutate/          # Server mutators (call data functions)
│   │       └── utils/auth/permissions.ts  # getQueryContext, getAuthedTeams, getAdminOwnerOrgs
│   └── components/
│       ├── ui/                  # shadcn-svelte components
│       ├── layouts/app/         # UniversalLayout, sidebars
│       └── widgets/             # Feature-specific components
├── routes/
│   ├── +layout.svelte           # Root: locale, tooltip, toaster
│   ├── +layout.server.ts        # ssr=false, locale
│   ├── (auth)/                  # login, signup, verify-email, organization, logout
│   ├── (app)/                   # Authenticated app (Zero + appState init)
│   ├── (page)/                  # Public subdomain pages (events, petitions) – SSR enabled
│   └── (api)/                   # API routes, Zero query/push, webhooks
├── hooks.server.ts              # Auth, locale, security headers, route guards
└── locales/                     # Wuchale i18n
```

---

## Frontend Layout Architecture

### Layout Hierarchy

1. **Root layout** (`routes/+layout.svelte`)
   - Loads `app.css`, favicon, locale via Wuchale
   - `locale.setLocale(data.locale)` from layout server
   - Tooltip provider, Toaster (sonner)
   - `loadLocale` before rendering children

2. **Root layout server** (`routes/+layout.server.ts`)
   - `ssr = false` (client-side rendering by default)
   - Returns `locale` (from cookie, user preference, or URL param)

3. **App layout** (`routes/(app)/+layout.svelte`)
   - **Critical**: Initializes Zero and appState before rendering
   - `zero.init(userId, queryContext)` – must run before any Zero usage
   - `appState.init({ userId, organizationId: defaultActiveOrganizationId, queryContext })`
   - Renders children only when `zero.instance`, `appState.user`, `appState.activeOrganization`, and `appState.organizations` are all ready

4. **App layout server** (`routes/(app)/+layout.server.ts`)
   - Requires session; redirects to `/signup` if unauthenticated
   - Loads organization memberships, computes `defaultActiveOrganizationId`
   - Returns `userId`, `defaultActiveOrganizationId`, `queryContext`

5. **Section layouts** (e.g. `(app)/settings/+layout.svelte`, `(app)/events/+layout.svelte`)
   - Use `UniversalLayout` with a section-specific sidebar
   - Pattern: `{#snippet sidebar()} <SectionSidebar /> {/snippet}` then `UniversalLayout rootNav="..." {sidebar}`

### UniversalLayout

- **Location**: `src/lib/components/layouts/app/UniversalLayout.svelte`
- **Props**: `rootNav`, `sidebar` (snippet), `children` (snippet)
- **Behavior**:
  - Desktop: Sidebar + main content
  - Mobile: Top nav, bottom nav, sidebar as full-width on root; children full-width on nested routes
  - Uses `Sidebar.Provider` (shadcn-svelte) with dynamic `--sidebar-width`
  - `rootNav` used to detect root vs nested for mobile layout

### Route Groups

| Group    | Purpose                                                           | Auth                           | SSR      |
| -------- | ----------------------------------------------------------------- | ------------------------------ | -------- |
| `(auth)` | Login, signup, verify-email, organization                         | Public (redirect if logged in) | false    |
| `(app)`  | Main app (community, events, petitions, communications, settings) | Required                       | false    |
| `(page)` | Public org pages (e.g. `/page/[org]/events/[slug]`)               | Optional (OTP support)         | **true** |
| `(api)`  | API routes, Zero query/push, webhooks                             | Varies                         | N/A      |

### Page Routes (`(page)`)

- `+layout.server.ts` sets `ssr = true` so one-time tokens are consumed during the initial request
- Public event/petition signup pages live under `/page/[organizationSlug]/events/[eventSlug]` etc.

---

## Data Layer: Queries, Mutators, and Data Functions

### Overview

The data layer has three main parts:

1. **Zero queries** – Define what data the client can read (with permission filters)
2. **Client mutators** – Thin wrappers that call `tx.mutate.*` (used when mutator runs on client)
3. **Server mutators** – Run on server, call **data functions** for business logic and authorization

### Zero Queries

- **Location**: `src/lib/zero/query/`
- **Index**: `src/lib/zero/query/index.ts` – exports `defineQueries` and all query functions
- **Pattern**: Each entity has `list`, `read`, and sometimes `filter`/`listByIds`
- **Input**: Valibot schemas; `list` typically uses `listFilter` (organizationId, teamId, pageSize, searchString, etc.)
- **Permissions**: Each entity has a `permissions.ts` that returns a boolean expression (e.g. `personReadPermissions`) based on `QueryContext`

**Example – Person read** (`lib/zero/query/person/read.ts`):

```ts
builder.person
	.where('id', '=', input.personId)
	.related('tags')
	.limit(100)
	.related('teams')
	.limit(100)
	.related('notes')
	.limit(100)
	.where((expr) => personReadPermissions(expr, ctx))
	.one();
```

**Using queries in components**:

```ts
z.createQuery(queries.person.read({ personId }));
z.createQuery(queries.person.list(listFilter));
```

### QueryContext

- **Location**: `src/lib/server/api/utils/auth/permissions.ts`
- **Type**: `{ userId, authTeams, adminOrgs, ownerOrgs }`
- **authTeams**: Recursive CTE of teams the user belongs to (including child teams)
- **adminOrgs / ownerOrgs**: Organizations where user is admin or owner
- **Usage**: Passed to Zero queries and mutators for authorization

### Mutators

**Client mutators** (`src/lib/zero/mutate/`):

- Use `defineMutator` with Valibot schema
- Call `tx.mutate.<entity>.<action>` directly (insert, update, delete)
- Used for simple, client-allowed mutations (e.g. person CRUD when server mutator delegates)

**Server mutators** (`src/lib/server/api/mutate/`):

- Same names as client mutators
- Call **data functions** in `src/lib/server/api/data/`
- Enforce authorization (e.g. `getOrganizationByIdForAdminOrOwner`, `personReadPermissions`)
- Use `tx.dbTransaction.wrappedTransaction` for Drizzle when inside a Zero transaction

**Mutator registration**:

- Client: `src/lib/zero/mutate/client_mutators.ts` → passed to Zero client
- Server: `src/lib/server/api/mutate/server_mutators.ts` → used by `/api/utils/zero/push`

### Data Functions

- **Location**: `src/lib/server/api/data/`
- **Structure**: One folder per domain (person, organization, event, petition, email, etc.)
- **Responsibilities**:
  - Validate input (Valibot)
  - Check authorization (QueryContext, membership, team access)
  - Perform Drizzle operations
  - Return or throw

**Example – Organization** (`lib/server/api/data/organization/index.ts`):

- `getOrganizationByIdForAdminOrOwner` – requires org in `ctx.adminOrgs` or `ctx.ownerOrgs`
- `_listOrganizationMembershipsByUserIdUnsafe` – used only in trusted server context
- `getOrganization` – checks user membership

### Zero API Endpoints

- **Query**: `POST /api/utils/zero/query` – requires session, builds `QueryContext`, runs `handleQueryRequest`
- **Push**: `POST /api/utils/zero/push` – requires session, runs `handleMutateRequest` with server mutators

### Drizzle-Zero

- **Config**: `src/lib/zero/drizzle-zero.config.ts`
- **Generate**: `npm run generate` → `src/lib/zero/zero-schema.gen.ts`
- **Tables**: Explicit inclusion per table/column; `false` excludes from Zero schema
- **Many-to-many**: Defined in config (e.g. `person.tags`, `person.teams`)

---

## Authentication & Authorization

### better-auth

- **Config**: `src/lib/server/auth.ts` – `buildBetterAuth(locale)`
- **Client**: `src/lib/auth-client.ts` – `createAuthClient` with organization, apiKey, stripe, oneTimeToken
- **Features**:
  - Email/password with verification
  - Google OAuth
  - Organizations (invitations, roles)
  - API keys (secondary storage + DB fallback)
  - Stripe (subscriptions, create customer on signup)
  - One-time tokens (e.g. magic links)

### Hooks (`hooks.server.ts`)

1. **handlebetterAuth**: Fetches session, verifies one-time token from `?authToken`, verifies API key
2. **handleRequest**:
   - Public routes: `/login`, `/signup`, `/logout`, `/api/auth`, `/verify-email`, `/webhooks`, `/api/docs`, `/sentry-example-page`
   - Cron: `/api/cron` – requires `x-api-key` header
   - Page routes: Subdomain-based public pages (no auth required)
   - API v1: `/api/v1/*` – requires valid API key (`authorizedApiOrganization`)
   - All other routes: Require session; redirect to `/signup` if missing

### Authorization Model

1. **Session**: Valid better-auth session for app routes
2. **Organization membership**: User must belong to at least one org; `defaultActiveOrganizationId` from layout
3. **QueryContext**: Drives Zero query filters
   - **authTeams**: Teams user can access (recursive)
   - **adminOrgs / ownerOrgs**: Orgs where user has elevated access
4. **Per-entity permissions**: Each Zero query has a `*Permissions` function (e.g. `personReadPermissions`) that restricts rows by team/org membership

### Roles

- **owner** – Full org control
- **admin** – Admin access
- **member** – Standard access (team-scoped)

---

## Key Conventions

### Svelte 5

- Use `$props()` for component props
- Use `$state`, `$derived`, `$derived.by` for reactivity
- Use `{@render children?.()}` and snippets for composition
- Use `$effect` for side effects

### Forms

- **sveltekit-superforms** with **Valibot** adapter
- Schemas in `src/lib/schema/` (e.g. person, event, survey)
- Use `superValidate` in load/actions

### Zero

- Never use `z` or Zero before app layout has run (Zero is initialized there)
- Use `appState.organizationId`, `appState.userId` for org/user context
- Mutators that need auth checks must run on server (use server mutators)

### Naming

- **Unsafe** suffix: Functions that skip auth (e.g. `_listOrganizationMembershipsByUserIdUnsafe`) – use only in trusted server code
- **Mutator schemas**: `*MutatorSchemaZero`, `*MutatorSchema` in schema files

### Environment

- `DATABASE_URL` – Postgres connection
- `PUBLIC_ZERO_SERVER` – Zero server URL for client
- `PUBLIC_ROOT_DOMAIN` – For CORS, cookies
- Stripe, Google OAuth, etc. per better-auth docs

### Global Operations

Belcoda serves organizations across multiple locales (en, es, pt, etc), so features must work correctly regardless of user location:

- Format dates, numbers, and currency using locale-aware utilities
- CSV imports etc must respect regional conventions (e.g., European CSVs use semicolons as delimiters because commas are used as decimal separators)
- Phone number inputs should be parsed and formatted using a library like `awesome-phonenumber`
- Timezone handling is critical for scheduled events and communications

---

## Quick Reference

| Task                       | Location / Pattern                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------ |
| Add a Zero query           | `lib/zero/query/<entity>/` + register in `query/index.ts`                                  |
| Add a mutator              | Client: `lib/zero/mutate/`, Server: `lib/server/api/mutate/`, Data: `lib/server/api/data/` |
| Add permission logic       | `lib/zero/query/<entity>/permissions.ts`                                                   |
| Add a layout/sidebar       | `(app)/<section>/+layout.svelte` + `UniversalLayout` + sidebar component                   |
| Add a schema field to Zero | Update `drizzle-zero.config.ts` tables, run `npm run generate`                             |
| Add i18n string            | Use Wuchale `t` in Svelte; add to locale files                                             |
