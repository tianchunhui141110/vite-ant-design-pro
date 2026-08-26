import { useEffect, type ReactNode } from 'react';

import {
  type InitialState,
  type SetInitialState,
  useInitialStateStore,
} from '@/store/initial-state';

/**
 * 替代 umi 的 model / initialState 数据流插件。
 * 仅实现本项目用到的 useModel('@@initialState')。
 *
 * 实现基于 Zustand（src/store/initial-state.ts），
 * 对外保持 useModel / InitialStateProvider / InitialState API 不变。
 */

export type { InitialState } from '@/store/initial-state';

/**
 * 全局初始化状态 Provider。
 *
 * 在挂载时调用 getInitialState() 并写入 Zustand store。
 * Zustand 无需 Provider，此组件仅负责初始化时机与 API 兼容。
 */
export function InitialStateProvider({
  children,
  getInitialState,
}: {
  children: ReactNode;
  getInitialState: () => Promise<InitialState>;
}) {
  const loadInitialState = useInitialStateStore((s) => s.loadInitialState);

  useEffect(() => {
    loadInitialState(getInitialState);
  }, [getInitialState, loadInitialState]);

  return <>{children}</>;
}

/**
 * 兼容 umi 的 useModel API，当前仅支持 '@@initialState'。
 */
export function useModel(namespace: string): {
  initialState: InitialState | null;
  setInitialState: SetInitialState;
  loading: boolean;
} {
  const initialState = useInitialStateStore((s) => s.initialState);
  const setInitialState = useInitialStateStore((s) => s.setInitialState);
  const loading = useInitialStateStore((s) => s.loading);

  if (namespace !== '@@initialState') {
    // 其它 model 暂不支持，直接报错便于尽早发现拼写错误
    throw new Error(
      `[useModel] 暂不支持的 model namespace: "${namespace}"，当前仅支持 "@@initialState"`,
    );
  }
  return { initialState, setInitialState, loading };
}
