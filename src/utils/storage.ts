/**
 * 版本化 localStorage 管理工具。
 *
 * 设计动机：应用升级后，旧版本写入的 localStorage 数据（如主题设置）可能与
 * 新版本的数据结构不兼容。通过在存储键中内置应用版本号，做到：
 * - 同版本内复用同一键，正常读写；
 * - 升级后自动把「旧版本键」的数据迁移到「新版本键」，兼容老用户；
 * - 读取到非法 JSON / 损坏数据时自动清理，避免脏数据导致崩溃。
 */

/** 当前应用版本（由 vite define 注入，构建期静态替换） */
const STORAGE_VERSION = __APP_VERSION__ || '0.0.0';

/** 版本化键：sys-v{version}-{key} */
function versionedKey(key: string): string {
  return `sys-v${STORAGE_VERSION}-${key}`;
}

/** 旧版键：无版本前缀（升级迁移的源） */
function legacyKey(key: string): string {
  return key;
}

export interface StorageManager<T> {
  /** 读取并反序列化；旧版本数据自动迁移；损坏数据自动清理 */
  get(): T | null;
  set(value: T): void;
  remove(): void;
}

/**
 * 创建带版本号与迁移能力的存储管理器。
 */
export function createStorageManager<T>(key: string): StorageManager<T> {
  const current = versionedKey(key);

  const readCurrent = (): T | null => {
    const raw = localStorage.getItem(current);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      // 损坏数据：清理，避免反复报错
      localStorage.removeItem(current);
      return null;
    }
  };

  const migrateFromLegacy = (): T | null => {
    const raw = localStorage.getItem(legacyKey(key));
    if (!raw) return null;
    try {
      // 先校验可解析，再迁移
      const parsed = JSON.parse(raw) as T;
      localStorage.setItem(current, raw);
      localStorage.removeItem(legacyKey(key));
      return parsed;
    } catch {
      localStorage.removeItem(legacyKey(key));
      return null;
    }
  };

  return {
    get() {
      return readCurrent() ?? migrateFromLegacy();
    },
    set(value) {
      try {
        localStorage.setItem(current, JSON.stringify(value));
      } catch {
        // 隐私模式 / 存储配额满：静默失败，不影响主流程
      }
    },
    remove() {
      localStorage.removeItem(current);
      localStorage.removeItem(legacyKey(key));
    },
  };
}
