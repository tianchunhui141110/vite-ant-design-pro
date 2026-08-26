import access from '@/access';
import { getUserMenus } from '@/services/ant-design-pro/api';
import routesConfig from '../../config/routes';
import type { AppRouteItem } from './types';

/** 权限来源模式：frontend（本地配置按角色过滤）/ backend（后端接口返回菜单） */
export type AccessMode = 'frontend' | 'backend';

/** 当前权限模式（默认 frontend），由环境变量 VITE_ACCESS_MODE 控制 */
export function getAccessMode(): AccessMode {
  return import.meta.env.VITE_ACCESS_MODE === 'backend' ? 'backend' : 'frontend';
}

/** 前端模式：基于用户信息按 access 过滤本地路由配置 */
function filterByAccessFrontend(
  items: AppRouteItem[],
  user?: API.CurrentUser,
): AppRouteItem[] {
  const accessMap = access({ currentUser: user }) as Record<string, boolean>;
  const filter = (list: AppRouteItem[]): AppRouteItem[] =>
    list
      .filter((item) => !item.access || Boolean(accessMap[item.access]))
      .map((item) =>
        item.routes
          ? { ...item, routes: filter(item.routes) }
          : item,
      )
      .filter((item) => item.path || (item.routes && item.routes.length > 0));

  return filter(items);
}

/**
 * 获取当前用户可访问的路由配置（统一入口）。
 * - backend 模式：调用后端菜单接口，接口已按角色过滤；
 * - frontend 模式：本地 config/routes.ts 按 access 过滤；
 * - 后端接口失败时自动回退到前端过滤，避免整站不可用。
 */
export async function getAccessibleRouteConfig(
  user?: API.CurrentUser,
): Promise<AppRouteItem[]> {
  if (getAccessMode() === 'backend') {
    try {
      const res = await getUserMenus();
      return res.data ?? [];
    } catch (error) {
      console.warn('[menus] 后端菜单获取失败，已回退到前端模式过滤：', error);
    }
  }
  return filterByAccessFrontend(routesConfig as AppRouteItem[], user);
}
