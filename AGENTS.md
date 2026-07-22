# AI Agent Instructions for Saisoku

## 1. Purpose and product boundaries

Saisoku is a private GBF crew utility, not a public strategy database. It organizes crew knowledge, builds, goals, event information, and personal tasks while keeping input and operating costs low.

The current application includes:

- cookie-based registration/login
- daily, weekly, and one-time tasks
- material goals and presets
- build presets, posts, search, detail, copy, and screenshots
- GBF character, weapon, summon, job, material, and quest masters
- shared goals, proposals, a Kanban board, and linked resources
- Guild War planning and calculations
- official-news ingestion and event scheduling
- a staged progress-goal foundation

Do not describe the repository as an initial task-only app or as a collection of placeholder pages.

## 2. Source-of-truth order

Before feature work, read documents in this order:

1. `AGENTS.md`
2. `docs/01_overall_policy.md`
3. the feature-specific requirement or implementation document under `docs/`
4. `README.md` and `HANDOFF.md`
5. the current code, Prisma schema, migrations, and recent Git history

For any change to `/progress-goals`, progress preset definitions, staged material calculations, or user progress inventory, `docs/23_progress_preset_feature.md` is the required feature specification and must be read before `docs/preset.md`. Keep behavior decisions in that specification; use `docs/preset.md` for researched material counts and sources.

`docs/01_overall_policy.md` is the product baseline for scope, image handling, external references, and Supabase Free constraints. Later feature documents can refine that baseline, such as allowing a small number of build screenshots, but must not silently discard its intent.

If requirements conflict, stop before changing code and summarize the exact conflict. Do not resolve a material product contradiction by assumption.

## 3. Repository map

- `src/main.tsx`: React entrypoint
- `src/App.tsx`: client routes
- `src/pages/`: route-level screens
- `src/components/`: reusable and feature components
- `src/lib/api.ts`: frontend API types and calls
- `src/lib/`: frontend domain helpers and build-master catalog
- `src/styles.css`: global and feature CSS
- `server/index.ts`: Express startup and route mounting
- `server/routes/`: API endpoints and request validation
- `server/services/`: external I/O such as Storage and official news
- `server/data/`: presets and seed-like application data
- `server/types.ts`: Express and shared server-side types
- `prisma/schema.prisma`: database schema
- `prisma/migrations/`: committed database changes
- `prisma/seed.ts`: database seed entrypoint
- `public/`: checked-in static assets
- `docs/`: product requirements, investigations, and operations notes

Generated `dist/` and `dist-server/` output must not be edited manually.

## 4. Standard workflow

Before editing:

- read the relevant requirements completely
- inspect `git status` and preserve user-owned changes
- inspect both callers and consumers of the code being changed
- for DB-backed features, inspect the Prisma model, migration history, API route, and frontend API type together
- do not read `.env` or `.env.local`; use `.env.example` and source references

During implementation:

- keep changes within the requested feature
- preserve the frontend/backend boundary
- reuse existing patterns before adding abstractions or dependencies
- keep API validation and ownership checks on the server
- keep user-facing messages in Japanese unless the surrounding UI deliberately uses another language
- update relevant documentation when behavior, setup, routes, environment variables, or operations change

After implementation:

- review the diff for unrelated or generated changes
- run `npm run typecheck` for code changes
- run `npm run build` for routing, bundling, configuration, Prisma, or production-facing changes
- perform targeted manual checks for the changed flow when possible
- for UI work, verify responsive behavior as described below
- report validation results and any checks that could not be performed

Documentation-only changes do not require a build unless they modify executable examples or reveal a code mismatch that must be fixed.

## 5. Architecture and TypeScript rules

- Use React function components and hooks already used by the project.
- Route-level data loading and page composition belong in `src/pages/`.
- Reusable UI belongs in `src/components/`; domain helpers belong in `src/lib/`.
- Browser API calls and their response/input types belong in `src/lib/api.ts`.
- Express route validation, authorization, and persistence belong in `server/routes/` or a focused `server/services/` module.
- Do not import server-only code into `src/` or browser-only code into `server/`.
- Keep TypeScript strict. Do not use `any` to bypass a type error unless an external untyped boundary makes it unavoidable and the value is narrowed immediately.
- Prefer small named helpers for repeated parsing and normalization.
- When a page or component becomes difficult to reason about, extract cohesive sections without changing behavior. Avoid unrelated large refactors during feature work.
- Do not introduce a new state library, styling framework, form framework, or UI kit without an explicit requirement.

When changing an API contract:

1. validate and normalize input on the server
2. update the Prisma query and serialization
3. update `src/lib/api.ts` types and methods
4. update all callers
5. verify error, empty, loading, and success states

## 6. Authentication, authorization, and security

Keep the existing JWT + httpOnly Cookie flow unless a security change is explicitly requested.

- Apply `requireAuth` to non-public API routes.
- Do not rely on `ProtectedRoute` as authorization; the server is authoritative.
- For user-owned records, scope reads and mutations by `req.user.id` or perform an explicit ownership check.
- Preserve bcrypt password hashing and avoid logging credentials, cookies, tokens, invite codes, connection strings, or service-role keys.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. Never expose it through a `VITE_*` variable or API response.
- Treat authentication changes, ownership changes, public bucket changes, and registration policy changes as high risk. Explain their impact before implementing them.
- Production must set `INVITE_CODE`; the current server intentionally skips invite validation when it is unset.

Do not read or commit `.env` or `.env.local`. Ask for a redacted value only when non-secret configuration cannot be inferred safely.

## 7. Prisma and data changes

- Update `prisma/schema.prisma` and add a migration for every persistent schema change.
- Use `npm run prisma:migrate -- --name <descriptive_name>` when developing a new schema change.
- Use `npm run prisma:deploy` to apply committed migrations.
- Run `npm run prisma:generate` after schema changes when needed.
- Do not edit an already-applied migration to retrofit a new change.
- Preserve existing rows with defaults, nullable fields, or an explicit backfill strategy.
- Review cascade behavior and indexes for new relations.
- Keep large counts compatible with the existing API representation; Guild War `BigInt` values are serialized as strings.
- Never enable unverified progress preset data. Requirements and in-game values must be confirmed before setting `isAvailable: true`.

Avoid adding data models for excluded features such as damage simulation, automatic optimal-build calculation, or continuous scraping unless the product policy is explicitly revised.

## 8. CSS and visual implementation rules

The project currently uses the single global stylesheet `src/styles.css`. Continue with that approach unless a separate styling migration is explicitly requested.

### Reuse and naming

- Reuse established primitives such as `.page-stack`, `.page-heading`, `.panel`, `.section-heading`, `.primary-button`, `.secondary-button`, `.icon-button`, `.pill`, and `.empty-state` where their semantics fit.
- Shared selectors must remain genuinely reusable. Feature-specific selectors must use a clear prefix such as `.build-*`, `.goal-*`, `.guild-war-*`, or `.official-news-*`.
- Do not add broad element selectors that can unintentionally change unrelated screens.
- Avoid inline styles except for genuinely computed values such as progress width. Put static presentation in CSS.
- Reuse existing colors, radii, borders, and spacing. If a new visual value is repeated across features, define a descriptive custom property in `:root` instead of duplicating magic values.
- Append styles inside the relevant feature section when one exists. Do not place random overrides at the end of the file without explaining the cascade.
- Do not use `!important` unless integrating with an unavoidable external style; document why when used.

### Layout safety

- Grid and flex children containing user content should normally have `min-width: 0`.
- Long Japanese text, URLs, titles, and user-entered values must wrap with `overflow-wrap: anywhere` where needed.
- Images must stay inside their container and preserve aspect ratio.
- Avoid fixed content widths. Prefer `width: 100%`, `max-width`, `minmax()`, `auto-fit`, `auto-fill`, and `clamp()`.
- Page-level accidental horizontal scrolling is not allowed.
- Horizontal scrolling is acceptable only inside an intentional bounded region such as a wide table, Kanban board, tab row, or fixed-slot formation. Make that region visually and structurally clear.
- Do not solve overflow only by applying `overflow-x: hidden` or `clip`; fix the oversized child first.

## 9. Responsive and mobile requirements

Every new screen and every materially changed screen must work on desktop, tablet, and smartphone layouts in the same implementation.

Do not create a second React tree based on user-agent detection. Use semantic markup and responsive CSS so the same content and actions remain available at all widths.

Required verification widths:

- `360px`: common narrow smartphone
- `768px`: tablet / narrow window
- `1280px` or wider: desktop

The application supports a minimum page width of `320px`. New work must not raise that minimum.

Use existing breakpoints where possible:

- around `980px` for shell and major layout changes
- around `680px` for smartphone stacking and compact controls

Feature-specific breakpoints such as `1180px`, `900px`, or `640px` are acceptable when the content requires them, but avoid adding nearly identical breakpoints without need.

For each changed UI, confirm:

- navigation and the primary action remain reachable
- forms become one column when multiple columns no longer fit
- labels, inputs, selects, and textareas do not overflow
- action groups wrap or stack instead of shrinking beyond usability
- touch targets are approximately 44px high/wide for primary interactive controls where practical
- dialogs fit the viewport and allow internal vertical scrolling
- sticky or fixed elements do not hide content
- tables and Kanban columns use contained scrolling or a mobile representation
- hover is not the only way to reveal information or actions
- loading, empty, error, disabled, and long-content states remain readable

When browser tooling is available, inspect the changed route at all required widths. If runtime inspection is blocked by missing DB or environment configuration, still review the responsive CSS and clearly report the limitation.

## 10. Accessibility and interaction

- Use semantic `button`, `a`, `label`, heading, list, and table elements.
- Every form control needs an accessible label.
- Icon-only buttons need an `aria-label` and usually a `title`.
- Keyboard focus must remain visible; do not remove outlines without an equivalent focus style.
- Do not use color alone to communicate status.
- Preserve sensible heading order and DOM order when layouts rearrange.
- Confirm that a nested button/select does not accidentally trigger its clickable parent card.
- Destructive actions require a clear confirmation and must not be the default action.

## 11. Images and external information

- Keep selection-based build registration available even when screenshots are supported.
- Build screenshots are limited to five images per build and 5MB per file; accepted types are JPEG, PNG, and WebP.
- Keep list pages lightweight. Do not render many full-resolution screenshots in lists.
- Store managed images in Saisoku-controlled storage rather than hotlinking external assets.
- Respect Supabase Free storage and egress constraints.
- External sites may be stored as references and crew-authored notes, but do not copy their articles, tables, or images wholesale.
- Continuous scraping is outside the product scope. Official-news retrieval must remain a controlled backend process with error logging.

## 12. Git and file safety

- User-owned modified and untracked files must be preserved.
- Do not discard changes with `git reset --hard`, `git checkout --`, or equivalent commands.
- Do not commit `.env`, generated build output, logs, or local IDE files.
- Do not edit `dist/`, `dist-server/`, or generated Prisma Client files.
- Use non-destructive, targeted commands and keep unrelated formatting out of the diff.
- Existing `.idea/` files are local user state unless the user explicitly asks to manage them.

## 13. Validation matrix

Minimum validation by change type:

| Change | Required checks |
| --- | --- |
| Documentation only | review rendered Markdown and `git diff --check` |
| Frontend TypeScript | `npm run typecheck` and targeted UI flow |
| CSS / layout | `npm run typecheck`, `npm run build`, and 360/768/1280px review |
| Express API | `npm run typecheck`, affected endpoint checks, auth/ownership review |
| Prisma schema | migration review, `npm run prisma:generate`, `npm run typecheck`, `npm run build` |
| Build/deployment config | `npm run build` and startup-path review |

There is currently no general automated test or lint script. Do not claim tests or lint passed unless such tooling is added and run. Prefer adding focused tests when implementing logic with meaningful regression risk, but do not introduce a large test framework as an unrelated change.

## 14. Common commands

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm run prisma:generate
npm run prisma:migrate -- --name <migration_name>
npm run prisma:deploy
npm run prisma:seed
npm run prisma:studio
```

News fetch and reanalysis commands perform external I/O and database writes. Run them only when the requested task includes that operation and the target environment is understood.

## 15. Completion standard

A change is complete only when:

- it satisfies the relevant product requirements
- existing authentication and ownership behavior is preserved
- API, frontend types, and persistence agree
- desktop and mobile use are both handled for UI changes
- relevant validation has passed
- documentation is updated when setup or behavior changed
- known limitations and unperformed checks are reported clearly
