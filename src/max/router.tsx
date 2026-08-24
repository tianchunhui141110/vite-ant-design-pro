import React from 'react';
import {
  Navigate,
  Outlet,
  Link as RouterLink,
  useLocation,
  useMatch,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

/**
 * react-router 相关 API 的兼容层，替代 umi 从 @umijs/max 导出的路由 API。
 */

type LinkProps = Omit<React.ComponentProps<typeof RouterLink>, 'prefetch'> & {
  /** umi Link 的 prefetch 布尔属性，react-router v7 中忽略 */
  prefetch?: boolean;
};

export function Link({ prefetch: _prefetch, ...props }: LinkProps) {
  return <RouterLink {...props} />;
}

export {
  Navigate,
  Outlet,
  useLocation,
  useMatch,
  useNavigate,
  useSearchParams,
};
