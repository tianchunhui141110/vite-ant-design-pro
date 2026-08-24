# Admin Scaffold Cheatsheet

A complete development guide for the admin scaffold (based on Ant Design Pro v6), covering routing, layout, data flow, requests, permissions and more.

## Quick Start

```bash
npm install            # Install dependencies
npm run dev            # Start dev server (port 8000, with Mock)
npm run build          # Build for production into dist/
```

> 💡 Start with full mode to learn the project structure, then switch to simple mode for development.

**Directory structure:**

```
├── config/           # Configuration (routes, proxy, theme)
│   ├── proxy.mts     # Dev proxy config
│   ├── routes.ts     # Route definitions (source for react-router)
│   └── defaultSettings.ts  # Layout & theme settings
├── vite.config.mts   # Vite build config
├── mock/             # Mock data
├── src/
│   ├── components/   # Shared components
│   ├── max/          # umi API compatibility layer (@/max)
│   ├── services/     # API service layer
│   ├── utils/        # Utility functions
│   ├── access.ts     # Permission definitions
│   ├── router.tsx    # react-router configuration
│   ├── layout.tsx    # ProLayout component
│   ├── app.tsx       # Runtime configuration (getInitialState / layout)
│   └── main.tsx      # App entry (Provider tree)
├── docs/             # Project documentation
└── types/            # Type declarations
```

**Common commands:**

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 8000, with Mock) |
| `npm run build` | Build for production |
| `npm run preview` | Preview built output (run `npm run build` first, port 8000) |
| `npm run preview:build` | Build and preview (port 8000) |
| `npm run lint` | Lint (Biome + TypeScript) |
| `npm run biome` | Auto-fix with Biome |
| `npm run tsc` | Type check without emitting |
| `npm run simple` | Strip demo pages and unused deps |

> 💡 `npm run dev` serves Mock data via a self-built Vite mock middleware (`mock/vite-plugin.ts`) registered in `vite.config.mts`.

**Build tool:** This project uses [Vite](https://vite.dev/) as the build tool (`vite.config.mts`). The React plugin `@vitejs/plugin-react` provides JSX transform and Fast Refresh, and `@tailwindcss/vite` provides Tailwind CSS v4 support.

→ See [Vite Docs](https://vite.dev/guide/), [React Router Docs](https://reactrouter.com/)

## Routes & Menu

**Route config** is in `src/router.tsx` (converted from `config/routes.ts`), using `createBrowserRouter` from `react-router-dom`:

```ts
// File: src/router.tsx
createBrowserRouter([
  {
    path: '/welcome',
    name: '欢迎',        // menu label (Chinese)
    icon: 'home',
    element: lazyPage(() => import('./pages/Welcome')),
  },
  {
    path: '/admin',
    name: 'admin',
    icon: 'crown',
    access: 'canAdmin',  // route-level access control (enforced by AccessGuard)
    children: [...],
  },
  { path: '/', redirect: '/dashboard/analysis' },
  { path: '*', element: lazyPage(() => import('./pages/404')) },
]);
```

> 💡 Routes are lazily loaded via `lazyPage()` (`lazy` + `Suspense` + Loading). The `access` field is enforced by `AccessGuard`.

**Route navigation:**

```tsx
import { useNavigate, useParams, useLocation } from 'react-router-dom';

const navigate = useNavigate();
navigate('/dashboard');        // navigate
navigate(-1);                  // go back

const { id } = useParams();   // dynamic param /user/:id
const location = useLocation(); // current route info
```

**Menu & access:** The `access` field in route config controls menu visibility — unauthorized routes won't appear in the menu.

> 💡 The `name` field is the menu label, used directly in Chinese.

→ See [React Router Docs](https://reactrouter.com/)

## Layout

**ProLayout config** is in `config/defaultSettings.ts`:

```ts
// File: config/defaultSettings.ts
export default {
  navTheme: 'light',               // nav theme: light / dark
  colorPrimary: '#1890ff',         // primary color
  layout: 'mix',                   // layout mode: side / top / mix
  contentWidth: 'Fluid',           // content width: Fluid / Fixed
  fixedHeader: false,              // fixed header
  fixSiderbar: true,               // fixed sidebar
  colorWeak: false,                // color weak mode
  title: 'Admin Scaffold',          // site title
  logo: 'https://...',             // logo URL
  iconfontUrl: '',                 // iconfont URL
  token: {},                       // ProLayout token for fine-grained style customization
};
```

**Layout modes:**
- `side` — Side navigation
- `top` — Top navigation
- `mix` — Top + side mixed navigation

**Layout component** is in `src/layout.tsx`, wired via the `layout()` runtime config in `src/app.tsx` (reads `initialState.settings`, binds `onPageChange`, etc.).

**Page container:**

```tsx
import { PageContainer } from '@ant-design/pro-components';

const Page = () => (
  <PageContainer
    header={{ title: 'Page Title' }}
    content="Page description"
  >
    {/* Page content */}
  </PageContainer>
);
```

**Custom areas:** Top-right `src/components/RightContent`, footer `src/components/Footer`.

→ See [ProLayout Docs](https://procomponents.ant.design/components/layout)

## Data Flow

**Global initial state — getInitialState:** Define in `src/app.tsx`, runs once on app startup:

```tsx
// File: src/app.tsx
export async function getInitialState() {
  const currentUser = await fetchUserInfo();
  return { currentUser };
}
```

**Access from components:** Use `useModel` from `@/max` (backed by Zustand, API-compatible with umi):

```tsx
import { useModel } from '@/max';

// Global initial state
const { initialState, setInitialState } = useModel('@@initialState');
```

> 💡 `useModel` only supports `'@@initialState'` (provided by the Zustand store `src/store/initial-state.ts`). For client state use Zustand (`src/store/`); for server state use `@tanstack/react-query`.

**React Query — server state management:**

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Query
const { data, isLoading } = useQuery({
  queryKey: ['user', id],
  queryFn: () => getUser(id),
});

// Mutation
const mutation = useMutation({
  mutationFn: updateUser,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['user'] });
  },
});
```

→ See [React Query Docs](https://tanstack.com/query/latest), [Zustand Docs](https://zustand.docs.pmnd.rs/)

## Request

**Request wrapper** is in `src/max/request.ts` (built on axios), which auto-reads interceptor and error-handling config from `src/requestErrorConfig.ts`:

```ts
// File: src/requestErrorConfig.ts
export const errorConfig = {
  errorThrower: (res) => { /* throw logic */ },
  errorHandler: (error, opts) => { /* unified error notifications */ },
  requestInterceptors: [ /* request interceptors */ ],
  responseInterceptors: [ /* response interceptors */ ],
};
```

**Error handling** is in `src/requestErrorConfig.ts`, customize error code mapping and notification logic.

**Using request:**

```tsx
import { request } from '@/max';

// GET
const data = await request('/api/users', { params: { page: 1 } });

// POST
await request('/api/users', { method: 'POST', data: { name: 'test' } });
```

**OpenAPI code generation:**

```bash
npm run openapi
```

Auto-generates API calling code under `src/services/` based on `config/oneapi.json`.

> 💡 Generated code uses `import { request } from '@/max'` directly — no manual wrapping needed.

## Permissions

**Define permissions** in `src/access.ts`:

```ts
// File: src/access.ts
export default function access(initialState: { currentUser?: API.CurrentUser }) {
  const { currentUser } = initialState;
  return {
    canAdmin: currentUser?.access === 'admin',
    canUser: !!currentUser,
  };
}
```

**Route-level access:** Add `access` field in route config (enforced by `AccessGuard` in `src/router.tsx`):

```ts
{ path: '/admin', access: 'canAdmin' }
```

**Component-level access:**

```tsx
import { Access, useAccess } from '@/max';

// Declarative
<Access accessible={access.canAdmin}>
  <AdminPanel />
</Access>

// Imperative
const access = useAccess();
if (access.canAdmin) { /* ... */ }
```

## Styling

**CSS Modules:** Name files `*.module.less` or `*.module.css`:

```css
/* example.module.less */
.container { padding: 24px; }
.title { font-size: 16px; }
```

```tsx
import styles from './example.module.less';
<div className={styles.container} />
```

**antd-style (CSS-in-JS):**

```tsx
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token, css }) => ({
  card: css`
    background: ${token.colorBgContainer};
    border-radius: ${token.borderRadiusLG}px;
  `,
}));

const { styles } = useStyles();
<div className={styles.card} />
```

**Tailwind CSS (v4):** Use directly in className:

```tsx
<div className="flex items-center gap-4 p-6 rounded-lg bg-white dark:bg-[#141414]" />
```

**Dynamic theme:** Configure antd `ConfigProvider` in `src/main.tsx`:

```tsx
<ConfigProvider
  theme={{
    token: {
      colorPrimary: '#1890ff',
      borderRadius: 6,
    },
  }}
>
  {/* ... */}
</ConfigProvider>
```

Use SettingDrawer in dev mode to switch themes in real-time.

> 💡 Three styling approaches can coexist: Tailwind for layout, CSS Modules for component styles, antd-style when consuming theme tokens.

## Debugging

**Mock data:** Create files in `mock/` (served by the self-built middleware `mock/vite-plugin.ts`, active in dev mode with hot reload; page-level mocks from `src/pages/**/_mock.ts` are aggregated in `mock/pages.ts`):

```ts
// File: mock/user.ts
import { defineMock } from './defineMock';

export default defineMock({
  'GET /api/currentUser': { name: 'Serati Ma', access: 'admin' },
  'POST /api/login': (req, res) => { res.end('ok'); },
});
```

> 💡 `defineMock` converts umi-style mock object format to a unified route format. Handlers can use express-style `res.json()` / `res.send()`; requests get `req.body` / `req.query` injected automatically.

**Proxy config** is in `config/proxy.mts` (disabled in dev mode; active for `pre` / `test` environments):

```ts
// File: config/proxy.mts
export default {
  test: {
    '/api/': {
      target: 'https://pro-api.ant-design-demo.workers.dev',
      changeOrigin: true,
    },
  },
  pre: {
    '/api/': {
      target: 'your pre url',
      changeOrigin: true,
    },
  },
};
```

## FAQ

**Q: How to disable Mock?**
`npm run dev` enables Mock (the mock middleware in `vite.config.mts` is enabled only in dev mode).

**Q: How to change the primary color?**
Edit `colorPrimary` in `config/defaultSettings.ts`. Use SettingDrawer for live preview in dev mode.

**Q: How to add a new page?**
1. Create component in `src/pages/` 2. Add route in `src/router.tsx` (and sync `config/routes.ts`) 3. Set the route `name` as the Chinese menu label

**Q: How to add global state?**
Global initial state comes from `getInitialState` in `src/app.tsx` + `useModel('@@initialState')` (Zustand store). For custom client state, prefer Zustand (`src/store/`); for server state use `@tanstack/react-query`.

**Q: How to deploy?**
`npm run build` generates `dist/`. Deploy to any static file server. Set `base` in `vite.config.mts` for non-root deployments.

**Q: How to use OpenAPI code generation?**
The upstream `npm run openapi` command has been removed. `src/services/ant-design-pro/` is static template code — edit it directly.

## Common Tasks

### Add a New Page

```bash
# 1. Create the page component
#    File: src/pages/my-page/index.tsx

# 2. Register in route config
#    File: src/router.tsx (converted from config/routes.ts)
#    { path: '/my-page', name: 'myPage', icon: 'file', element: lazyPage(() => import('./pages/my-page')) }

# 3. Set route name as the Chinese menu label (e.g. myPage: '我的页面')
```

### Add Global State

```bash
# 1. Create a store with Zustand under src/store/ (see src/store/initial-state.ts)
#    use @tanstack/react-query for server state

# 2. Use in components
#    import { useModel } from '@/max';
#    const { initialState } = useModel('@@initialState');
```

### Add a Mock API

```bash
# Create or edit files under mock/:
# export default defineMock({
#   'GET /api/my-data': { data: [] },
# });
```

### Switch to Simple Mode

```bash
git add -A && git commit -m "chore: save before simple"  # Must commit first
npm run simple                                              # Irreversible
npm install                                                 # Update dependencies
```

## AI Skills (Claude Code)

This project includes two built-in [Claude Code Skills](https://docs.anthropic.com/en/docs/claude-code/skills) (`.claude/skills/`):

### `/pro-upgrade` — Project Upgrade Assistant

Auto-upgrade to the latest Ant Design Pro version. Diffs the latest template against your project and merges framework changes while preserving business code.

```bash
# In Claude Code, just run:
/pro-upgrade
```

What it does:
1. Clones the latest Pro template
2. Classifies framework vs. business files
3. Merges dependency updates, config changes, and code pattern migrations
4. Runs `npx antd lint` to catch antd-specific issues
5. Verifies with `npm run lint && npm run build`

### `/antd` — Ant Design CLI Helper

Query antd component APIs, debug issues, lint for deprecated usage, and assist migrations — all via `@ant-design/cli` with offline bundled metadata.

```bash
# In Claude Code, just run:
/antd
```

Key commands available:
- `npx antd info <Component>` — props, types, version info
- `npx antd demo <Component> <demo>` — working code examples
- `npx antd lint ./src` — check for deprecated/problematic usage
- `npx antd migrate <from> <to>` — migration checklist between versions
- `npx antd doc <Component>` — full component documentation

For other AI assistants (Cursor, etc.), paste the content of `.claude/skills/pro-upgrade/SKILL.md` or `.claude/skills/antd/SKILL.md` into the assistant's context.

## Constraints & Gotchas

- **`src/services/ant-design-pro/`** is scaffold template code (the upstream `npm run openapi` generator was removed); edit it directly.
- **`npm run simple` is irreversible**: It deletes demo pages and unused dependencies. Always commit before running.
- **`@/max` compatibility layer**: `src/max/` provides umi-API equivalents (request / history / useModel / access / router, etc.). Never import umi directly.
- **Biome over ESLint**: This project uses Biome for linting and formatting. Do not install ESLint or Prettier plugins.
- **Commit convention**: Must follow [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat:`, `fix:`, `chore:`).
- **`npx antd lint ./src`**: Must pass with zero errors and warnings before committing.
- **Mock priority**: `mock/` directory for global mocks (registered via the self-built middleware `mock/vite-plugin.ts`, converted with `defineMock`; page-level mocks aggregated in `mock/pages.ts`).
- **Styling priority**: Tailwind (layout) > antd-style (theme tokens) > CSS Modules (component styles) > Less (legacy global styles only).
- **Path aliases**: `@/*` → `./src/*`, `@root/*` → `./*`
