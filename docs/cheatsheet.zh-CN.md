# 中台前端脚手架速查手册

基于 Ant Design Pro v6 改造的中台脚手架完整开发指南，覆盖路由、布局、数据流、请求、权限等核心功能。

## 快速开始

```bash
npm install            # 安装依赖
npm run dev            # 启动开发服务器（端口 8000，带 Mock）
npm run build          # 构建生产产物到 dist/
```

> 💡 建议先用完整模式熟悉项目结构，再切换精简模式开始开发。

**目录结构：**

```
├── config/           # 配置文件（路由、代理、主题）
│   ├── proxy.mts     # 开发代理配置
│   ├── routes.ts     # 路由配置（react-router 的配置源）
│   └── defaultSettings.ts  # 布局主题设置
├── vite.config.mts   # Vite 构建配置
├── mock/             # Mock 数据
├── src/
│   ├── components/   # 公共组件
│   ├── max/          # umi API 兼容层（@/max）
│   ├── services/     # API 服务层
│   ├── utils/        # 工具函数
│   ├── access.ts     # 权限定义
│   ├── router.tsx    # react-router 路由配置
│   ├── layout.tsx    # ProLayout 布局组件
│   ├── app.tsx       # 运行时配置（getInitialState / layout）
│   └── main.tsx      # 应用入口（Provider 树）
├── docs/             # 项目文档
└── types/            # 类型声明
```

**常用命令：**

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（端口 8000，带 Mock） |
| `npm run build` | 构建生产产物 |
| `npm run preview` | 预览已构建产物（需先 `npm run build`，端口 8000） |
| `npm run preview:build` | 构建并本地预览（端口 8000） |
| `npm run lint` | 代码检查（Biome + TypeScript） |
| `npm run biome` | Biome 自动修复 |
| `npm run tsc` | 类型检查（不生成文件） |
| `npm run simple` | 精简模式（删除示例页面和多余依赖） |

> 💡 `npm run dev` 启动时通过 `vite.config.mts` 注册的自研 mock 中间件（`mock/vite-plugin.ts`）提供 Mock 数据。

**构建工具：** 本项目使用 [Vite](https://vite.dev/) 作为构建工具（`vite.config.mts`），React 插件 `@vitejs/plugin-react` 提供 JSX 转换和 Fast Refresh，`@tailwindcss/vite` 提供 Tailwind CSS v4 支持。

→ 更多内容见 [Vite 文档](https://vite.dev/guide/)、[React Router 文档](https://reactrouter.com/)

## 路由与菜单

**路由配置** 位于 `src/router.tsx`（基于 `config/routes.ts` 转换而来），使用 `react-router-dom` 的 `createBrowserRouter`：

```ts
// File: src/router.tsx
createBrowserRouter([
  {
    path: '/welcome',
    name: '欢迎',        // 菜单显示名称（中文）
    icon: 'home',
    element: lazyPage(() => import('./pages/Welcome')),
  },
  {
    path: '/admin',
    name: 'admin',
    icon: 'crown',
    access: 'canAdmin',  // 路由级权限控制（由 AccessGuard 校验）
    children: [...],
  },
  { path: '/', redirect: '/dashboard/analysis' },
  { path: '*', element: lazyPage(() => import('./pages/404')) },
]);
```

> 💡 路由懒加载通过 `lazyPage()` 包装（`lazy` + `Suspense` + Loading），`access` 字段由 `AccessGuard` 校验。

**路由导航：**

```tsx
import { useNavigate, useParams, useLocation } from 'react-router-dom';

const navigate = useNavigate();
navigate('/dashboard');        // 跳转
navigate(-1);                  // 后退

const { id } = useParams();   // 获取动态参数 /user/:id
const location = useLocation(); // 当前路由信息
```

**菜单与权限联动：** 路由配置中 `access` 字段控制菜单可见性，未授权路由不会出现在菜单中。

> 💡 `name` 字段为菜单显示名称，直接使用中文。

→ 更多内容见 [React Router 文档](https://reactrouter.com/)

## 布局

**ProLayout 配置** 位于 `config/defaultSettings.ts`：

```ts
// File: config/defaultSettings.ts
export default {
  navTheme: 'light',               // 导航主题：light / dark
  colorPrimary: '#1890ff',         // 主题色
  layout: 'mix',                   // 布局模式：side / top / mix
  contentWidth: 'Fluid',           // 内容宽度：Fluid / Fixed
  fixedHeader: false,              // 固定顶部导航
  fixSiderbar: true,               // 固定侧边栏
  colorWeak: false,                // 色弱模式
  title: '中台前端脚手架',          // 站点标题
  logo: 'https://...',             // Logo URL
  iconfontUrl: '',                 // 图标字体 URL
  token: {},                       // ProLayout token，用于细粒度样式定制
};
```

**布局模式：**
- `side` — 左侧导航
- `top` — 顶部导航
- `mix` — 顶部 + 侧边混合导航

**布局组件** 位于 `src/layout.tsx`，通过 `src/app.tsx` 的 `layout()` 运行时配置生效（读取 `initialState.settings`、绑定 `onPageChange` 等）。

**页面容器：**

```tsx
import { PageContainer } from '@ant-design/pro-components';

const Page = () => (
  <PageContainer
    header={{ title: '页面标题' }}
    content="页面描述"
  >
    {/* 页面内容 */}
  </PageContainer>
);
```

**自定义区域：** 右上角 `src/components/RightContent`，底部 `src/components/Footer`。

→ 更多内容见 [ProLayout 文档](https://procomponents.ant.design/components/layout)

## 数据流

**全局初始化状态 — getInitialState：** 在 `src/app.tsx` 中定义，应用启动时执行一次：

```tsx
// File: src/app.tsx
export async function getInitialState() {
  const currentUser = await fetchUserInfo();
  return { currentUser };
}
```

**组件中访问：** 通过 `@/max` 的 `useModel`（内部基于 Zustand，兼容 umi 的 `useModel` API）：

```tsx
import { useModel } from '@/max';

// 全局初始化状态
const { initialState, setInitialState } = useModel('@@initialState');
```

> 💡 `useModel` 仅支持 `'@@initialState'`（由 Zustand store `src/store/initial-state.ts` 提供）。客户端状态建议用 Zustand（`src/store/`），服务端状态用 `@tanstack/react-query`。

**React Query — 服务端状态管理：**

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// 查询
const { data, isLoading } = useQuery({
  queryKey: ['user', id],
  queryFn: () => getUser(id),
});

// 变更
const mutation = useMutation({
  mutationFn: updateUser,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['user'] });
  },
});
```

→ 更多内容见 [React Query 文档](https://tanstack.com/query/latest)、[Zustand 文档](https://zustand.docs.pmnd.rs/)

## 请求

**请求封装** 位于 `src/max/request.ts`（基于 axios），自动读取 `src/requestErrorConfig.ts` 中的拦截器与错误处理配置：

```ts
// File: src/requestErrorConfig.ts
export const errorConfig = {
  errorThrower: (res) => { /* 抛错逻辑 */ },
  errorHandler: (error, opts) => { /* 统一错误提示 */ },
  requestInterceptors: [ /* 请求拦截器 */ ],
  responseInterceptors: [ /* 响应拦截器 */ ],
};
```

**错误处理** 位于 `src/requestErrorConfig.ts`，可自定义错误码映射和提示逻辑。

**使用请求：**

```tsx
import { request } from '@/max';

// GET
const data = await request('/api/users', { params: { page: 1 } });

// POST
await request('/api/users', { method: 'POST', data: { name: 'test' } });
```

**OpenAPI 代码生成：**

```bash
npm run openapi
```

根据 `config/oneapi.json` 自动生成 `src/services/` 下的 API 调用代码。

> 💡 生成后的代码直接用 `import { request } from '@/max'` 发起请求，无需手动封装。

## 权限

**定义权限** 在 `src/access.ts`：

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

**路由级权限：** 在路由配置中添加 `access` 字段（由 `src/router.tsx` 的 `AccessGuard` 校验）：

```ts
{ path: '/admin', access: 'canAdmin' }
```

**组件级权限：**

```tsx
import { Access, useAccess } from '@/max';

// 声明式
<Access accessible={access.canAdmin}>
  <AdminPanel />
</Access>

// 命令式
const access = useAccess();
if (access.canAdmin) { /* ... */ }
```

## 样式

**CSS Modules：** 文件命名为 `*.module.less` 或 `*.module.css`：

```css
/* example.module.less */
.container { padding: 24px; }
.title { font-size: 16px; }
```

```tsx
import styles from './example.module.less';
<div className={styles.container} />
```

**antd-style（CSS-in-JS）：**

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

**Tailwind CSS（v4）：** 直接在 className 中使用：

```tsx
<div className="flex items-center gap-4 p-6 rounded-lg bg-white dark:bg-[#141414]" />
```

**动态主题：** 在 `src/main.tsx` 中通过 antd 的 `ConfigProvider` 配置：

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

开发环境可通过右下角 SettingDrawer 实时切换主题。

> 💡 三种样式方案可以共存：Tailwind 适合布局、CSS Modules 适合组件样式、antd-style 适合需要消费主题 token 的场景。

## 调试

**Mock 数据：** 在 `mock/` 目录下创建文件（通过自研 mock 中间件 `mock/vite-plugin.ts` 提供，dev 模式生效，支持热重载；页面级 mock 由 `mock/pages.ts` 聚合 `src/pages/**/_mock.ts`）：

```ts
// File: mock/user.ts
import { defineMock } from './defineMock';

export default defineMock({
  'GET /api/currentUser': { name: 'Serati Ma', access: 'admin' },
  'POST /api/login': (req, res) => { res.end('ok'); },
});
```

> 💡 `defineMock` 将 umi 风格的 mock 对象格式转换为统一路由格式，handler 仍可使用 express 风格的 `res.json()` / `res.send()`；请求自动注入 `req.body` / `req.query`。

**代理配置** 位于 `config/proxy.mts`（dev 模式下未启用，仅 `pre` / `test` 环境生效）：

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

**Q: 如何关闭 Mock？**
`npm run dev` 会启用 Mock（`vite.config.mts` 中的 mock 中间件仅在 dev 模式开启）。

**Q: 如何修改主题色？**
修改 `config/defaultSettings.ts` 的 `colorPrimary`，开发时可用 SettingDrawer 实时调整。

**Q: 如何添加新页面？**
1. 在 `src/pages/` 下创建组件 2. 在 `src/router.tsx` 添加路由（并同步 `config/routes.ts`） 3. 路由 `name` 设为中文菜单名称

**Q: 如何添加全局状态？**
全局初始化状态通过 `src/app.tsx` 的 `getInitialState` + `useModel('@@initialState')`（Zustand store）。自定义客户端状态建议用 Zustand（`src/store/`），服务端状态用 `@tanstack/react-query`。

**Q: 如何部署？**
`npm run build` 生成 `dist/` 目录，部署到任意静态服务器。`vite.config.mts` 中的 `base` 配置处理非根目录部署。

**Q: 如何使用 OpenAPI 代码生成？**
上游的 `npm run openapi` 代码生成命令已移除。`src/services/ant-design-pro/` 为脚手架自带的静态模板代码，可直接修改。

## 常见任务

### 添加新页面

```bash
# 1. 创建页面组件
#    文件路径：src/pages/my-page/index.tsx

# 2. 在路由配置中注册
#    文件路径：src/router.tsx（由 config/routes.ts 转换）
#    { path: '/my-page', name: 'myPage', icon: 'file', element: lazyPage(() => import('./pages/my-page')) }

# 3. 在路由配置中设置 name 为中文菜单名称（如 myPage: '我的页面'）
```

### 添加全局状态

```bash
# 1. 在 src/store/ 下用 Zustand 创建 store（参考 src/store/initial-state.ts）
#    服务端状态使用 @tanstack/react-query

# 2. 在组件中使用
#    import { useModel } from '@/max';
#    const { initialState } = useModel('@@initialState');
```

### 添加 Mock 接口

```bash
# 在 mock/ 目录下创建或修改文件：
# export default defineMock({
#   'GET /api/my-data': { data: [] },
# });
```

### 切换到精简模式

```bash
git add -A && git commit -m "chore: save before simple"  # 必须先提交
npm run simple                                              # 不可逆操作
npm install                                                 # 更新依赖
```

## AI Skills（Claude Code）

本项目内置两个 [Claude Code Skills](https://docs.anthropic.com/en/docs/claude-code/skills)（位于 `.claude/skills/`）：

### `/pro-upgrade` — 项目升级助手

自动升级到最新 Ant Design Pro 版本。对比最新模板差异，合并框架变更并保留业务代码。

```bash
# 在 Claude Code 中直接运行：
/pro-upgrade
```

执行流程：
1. 克隆最新 Pro 模板
2. 将文件分类为框架文件和业务文件
3. 合并依赖更新、配置变更和代码模式迁移
4. 运行 `npx antd lint` 检查 antd 相关问题
5. 通过 `npm run lint && npm run build` 验证

### `/antd` — Ant Design CLI 助手

查询 antd 组件 API、调试问题、检查废弃用法、辅助版本迁移 — 基于 `@ant-design/cli`，离线元数据，无需网络。

```bash
# 在 Claude Code 中直接运行：
/antd
```

常用命令：
- `npx antd info <Component>` — props、类型、版本信息
- `npx antd demo <Component> <demo>` — 可运行的代码示例
- `npx antd lint ./src` — 检查废弃或有问题的用法
- `npx antd migrate <from> <to>` — 版本迁移清单
- `npx antd doc <Component>` — 完整组件文档

如使用其他 AI 助手（Cursor 等），可将 `.claude/skills/pro-upgrade/SKILL.md` 或 `.claude/skills/antd/SKILL.md` 的内容提供给它。

## 注意事项

- **`src/services/ant-design-pro/`** 为脚手架模板代码（上游 `npm run openapi` 代码生成命令已移除），可直接修改
- **`npm run simple` 不可逆**：会删除示例页面和多余依赖，执行前务必提交代码
- **`@/max` 兼容层**：`src/max/` 提供 umi API 的等价实现（request / history / useModel / access / router 等），不要直接引入 umi
- **Biome 代替 ESLint**：项目使用 Biome 进行 lint 和格式化，不要安装 ESLint 或 Prettier 插件
- **Commit 规范**：必须遵循 [Conventional Commits](https://www.conventionalcommits.org/)，如 `feat:`, `fix:`, `chore:` 等
- **`npx antd lint ./src`**：提交前必须零错误零警告
- **Mock 优先级**：`mock/` 目录为全局 Mock（由自研中间件 `mock/vite-plugin.ts` 注册，需使用 `defineMock` 转换格式；页面级 mock 在 `mock/pages.ts` 聚合）
- **样式优先级**：Tailwind（布局）> antd-style（主题 token）> CSS Modules（组件样式）> Less（仅遗留全局样式）
- **路径别名**：`@/*` → `./src/*`，`@root/*` → `./*`
