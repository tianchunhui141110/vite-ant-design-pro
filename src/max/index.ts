import type React from 'react';

import type { InitialState } from './model';

export { useAccess } from './access';
export { Helmet } from './helmet';

export { history, setRouter } from './history';
export type { InitialState } from './model';
export { InitialStateProvider, useModel } from './model';
export { request } from './request';
export {
  Link,
  Navigate,
  Outlet,
  useLocation,
  useMatch,
  useNavigate,
  useSearchParams,
} from './router';

/**
 * 兼容 umi 的 RequestConfig 类型。
 * 用于 src/requestErrorConfig.ts 的配置声明。
 */
export interface RequestConfig {
  errorConfig?: {
    errorThrower?: (res: unknown) => void;
    errorHandler?: (error: unknown, opts: unknown) => void;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requestInterceptors?: Array<(config: any) => any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  responseInterceptors?: Array<(response: any) => any>;
}

/**
 * 兼容 umi 的 RunTimeLayoutConfig 类型。
 * app.tsx 的 layout 运行时配置，返回 ProLayout 支持的 props。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RunTimeLayoutConfig = (params: {
  initialState: InitialState | null;
  setInitialState: React.Dispatch<React.SetStateAction<InitialState | null>>;
}) => any;
