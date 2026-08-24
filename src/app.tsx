import {LinkOutlined} from '@ant-design/icons';
import type {MenuDataItem, Settings as LayoutSettings,} from '@ant-design/pro-components';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import React from 'react';
import {AvatarDropdown, DocLink, ErrorBoundary, Footer} from '@/components';
import { history, Link, type RunTimeLayoutConfig } from '@/max';
import {currentUser as queryCurrentUser} from '@/services/ant-design-pro/api';
import defaultSettings from '../config/defaultSettings';

// Initialize dayjs plugins globally
dayjs.extend(relativeTime);

const isDev = import.meta.env.DEV;
const loginPath = '/user/login';

/** 主题设置在 localStorage 中的存储 key（配合 SettingDrawer 持久化） */
export const SETTINGS_STORAGE_KEY = 'pro-layout-settings';

/**
 * 全局初始化数据（原 umi getInitialState），由 InitialStateProvider 加载。
 */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
}> {
  const fetchUserInfo = async () => {
    try {
      const msg = await queryCurrentUser({
        skipErrorHandler: true,
      });
      return msg.data;
    } catch (_error) {
      const {pathname, search, hash} = history.location;
      history.replace(
        `${loginPath}?redirect=${encodeURIComponent(pathname + search + hash)}`,
      );
    }
    return undefined;
  };
  // 恢复上次保存的主题设置（SettingDrawer 修改后写入 localStorage）
  let savedSettings: Partial<LayoutSettings> = {};
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) savedSettings = JSON.parse(raw) as Partial<LayoutSettings>;
  } catch {
    savedSettings = {};
  }
  const settings = {
    ...defaultSettings,
    ...savedSettings,
  } as Partial<LayoutSettings>;

  // 如果不是登录页面，执行
  const {location} = history;
  if (
    ![loginPath, '/user/register', '/user/register-result'].includes(
      location.pathname,
    )
  ) {
    const currentUser = await fetchUserInfo();
    return {
      fetchUserInfo,
      currentUser,
      settings,
    };
  }
  return {
    fetchUserInfo,
    settings,
  };
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({
                                              initialState,
                                            }) => {
  return {
    // 路由名称已改为中文，无需菜单国际化
    menu: {locale: false},
    menuItemRender: (item: MenuDataItem, dom: React.ReactNode) => {
      if (item.path) {
        return (
          <Link to={item.path} prefetch>
            {dom}
          </Link>
        );
      }
      return dom;
    },
    actionsRender: () => {
      return [
        <DocLink key="doc"/>,
      ];
    },
    avatarProps: {
      src: initialState?.currentUser?.avatar,
      title: 'ProUser',
      render: (_: React.ReactNode, avatarChildren: React.ReactNode) => (
        <AvatarDropdown>{avatarChildren}</AvatarDropdown>
      ),
    },
    footerRender: () => <Footer/>,
    onPageChange: () => {
      const {location} = history;
      // 如果没有登录，重定向到 login
      if (!initialState?.currentUser && location.pathname !== loginPath) {
        history.replace(
          `${loginPath}?redirect=${encodeURIComponent(location.pathname + location.search + location.hash)}`,
        );
      }
    },
    bgLayoutImgList: [
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/D2LWSqNny4sAAAAAAAAAAAAAFl94AQBr',
        left: 85,
        bottom: 100,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/C2TWRpJpiC0AAAAAAAAAAAAAFl94AQBr',
        bottom: -68,
        right: -45,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/F6vSTbj8KpYAAAAAAAAAAAAAFl94AQBr',
        bottom: 0,
        left: 0,
        width: '331px',
      },
    ],
    links: isDev
      ? [
        <Link
          key="openapi"
          to="https://pro.ant.design/docs/openapi"
          target="_blank"
        >
          <LinkOutlined/>
          <span>OpenAPI 文档</span>
        </Link>,
      ]
      : [],
    // 自定义 ErrorBoundary：chunk 加载错误时显示友好提示
    ErrorBoundary,
    menuHeaderRender: undefined,
    ...(initialState?.settings as Record<string, unknown>),
  };
};
