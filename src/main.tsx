import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntdApp } from 'antd';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import { getInitialState } from '@/app';
import { InitialStateProvider, setRouter } from '@/max';
import { router } from './router';

import './global.less';
import '../tailwind.css';

const queryClient = new QueryClient();

// 让组件外的 history 兼容层拿到 router 实例
setRouter(router);

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element #root not found');
}
const root = createRoot(rootEl);

root.render(
  <AntdApp>
    <QueryClientProvider client={queryClient}>
      <InitialStateProvider getInitialState={getInitialState}>
        <RouterProvider router={router} />
      </InitialStateProvider>
    </QueryClientProvider>
  </AntdApp>,
);
