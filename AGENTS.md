# AI Agent Instructions for Saisoku

## What this project is

- A small internal tool built with React + Vite frontend and Express + TypeScript backend.
- Uses Prisma with Supabase PostgreSQL for data persistence.
- Supports user registration/login, task management, and a few placeholder tool pages.

## Key directories

- `src/` - React app entrypoint and pages/components.
- `server/` - Express API server and backend logic.
- `dist-server/` - compiled server output after build.
- `prisma/` - Prisma schema and migrations.
- `public/` - static asset files.
- `docs/` - project notes and planning.

## Important files

- `package.json` - available scripts and dependencies.
- `server/index.ts` - backend startup.
- `src/main.tsx` - frontend startup.
- `server/routes/` - Express API endpoints.
- `src/pages/` and `src/components/` - main UI flow.
- `README.md` and `HANDOFF.md` - setup, deployment, and architectural notes.

## Recommended commands

- `npm install`
- `npm run dev`
- `npm run typecheck`
- `npm run build`
- `npm run prisma:generate`
- `npm run prisma:migrate -- --name <migration_name>`
- `npm run prisma:studio`

## What agents should focus on

- Preserve the existing separation of frontend and backend logic.
- Keep auth flow consistent with existing JWT + cookie login implementation.
- For backend changes, update `server/routes/*` and shared server types in `server/types.ts`.
- For frontend changes, use `src/pages/*`, `src/components/*`, and `src/lib/*`.
- Avoid introducing unrelated libraries or frameworks.

## Product requirements and planning docs

Before starting feature work, agents must read the relevant requirement documents under `docs/requirements/`.

Always read the overall policy first:

- `docs/requirements/01_overall_policy.md`

For feature-specific work, also read the corresponding requirement document, for example:

- `docs/requirements/02_preset_feature.md`

The overall policy document is the source of truth for:

- product direction
- MVP scope
- excluded features
- image handling policy
- external reference policy
- Supabase Free constraints
- high-difficulty build sharing requirements

Do not implement features that conflict with `docs/requirements/01_overall_policy.md`.

If a requested implementation seems to conflict with the requirements, stop and summarize the conflict before making changes.

## Notes for AI agents

- The app is built with npm and TypeScript; `typecheck` runs both client and server TS projects.
- `server/index.ts` uses `dotenv`, CORS, cookie parsing, and routes under `/api`.
- Do not commit `.env`.
- Refer to `README.md` and `HANDOFF.md` for deployment, environment variables, and project background.
