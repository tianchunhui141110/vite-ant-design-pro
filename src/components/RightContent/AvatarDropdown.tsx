import {
  DownOutlined,
  LogoutOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  SkinOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type {Settings as LayoutSettings} from '@ant-design/pro-components';
import type {MenuProps} from 'antd';
import {Avatar, Spin} from 'antd';
import {createStyles} from 'antd-style';
import React, {startTransition} from 'react';
import {settingsStorage} from '@/app';
import {history, useModel} from '@/max';
import {outLogin} from '@/services/ant-design-pro/api';
import HeaderDropdown from '../HeaderDropdown';

type GlobalHeaderRightProps = {
  children?: React.ReactNode;
};

/** 设计稿阴影（仅亮色主题使用）；暗色主题改用 antd 的 boxShadowSecondary 保证阴影可见 */
const LIGHT_PANEL_SHADOW = '0 24px 48px -12px rgba(15, 23, 42, 0.18)';

/**
 * 样式全部基于 antd 主题 token，面板背景/文字/边框/hover 等会跟随
 * 亮色与暗色主题自动切换（isDarkMode 仅用于区分阴影）。
 */
const useStyles = createStyles(({token, isDarkMode}) => ({
  trigger: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'background-color 150ms ease-out',
    '&:hover': {backgroundColor: token.colorBgTextHover},
  },
  triggerName: {
    maxWidth: 120,
    fontSize: 14,
    fontWeight: 500,
    color: token.colorText,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    '@media (max-width: 640px)': {display: 'none'},
  },
  chevron: {
    fontSize: 14,
    color: token.colorTextSecondary,
  },
  panel: {
    '&&': {
      minWidth: 240,
      padding: 6,
      borderRadius: 12,
      background: token.colorBgElevated,
      border: `1px solid ${token.colorBorderSecondary}`,
      boxShadow: isDarkMode ? token.boxShadowSecondary : LIGHT_PANEL_SHADOW,
      display: 'flex',
      flexDirection: 'column',
    },
    '&& .ant-dropdown-menu': {
      padding: 0,
      border: 'none',
      boxShadow: 'none',
      background: 'transparent',
      minWidth: 'auto',
    },
    '&& .ant-dropdown-menu-item': {
      borderRadius: 6,
      padding: '10px 12px',
      fontSize: 14,
      color: token.colorText,
      '&:hover': {backgroundColor: token.colorBgTextHover},
    },
    '&& .ant-dropdown-menu-item-icon': {
      marginInlineEnd: 12,
      fontSize: 18,
      color: token.colorTextSecondary,
    },
    '&& .ant-dropdown-menu-item-disabled': {
      color: token.colorTextDisabled,
      cursor: 'not-allowed',
      '&:hover': {backgroundColor: 'transparent'},
      '.ant-dropdown-menu-item-icon': {color: token.colorTextDisabled},
    },
    '&& .ant-dropdown-menu-item-danger': {
      color: token.colorError,
      '&:hover': {backgroundColor: token.colorErrorBg},
      '.ant-dropdown-menu-item-icon': {color: token.colorError},
    },
    '&& .ant-dropdown-menu-item-divider': {
      margin: '4px 0',
      backgroundColor: token.colorBorderSecondary,
    },
  },
  divider: {
    height: 1,
    margin: '4px 0',
    backgroundColor: token.colorBorderSecondary,
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  userInfo: {
    minWidth: 0,
    flex: 1,
  },
  userName: {
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
    color: token.colorText,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userMeta: {
    margin: 0,
    fontSize: 12,
    lineHeight: '16px',
    color: token.colorTextSecondary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
}));

const getInitials = (name?: string): string => {
  const trimmed = name?.trim() ?? '';
  if (!trimmed) return '';
  const parts = trimmed.split(/\s+/);
  if (parts.length > 1) {
    return parts
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }
  return Array.from(trimmed).slice(0, 2).join('').toUpperCase();
};

const loginOut = async () => {
  try {
    await outLogin();
  } catch {
    // Local logout has already cleared user state; redirect should still proceed.
  }
  const {search, pathname} = window.location;
  const urlParams = new URL(window.location.href).searchParams;
  const searchParams = new URLSearchParams({
    redirect: pathname + search,
  });
  const redirect = urlParams.get('redirect');
  if (window.location.pathname !== '/user/login' && !redirect) {
    history.replace({
      pathname: '/user/login',
      search: searchParams.toString(),
    });
  }
};

const UserInfoCard: React.FC<{ currentUser: API.CurrentUser }> = ({
                                                                    currentUser,
                                                                  }) => {
  const {styles} = useStyles();
  return (
    <div className={styles.userCard}>
      <Avatar
        size={48}
        shape="circle"
        src={currentUser.avatar}
        style={{
          color: '#fff',
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        {getInitials(currentUser.name)}
      </Avatar>
      <div className={styles.userInfo}>
        <p className={styles.userName}>{currentUser.name}</p>
        <p className={styles.userMeta}>{currentUser.title}</p>
        <p className={styles.userMeta}>{currentUser.email}</p>
      </div>
    </div>
  );
};

export const AvatarDropdown: React.FC<GlobalHeaderRightProps> = () => {
  const {styles} = useStyles();
  const {initialState, setInitialState} = useModel('@@initialState');

  const onMenuClick: MenuProps['onClick'] = (event) => {
    const {key} = event;
    if (key === 'logout') {
      startTransition(() => {
        setInitialState((s) => ({...s, currentUser: undefined}));
      });
      loginOut();
      return;
    }
    if (key === 'theme') {
      // 亮色 ⇄ 暗色切换，与 SettingDrawer 的 enableDarkTheme 走同一字段（navTheme）并持久化
      const isDark = initialState?.settings?.navTheme === 'realDark';
      const newSettings = {
        ...(initialState?.settings ?? {}),
        navTheme: isDark ? 'light' : 'realDark',
      } as Partial<LayoutSettings>;
      settingsStorage.set(newSettings);
      setInitialState((s) => ({...s, settings: newSettings}));
      return;
    }
    if (key === 'profile') {
      history.push('/account/center');
    }
  };

  if (!initialState?.currentUser) {
    return <Spin size="small"/>;
  }

  const {currentUser} = initialState;

  const menuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined/>,
      label: '个人中心',
    },
    {
      key: 'settings',
      icon: <SettingOutlined/>,
      label: '账号设置',
      disabled: true,
    },
    {
      key: 'help',
      icon: <QuestionCircleOutlined/>,
      label: '帮助中心',
      disabled: true,
    },
    {
      key: 'theme',
      icon: <SkinOutlined/>,
      label: '切换主题',
    },
    {type: 'divider' as const},
    {
      key: 'logout',
      icon: <LogoutOutlined/>,
      label: '退出登录',
      danger: true,
    },
  ];

  return (
    <HeaderDropdown
      placement="bottomRight"
      menu={{
        selectedKeys: [],
        onClick: onMenuClick,
        items: menuItems,
      }}
      popupRender={(menuNode) => (
        <div className={styles.panel}>
          <UserInfoCard currentUser={currentUser}/>
          <div className={styles.divider}/>
          {menuNode}
        </div>
      )}
    >
      <div className={styles.trigger}>
        <Avatar
          size={36}
          shape="circle"
          src={currentUser.avatar}
          style={{
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {getInitials(currentUser.name)}
        </Avatar>
        <span className={styles.triggerName}>{currentUser.name}</span>
        <DownOutlined className={styles.chevron}/>
      </div>
    </HeaderDropdown>
  );
};
