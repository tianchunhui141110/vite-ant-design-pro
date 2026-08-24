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
import {
  ProLayout,
  SettingDrawer,
  type Settings as LayoutSettings,
} from '@ant-design/pro-components';
import React, { useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { OfflineBanner } from '@/components';
import Loading from '@/loading';
import { useAccess, useModel } from '@/max';
import routes from '../config/routes';
import { layout, SETTINGS_STORAGE_KEY } from './app';

/**
 * 主布局组件（替代 umi 的 layout 运行时包装）：
 * - useModel('@@initialState') 获取全局初始化状态
 * - 调用 app.tsx 导出的 layout() 运行时配置生成 ProLayout props
 * - <Outlet /> 渲染子路由
 *
 * 注意：Windows 文件系统大小写不敏感，此文件不能命名为 App.tsx（与 app.tsx 冲突）。
 */

type RouteItem = {
  path?: string;
  name?: string;
  icon?: string | React.ReactNode;
  access?: string;
  layout?: boolean;
  redirect?: string;
  routes?: RouteItem[];
  [key: string]: unknown;
};

/** umi 路由 icon 字符串 → antd 图标组件映射 */
const iconMap: Record<string, React.ReactNode> = {
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

/**
 * 过滤路由配置，移除 layout:false、redirect、通配符路由，
 * 并根据 access 权限过滤不可访问的路由。
 */
function filterRoutes(
  items: RouteItem[],
  accessMap: Record<string, boolean>,
): RouteItem[] {
  return items
    .filter((item) => {
      // 排除 layout: false 的路由（如 /user 组）
      if (item.layout === false) return false;
      // 排除纯 redirect 路由
      if (item.redirect) return false;
      // 排除通配符路由
      if (item.path === '/*' || item.path === '*') return false;
      // 排除无 name 且无 path 的无效项
      if (!item.name && !item.path) return false;
      // access 权限过滤
      if (item.access && !accessMap[item.access]) return false;
      return true;
    })
    .map((item) => {
      const filtered: RouteItem = { ...item };
      // umi 的字符串 icon 需转换为 antd 图标组件
      if (typeof item.icon === 'string' && iconMap[item.icon]) {
        filtered.icon = iconMap[item.icon];
      }
      if (item.routes) {
        filtered.routes = filterRoutes(item.routes, accessMap);
      }
      return filtered;
    });
}

const Layout: React.FC = () => {
  const { initialState, setInitialState, loading } = useModel('@@initialState');
  const access = useAccess() as Record<string, boolean>;
  const location = useLocation();

  // 将 config/routes.ts 转换为 ProLayout 的 route prop
  const route = useMemo(() => {
    const filtered = filterRoutes(routes as RouteItem[], access);
    return { path: '/', routes: filtered };
  }, [access]);

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
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
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
