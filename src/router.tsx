import { createBrowserRouter, Navigate } from 'react-router-dom';
import access from '@/access';
import Exception404 from '@/pages/exception/404';
import { useInitialStateStore } from '@/store/initial-state';
import routesConfig from '../config/routes';
import { getAccessibleRouteConfig } from './router/menus';
import {
  toLayoutRoutes,
  toMenuData,
  toStandaloneRoutes,
} from './router/transform';
import type { AppRouteItem } from './router/types';
import Layout from './layout';

/**
 * 路由入口（单一数据源 + 前端/后端双权限模式）。
 *
 * - 数据源：config/routes.ts（前端模式）或后端菜单接口（VITE_ACCESS_MODE=backend）
 * - 初始只注册 /user 登录组与主布局骨架，业务路由在登录后由 applyUserRoutes 动态注册，
 *   保证「菜单」与「路由」来自同一份数据、同一套转换逻辑，不再双份手写。
 */

const routeConfig = routesConfig as AppRouteItem[];

/** 初始路由：/user 登录组 + 主布局骨架（业务路由待登录后注册） */
export const router = createBrowserRouter([
  ...toStandaloneRoutes(routeConfig),
  {
    path: '/',
    id: 'layout',
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/dashboard/analysis" replace /> },
      { path: '*', element: <Exception404 /> },
    ],
  },
]);

/** 是否已注册过业务路由（幂等，避免重复 addRoutes） */
let userRoutesApplied = false;

/**
 * 登录后注册当前用户可访问的业务路由，并同步更新 ProLayout 菜单数据。
 * 由 main.tsx 的 Bootstrap 组件在 currentUser 就绪后触发。
 */
export async function applyUserRoutes(user?: API.CurrentUser) {
  if (!user || userRoutesApplied) return;
  userRoutesApplied = true;

  const config = await getAccessibleRouteConfig(user);
  const accessMap = access({ currentUser: user }) as Record<string, boolean>;
  const routes = toLayoutRoutes(config, accessMap);

  if (routes.length > 0) {
    // 将业务路由动态挂载到主布局（React Router 的私有补丁 API，
    // 第三个参数允许 element 变更）
    router.patchRoutes('layout', routes, true);
    // 重新匹配当前地址（若此前命中了 404 兜底，此处可自愈）
    const { pathname, search, hash } = window.location;
    router.navigate(pathname + search + hash, { replace: true });
  }

  const menuData = toMenuData(config, accessMap);
  useInitialStateStore.getState().setInitialState((s) => ({
    ...s,
    menuData,
  }));
}

export default router;
