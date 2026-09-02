# Agent Guide

This repository is a frontend-only React workspace for an ERD editor product. The product may later connect to a backend, but this repository must only implement frontend code unless the user explicitly changes that scope.

Do not add backend endpoints, server runtimes, persistence, authentication, or model-provider features unless the user explicitly asks for them and the relevant context documents are updated first.

## Context Reading Order

Before product feature work, read the AI context package in this order:

1. `.agents/context/00-project-brief.md`
2. `.agents/context/01-users-and-scope.md`
3. `.agents/context/02-routes-and-flows.md`
4. `.agents/context/03-domain-models.md`
5. `.agents/context/06-state-management.md`
6. `.agents/context/07-roadmap-and-priorities.md`
7. `.agents/context/08-rules-and-done.md`
8. `.agents/context/09-glossary.md`

Deferred documents are listed in `.agents/context/README.md`. If a context item is marked `TBD`, deferred, or not yet decided, do not invent product behavior. Ask the user or keep the implementation limited to confirmed details.

## Product Scope

- MVP is a single ERD editor screen at `/`.
- MVP data is volatile and is not persisted.
- MVP DDL export targets MySQL only.
- MVP does not include login, signup, my page, server save/load, role-based access, collaboration, legacy DB import, or relationship inference.
- Future backend integration can add login and project save/load, but user roles are not planned to split by developer/DBA.

## Stack

- React 19, Vite, React Compiler, and TypeScript strict mode.
- Tailwind CSS v4 through the Vite plugin.
- TanStack Router for file-based routes.
- TanStack Query for future server state when a backend exists.
- Zustand for shared client-only editor/UI state.
- Zod for client env, imported/generated data, and future API validation.
- Vitest, Testing Library, MSW, and Playwright for feedback.
- Oxlint, ESLint, Prettier, Knip, and boundaries rules for quality gates.

## Architecture

Use an FSD-lite structure: Feature-Sliced Design adapted to this frontend-only ERD editor.

- `src/app`: app composition, providers, router, route files, global styles.
- `src/pages`: route-level screens. MVP should use a single ERD editor page.
- `src/widgets`: large page sections such as ERD canvas, toolbar, inspector, search panel.
- `src/features`: meaningful user actions such as add table, edit column, set key, connect relation, export DDL.
- `src/entities`: ERD domain model, validation, pure rules, and domain-specific UI.
- `src/shared`: reusable UI, config, libs, API infrastructure, and testing helpers.

Dependency direction should flow downward:

```text
app -> pages -> widgets -> features -> entities -> shared
```

Lower layers must not import higher layers. ESLint enforces the broad direction.

## ERD Implementation Rules

- Keep ERD core types, Zod schemas, and pure domain rules under `src/entities/erd/model`.
- Keep ERD-specific small UI, such as table nodes or column rows, under `src/entities/erd/ui` when reused.
- Keep canvas-library adapters under the canvas widget instead of leaking library node/edge types into domain models.
- Implement DDL export as a pure function that receives the ERD model and returns MySQL DDL text.
- Do not add localStorage, IndexedDB, or server persistence for MVP unless the context documents are updated.

## Commands

- `npm.cmd run dev` starts the local app.
- `npm.cmd run routes:generate` refreshes `src/app/routeTree.gen.ts`.
- `npm.cmd run typecheck` checks TypeScript.
- `npm.cmd run lint` runs oxlint and ESLint.
- `npm.cmd run test` runs unit/component tests.
- `npm.cmd run e2e` runs Playwright tests.
- `npm.cmd run knip` checks unused files/dependencies/exports.
- `npm.cmd run check` runs the main pre-merge checks.

## Conventions

- Use `@/` imports for source files.
- Add route files under `src/app/routes` only when a real route is needed.
- Add route-level screens under `src/pages/<page>`.
- Add reusable page blocks under `src/widgets/<widget>`.
- Add user actions under `src/features/<area>/<feature>` when the action becomes large or reused.
- Add domain-specific code under `src/entities/<entity>`; for MVP, prefer `src/entities/erd` over many tiny ERD entity slices.
- Prefer tests near the code changed.
- Validate external/imported/generated data with Zod before trusting it.
- Keep secrets out of this frontend. Vite env vars are client-visible when prefixed with `VITE_`.

## Done Criteria

- Formatting, lint, typecheck, and relevant tests pass.
- Domain rules or DDL export changes include unit tests.
- UI flow changes include component tests or Playwright coverage when practical.
- Documentation stays in sync with `.agents/context` when product scope changes.
