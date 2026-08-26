import type { ReactNode } from 'react';

/**
 * 路由配置项（单一数据源）。
 *
 * 所有菜单/路由均来自 config/routes.ts 或后端菜单接口返回的同一结构，
 * 由 src/router/transform.tsx 统一转换成 ProLayout 菜单与 react-router 路由，
 * 避免「手写菜单 + 手写路由」双份维护不一致的问题。
 */
export interface AppRouteItem {
  path?: string;
  name?: string;
  /** 图标：支持 antd 图标名称字符串，或直接传 ReactNode */
  icon?: string | ReactNode;
  /** umi 风格的组件路径，如 './dashboard/analysis'（相对 src/pages） */
  component?: string;
  /** 权限标识（对应 src/access.ts 返回的键），如 'canAdmin' */
  access?: string;
  /** 是否独立于主布局（layout: false 的顶级路由，如 /user 组） */
  layout?: boolean;
  /** 重定向目标路径 */
  redirect?: string;
  routes?: AppRouteItem[];
  [key: string]: unknown;
}

/** 后端菜单接口返回的项（与 AppRouteItem 结构兼容） */
export type MenuRouteItem = AppRouteItem;
