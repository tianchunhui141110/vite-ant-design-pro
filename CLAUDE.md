# CLAUDE.md

## Project

React enterprise scaffold based on Vite 8, antd v6, ProComponents v3 (forked from Ant Design Pro).

## Commands

`npm run dev` (dev+mock), `npm run build` (vite), `npm run lint` (Biome+tsc), `npx antd lint ./src` (antd-specific checks).

Other: `npm run simple` (**irreversible** — commit first), `npm run biome` (auto-fix), `npm run tsc` (type-check only).

## Critical Rules

- **`src/services/ant-design-pro/`** — template service code, currently static (the `openapi` regeneration script has been removed)
- **Biome only** — no ESLint, no Prettier. Both `npm run lint` and `npx antd lint ./src` must pass before commit
- **Always `npx antd info <Component>` before writing antd code** — don't guess APIs from memory
- **`npm run simple` is irreversible** — always commit/branch first
- **Conventional commits** required (commitlint enforced)
- **TypeScript strict** · **Node ≥ 22** · **`package-lock.json`** (not yarn/pnpm)
- **Umi migrated to Vite** — never import `@umijs/max`; use the `@/max` compatibility layer (`src/max/`)

## Architecture Essentials

**Config**: `vite.config.mts` (build config), `config/routes.ts` (route source), `src/router.tsx` (react-router config). Route `name` → Chinese menu label; `access` field gates visibility.

**Entry files** (`src/`): `main.tsx` (Provider tree), `app.tsx` (runtime config + `getInitialState`), `router.tsx` (routes), `layout.tsx` (ProLayout), `access.ts` (permissions), `loading.tsx`, `typings.d.ts`.

**Auth**: `getInitialState()` → `GET /api/currentUser`; 401 → redirect login. `access.ts`: `canAdmin = currentUser.access === 'admin'`. Mock creds: `admin`/`ant.design` or `user`/`ant.design`.

**State**: `useModel('@@initialState')` (Zustand store, `src/store/initial-state.ts`) for currentUser/settings. Client state via Zustand (`src/store/`); server state via `@tanstack/react-query`. ProTable `request` prop for most data loading.

**Styling priority**: Tailwind CSS v4 (layout) → antd-style v4 / `createStyles` (theme tokens) → CSS Modules → Less (legacy only).

**Request**: axios wrapper in `src/max/request.ts`, configured in `src/requestErrorConfig.ts` (import from `@/max`). Per-page `service.ts` for non-generated APIs.

**i18n**: removed — the app is Chinese-only. Menu labels and UI text are hardcoded Chinese; no `react-intl`/locale switching.

**Mock**: `mock/` via self-built Vite middleware (`mock/vite-plugin.ts`, dev only), umi-style handlers wrapped with `mock/defineMock.ts`. Page-level mocks (`src/pages/**/_mock.ts`) aggregated in `mock/pages.ts`.


## AI Skills

This project ships with two built-in Claude Code Skills (`.claude/skills/`). Run them directly, no installation is needed.

### `/pro-upgrade` — Project Upgrade

Run `/pro-upgrade` in Claude Code to auto-upgrade the project to the latest Ant Design Pro version. It diffs the latest template against this project and merges framework changes while preserving business code. Works for any version gap (v5→v6, v6.x→latest, etc.).

### `/antd` — Ant Design CLI

Run `/antd` in Claude Code for any antd-related work. It provides access to `@ant-design/cli` with offline metadata for antd v3/v4/v5/v6. Key commands:

- `npx antd info <Component>` — look up props/API before writing code (mandatory)
- `npx antd lint ./src` — check for deprecated or problematic usage (must pass before commit)
- `npx antd demo <Component> <demo>` — get working code examples
- `npx antd migrate <from> <to>` — migration checklist between major versions

## Page Co-location

Each page dir: `index.tsx`, optional `service.ts`, `data.d.ts`, style files. Keep page-specific code with the page.

# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---