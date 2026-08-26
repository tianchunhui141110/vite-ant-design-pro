import type { ComponentType } from 'react';
import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import Loading from '@/loading';
import { useAccess } from '@/max';
import Exception403 from '@/pages/exception/403';
import Exception404 from '@/pages/exception/404';
import Exception500 from '@/pages/exception/500';
import Layout from './layout';

/**
 * 由 config/routes.ts 转换而来的 react-router 路由配置。
 * - component → React.lazy + Suspense
 * - redirect → <Navigate replace />
 * - access → <AccessGuard>
 * - layout: false 的 /user 组独立于 ProLayout
 */

type AccessMap = Record<string, boolean>;

function AccessGuard({ access }: { access: string }) {
  const accessMap = useAccess() as AccessMap;
  if (!accessMap[access]) {
    return <Exception403 />;
  }
  return <Outlet />;
}

function lazyPage(factory: () => Promise<{ default: ComponentType }>) {
  const Component = lazy(factory);
  return (
    <Suspense fallback={<Loading />}>
      <Component />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  // layout: false —— /user 组不使用 ProLayout
  {
    path: '/user',
    children: [
      { index: true, element: <Navigate to="/user/login" replace /> },
      { path: 'login', element: lazyPage(() => import('@/pages/user/login')) },
      {
        path: 'register-result',
        element: lazyPage(() => import('@/pages/user/register-result')),
      },
      {
        path: 'register',
        element: lazyPage(() => import('@/pages/user/register')),
      },
      { path: '*', element: <Exception404 /> },
    ],
  },
  // 主布局（ProLayout）
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/dashboard/analysis" replace /> },
      { path: 'welcome', element: lazyPage(() => import('@/pages/Welcome')) },
      {
        path: 'admin',
        element: <AccessGuard access="canAdmin" />,
        children: [
          { index: true, element: <Navigate to="/admin/sub-page" replace /> },
          {
            path: 'sub-page',
            element: lazyPage(() => import('@/pages/Admin')),
          },
        ],
      },
      {
        path: 'dashboard',
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard/analysis" replace />,
          },
          {
            path: 'analysis',
            element: lazyPage(() => import('@/pages/dashboard/analysis')),
          },
          {
            path: 'monitor',
            element: lazyPage(() => import('@/pages/dashboard/monitor')),
          },
          {
            path: 'workplace',
            element: lazyPage(() => import('@/pages/dashboard/workplace')),
          },
        ],
      },
      {
        path: 'form',
        children: [
          { index: true, element: <Navigate to="/form/basic-form" replace /> },
          {
            path: 'basic-form',
            element: lazyPage(() => import('@/pages/form/basic-form')),
          },
          {
            path: 'step-form',
            element: lazyPage(() => import('@/pages/form/step-form')),
          },
          {
            path: 'advanced-form',
            element: lazyPage(() => import('@/pages/form/advanced-form')),
          },
        ],
      },
      {
        path: 'list',
        children: [
          {
            path: 'search',
            element: lazyPage(() => import('@/pages/list/search')),
            children: [
              {
                index: true,
                element: <Navigate to="/list/search/articles" replace />,
              },
              {
                path: 'articles',
                element: lazyPage(() => import('@/pages/list/search/articles')),
              },
              {
                path: 'projects',
                element: lazyPage(() => import('@/pages/list/search/projects')),
              },
              {
                path: 'applications',
                element: lazyPage(
                  () => import('@/pages/list/search/applications'),
                ),
              },
            ],
          },
          { index: true, element: <Navigate to="/list/table-list" replace /> },
          {
            path: 'table-list',
            element: lazyPage(() => import('@/pages/table-list')),
          },
          {
            path: 'basic-list',
            element: lazyPage(() => import('@/pages/list/basic-list')),
          },
          {
            path: 'card-list',
            element: lazyPage(() => import('@/pages/list/card-list')),
          },
        ],
      },
      {
        path: 'profile',
        children: [
          { index: true, element: <Navigate to="/profile/basic" replace /> },
          {
            path: 'basic',
            element: lazyPage(() => import('@/pages/profile/basic')),
          },
          {
            path: 'advanced',
            element: lazyPage(() => import('@/pages/profile/advanced')),
          },
        ],
      },
      {
        path: 'result',
        children: [
          { index: true, element: <Navigate to="/result/success" replace /> },
          {
            path: 'success',
            element: lazyPage(() => import('@/pages/result/success')),
          },
          {
            path: 'fail',
            element: lazyPage(() => import('@/pages/result/fail')),
          },
        ],
      },
      {
        path: 'exception',
        children: [
          { index: true, element: <Navigate to="/exception/403" replace /> },
          { path: '403', element: <Exception403 /> },
          { path: '404', element: <Exception404 /> },
          { path: '500', element: <Exception500 /> },
        ],
      },
      {
        path: 'account',
        children: [
          { index: true, element: <Navigate to="/account/center" replace /> },
          {
            path: 'center',
            element: lazyPage(() => import('@/pages/account/center')),
          },
          {
            path: 'settings',
            element: lazyPage(() => import('@/pages/account/settings')),
          },
        ],
      },
      { path: '*', element: <Exception404 /> },
    ],
  },
]);
