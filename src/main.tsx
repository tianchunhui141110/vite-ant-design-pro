import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntdApp } from 'antd';
import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import { getInitialState } from '@/app';
import { InitialStateProvider, setRouter, useModel } from '@/max';
import { applyUserRoutes, router } from './router';

import './global.less';
import '../tailwind.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

// 让组件外的 history 兼容层拿到 router 实例
setRouter(router);

/**
 * 登录态就绪后注册业务路由 + 菜单。
 * 依赖 currentUser（登录/登出都会变化），幂等执行。
 */
function BootstrapRoutes() {
  const { initialState, loading } = useModel('@@initialState');

  useEffect(() => {
    if (!loading) {
      applyUserRoutes(initialState?.currentUser);
    }
  }, [loading, initialState?.currentUser]);

  return null;
}

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element #root not found');
}
const root = createRoot(rootEl);

root.render(
  <AntdApp>
    <QueryClientProvider client={queryClient}>
      <InitialStateProvider getInitialState={getInitialState}>
        <BootstrapRoutes />
        <RouterProvider router={router} />
      </InitialStateProvider>
    </QueryClientProvider>
  </AntdApp>,
);
