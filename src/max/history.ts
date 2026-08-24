import type { createBrowserRouter, To } from 'react-router-dom';

type Router = ReturnType<typeof createBrowserRouter>;

/**
 * 兼容 umi history 的全局导航对象，底层基于 react-router 的 router 实例。
 * 供组件外（如 app.tsx 的 getInitialState）使用。
 */

let routerRef: Router | null = null;

export function setRouter(router: Router) {
  routerRef = router;
}

type HistoryLocation = {
  pathname: string;
  search: string;
  hash: string;
};

type HistoryTo = string | Partial<HistoryLocation>;

/** 归一化 umi 风格的 to 对象：pathname 可能携带 query，search 可能缺少 '?' */
function normalizeTo(to: HistoryTo): To {
  if (typeof to === 'string') {
    return to;
  }
  let { pathname = '', search = '', hash = '' } = to;
  if (search && !search.startsWith('?')) {
    search = `?${search}`;
  }
  // 兼容 history.push({ pathname: '/user/register-result?account=xx' })
  const qIndex = pathname.indexOf('?');
  if (qIndex !== -1) {
    const rawSearch = pathname.slice(qIndex + 1);
    pathname = pathname.slice(0, qIndex);
    search = rawSearch ? `?${rawSearch}` : search;
  }
  return { pathname, search, hash };
}

function currentLocation(): HistoryLocation {
  const location = routerRef?.state.location ?? window.location;
  return {
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
  };
}

function navigate(to: HistoryTo, options: { replace?: boolean } = {}) {
  const target = normalizeTo(to);
  routerRef?.navigate(target, options);
}

export const history = {
  get location(): HistoryLocation {
    return currentLocation();
  },
  push(to: HistoryTo) {
    navigate(to);
  },
  replace(to: HistoryTo) {
    navigate(to, { replace: true });
  },
};

export default history;
