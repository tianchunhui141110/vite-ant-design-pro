import type { MenuDataItem } from '@ant-design/pro-components';
import {
  AppstoreOutlined,
  BarChartOutlined,
  BugOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CreditCardOutlined,
  CrownOutlined,
  DashboardOutlined,
  DesktopOutlined,
  FormOutlined,
  HomeOutlined,
  IdcardOutlined,
  MonitorOutlined,
  OrderedListOutlined,
  ProfileOutlined,
  ProjectOutlined,
  ReadOutlined,
  RobotOutlined,
  SettingOutlined,
  SmileOutlined,
  StopOutlined,
  TableOutlined,
  UnorderedListOutlined,
  UserAddOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { ComponentType, ReactNode } from 'react';
import { lazy, Suspense } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
import Loading from '@/loading';
import { useAccess } from '@/max';
import Exception403 from '@/pages/exception/403';
import type { AppRouteItem } from './types';

/** 路由配置中的 icon 字符串 → antd 图标组件映射 */
const iconMap: Record<string, ReactNode> = {
  home: <HomeOutlined />,
  crown: <CrownOutlined />,
  dashboard: <DashboardOutlined />,
  form: <FormOutlined />,
  table: <TableOutlined />,
  orderedList: <OrderedListOutlined />,
  profile: <ProfileOutlined />,
  read: <ReadOutlined />,
  project: <ProjectOutlined />,
  appstore: <AppstoreOutlined />,
  unorderedList: <UnorderedListOutlined />,
  creditCard: <CreditCardOutlined />,
  idcard: <IdcardOutlined />,
  checkCircle: <CheckCircleOutlined />,
  closeCircle: <CloseCircleOutlined />,
  warning: <WarningOutlined />,
  stop: <StopOutlined />,
  bug: <BugOutlined />,
  user: <UserOutlined />,
  setting: <SettingOutlined />,
  robot: <RobotOutlined />,
  barChart: <BarChartOutlined />,
  monitor: <MonitorOutlined />,
  desktop: <DesktopOutlined />,
  smile: <SmileOutlined />,
  userAdd: <UserAddOutlined />,
};

/** 权限守卫：无权限时渲染 403 */
function AccessGuard({
  access,
  children,
}: {
  access: string;
  children: ReactNode;
}) {
  const accessMap = useAccess() as Record<string, boolean>;
  if (!accessMap[access]) {
    return <Exception403 />;
  }
  return <>{children}</>;
}

/** 页面懒加载包装（Suspense + Loading） */
function lazyPage(factory: () => Promise<{ default: ComponentType }>) {
  const Component = lazy(factory);
  return (
    <Suspense fallback={<Loading />}>
      <Component />
    </Suspense>
  );
}

/** 预扫描所有页面组件，供 component 字符串按路径解析 */
const pageModules = import.meta.glob('/src/pages/**/*.tsx');

/** 解析 umi 风格 component（'./dashboard/analysis'）→ 页面 loader */
function resolvePageLoader(
  component: string,
): (() => Promise<{ default: ComponentType }>) | undefined {
  const base = component.startsWith('./') ? component.slice(2) : component;
  const candidates = [
    `/src/pages/${base}/index.tsx`,
    `/src/pages/${base}.tsx`,
  ];
  for (const candidate of candidates) {
    const loader = pageModules[candidate];
    if (loader) {
      return loader as () => Promise<{ default: ComponentType }>;
    }
  }
  return undefined;
}

/** 当前用户是否拥有该路由的权限 */
export function hasAccess(
  item: AppRouteItem,
  accessMap: Record<string, boolean>,
): boolean {
  return !item.access || Boolean(accessMap[item.access]);
}

/**
 * ProLayout 的 route prop 使用 Route 类型：子菜单承载在 routes 字段。
 * （MenuDataItem 的 routes 被固定为 undefined，子菜单应放 children，勿混用）
 */
export interface LayoutMenuRoute extends Omit<MenuDataItem, 'routes'> {
  routes?: LayoutMenuRoute[];
}

/**
 * 转换成 ProLayout 菜单数据（route.routes）。
 * 过滤掉：layout:false、纯 redirect、通配符、无权限项。
 */
export function toMenuData(
  items: AppRouteItem[],
  accessMap: Record<string, boolean>,
): LayoutMenuRoute[] {
  return items
    .filter(
      (item) =>
        item.layout !== false &&
        !item.redirect &&
        item.path !== '*' &&
        item.path !== '/*' &&
        (item.name || item.path) &&
        hasAccess(item, accessMap),
    )
    .flatMap((item) => {
      const children = item.routes
        ? toMenuData(item.routes, accessMap)
        : [];
      const base: LayoutMenuRoute = {
        path: item.path,
        name: item.name,
        icon:
          typeof item.icon === 'string' ? iconMap[item.icon] : item.icon,
      };
      return children.length > 0
        ? [{ ...base, routes: children }]
        : [base];
    })
    .filter(
      (item) => item.path || (item.routes && item.routes.length > 0),
    );
}

/** 单条配置 → react-router 路由对象（null 表示无意义需跳过） */
function toRouteObject(
  item: AppRouteItem,
  accessMap: Record<string, boolean>,
): RouteObject | null {
  const { path, component, redirect, access, routes } = item;
  if (!path) return null;
  if (path === '*' || path === '/*') return null;

  const children = routes
    ? toRouteObjects(routes, accessMap)
    : [];

  // 纯 redirect（无子路由）
  if (redirect && children.length === 0) {
    return { path, element: <Navigate to={redirect} replace /> };
  }

  // 页面组件
  if (component) {
    const loader = resolvePageLoader(component);
    if (!loader) {
      console.warn(`[router] 找不到页面组件: ${component}，已跳过`);
      return null;
    }
    const element = lazyPage(loader);
    const result: RouteObject = {
      path,
      element: access ? (
        <AccessGuard access={access}>{element}</AccessGuard>
      ) : (
        element
      ),
    };
    // 同时带组件与子路由的布局路由（如 /list/search：布局页内含 Outlet，
    // 子页面在 Outlet 中渲染），子路由必须一并注册，否则会 404
    if (children.length > 0) {
      result.children = children;
    }
    return result;
  }

  // 父级分组（有子路由）：redirect 作为 index 重定向
  if (children.length > 0) {
    const result: RouteObject = { path, children };
    if (redirect) {
      result.children = [
        { index: true, element: <Navigate to={redirect} replace /> },
        ...children,
      ];
    }
    return result;
  }

  return null;
}

/** 一组配置 → react-router 路由数组 */
export function toRouteObjects(
  items: AppRouteItem[],
  accessMap: Record<string, boolean>,
): RouteObject[] {
  return items
    .map((item) => toRouteObject(item, accessMap))
    .filter((route): route is RouteObject => route !== null);
}

/**
 * 转换成可挂载到主布局（layout id='layout'）的子路由。
 * 排除：layout:false（如 /user 组）、根路径 '/';
 * 保留带 access 的路由（由 AccessGuard 运行时兜底 403）。
 */
export function toLayoutRoutes(
  items: AppRouteItem[],
  accessMap: Record<string, boolean>,
): RouteObject[] {
  return toRouteObjects(
    items.filter((item) => item.layout !== false && item.path !== '/'),
    accessMap,
  );
}

/** 转换成独立于主布局的顶级路由（layout: false 组，如 /user） */
export function toStandaloneRoutes(items: AppRouteItem[]): RouteObject[] {
  return toRouteObjects(
    items.filter((item) => item.layout === false),
    {},
  );
}
