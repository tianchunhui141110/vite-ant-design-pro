import { useMemo } from 'react';

import access from '@/access';
import { useModel } from './model';

/**
 * 替代 umi 的 useAccess hook。
 * 基于 initialState 计算权限，access 函数定义在 src/access.ts。
 */
export function useAccess() {
  const { initialState } = useModel('@@initialState');
  return useMemo(() => access(initialState as never), [initialState]);
}

export default useAccess;
