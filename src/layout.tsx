import {
  ProLayout,
  SettingDrawer,
  type Settings as LayoutSettings,
} from '@ant-design/pro-components';
import React, { useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { OfflineBanner } from '@/components';
import Loading from '@/loading';
import { useModel } from '@/max';
import type { LayoutMenuRoute } from '@/router/transform';
import { layout, settingsStorage } from './app';

/**
 * 主布局组件（替代 umi 的 layout 运行时包装）：
 * - useModel('@@initialState') 获取全局初始化状态
 * - 调用 app.tsx 导出的 layout() 运行时配置生成 ProLayout props
 * - 菜单数据来自登录后动态加载（initialState.menuData，与路由同源）
 * - <Outlet /> 渲染子路由
 *
 * 注意：Windows 文件系统大小写不敏感，此文件不能命名为 App.tsx（与 app.tsx 冲突）。
 */
const Layout: React.FC = () => {
  const { initialState, setInitialState, loading } = useModel('@@initialState');
  const location = useLocation();

  // 菜单由登录后的 applyUserRoutes 写入 initialState.menuData，
  // 未加载完成前为空数组（ProLayout 显示空菜单）。
  const route = useMemo(
    () => ({
      path: '/',
      routes: (initialState?.menuData ?? []) as LayoutMenuRoute[],
    }),
    [initialState?.menuData],
  );

  // initialState 加载完成前不渲染布局，避免 onPageChange 在
  // currentUser 尚未就绪时误触发登录重定向（umi 通过 loading 状态规避）
  if (loading) {
    return <Loading />;
  }

  // RunTimeLayoutConfig 返回 any，直接展开为 ProLayout props
  const layoutProps = layout({ initialState, setInitialState });

  return (
    <ProLayout {...layoutProps} route={route} location={location}>
      <OfflineBanner />
      <Outlet />
      <SettingDrawer
        disableUrlParams
        enableDarkTheme
        settings={initialState?.settings}
        onSettingChange={(settings: LayoutSettings) => {
          settingsStorage.set(settings);
          setInitialState((s) => ({
            ...s,
            settings,
          }));
        }}
      />
    </ProLayout>
  );
};

export default Layout;
