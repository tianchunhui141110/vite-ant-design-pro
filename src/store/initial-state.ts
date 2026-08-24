import type { Dispatch, SetStateAction } from 'react';
import { create } from 'zustand';

/**
 * 全局初始化状态（原 umi 的 @@initialState）。
 *
 * 由 InitialStateProvider（src/max/model.tsx）在应用挂载时通过
 * getInitialState() 加载，并可通过 useModel('@@initialState')
 * 读写。改用 Zustand 实现后无需 Provider 包裹即可在任何组件/模块中访问。
 */
export type InitialState = {
  settings?: Record<string, unknown>;
  currentUser?: API.CurrentUser;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
  settingDrawerOpen?: boolean;
  [key: string]: unknown;
};

/** 兼容 React setState 的 setter 类型（支持函数式更新） */
export type SetInitialState = Dispatch<SetStateAction<InitialState | null>>;

interface InitialStateStore {
  initialState: InitialState | null;
  loading: boolean;
  /** 兼容 React setState 语义：支持传值或函数式更新 */
  setInitialState: SetInitialState;
  /** 加载全局初始化数据（挂载时调用） */
  loadInitialState: (
    getInitialState: () => Promise<InitialState>,
  ) => Promise<void>;
}

export const useInitialStateStore = create<InitialStateStore>((set) => ({
  initialState: null,
  loading: true,
  setInitialState: (updater) => {
    set((state) => ({
      initialState:
        typeof updater === 'function'
          ? (updater as (prev: InitialState | null) => InitialState | null)(
              state.initialState,
            )
          : updater,
    }));
  },
  loadInitialState: async (getInitialState) => {
    try {
      const initialState = await getInitialState();
      set({ initialState, loading: false });
    } catch (error) {
      // 初始化失败不应阻塞应用渲染，打印错误并置为 null
      console.error('[InitialStateProvider]', error);
      set({ initialState: null, loading: false });
    }
  },
}));
