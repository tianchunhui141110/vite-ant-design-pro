import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { history } from '@/max/history';
import { useInitialStateStore } from '@/store/initial-state';
import { createBizError, handleError, showSuccess, type ResponseStructure } from './error';
import { ApiStatus, RETRYABLE_STATUS_CODES } from './status';

/** 请求超时时间 */
const REQUEST_TIMEOUT = 30_000;
/** 请求失败自动重试次数（仅对幂等请求生效） */
const MAX_RETRIES = 1;
/** 重试延迟 */
const RETRY_DELAY = 800;

let unauthorizedHandling = false;

/** 扩展请求配置：调用方可按请求粒度过控制消息/错误处理 */
export interface ExtendedRequestConfig extends AxiosRequestConfig {
  /** 是否展示错误消息（默认 true） */
  showErrorMessage?: boolean;
  /** 是否展示成功消息 */
  showSuccessMessage?: boolean;
  /** 成功消息文案 */
  successMessage?: string;
  /** 跳过统一错误处理（与 antd pro 的 skipErrorHandler 语义一致） */
  skipErrorHandler?: boolean;
  /** 已重试次数（内部使用） */
  retryCount?: number;
}

const instance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '' : undefined),
  timeout: REQUEST_TIMEOUT,
});

/** 401 防抖登出：清空登录态并跳转登录页 */
function handleUnauthorized() {
  if (unauthorizedHandling) return;
  unauthorizedHandling = true;
  setTimeout(() => {
    unauthorizedHandling = false;
    useInitialStateStore.getState().setInitialState((s) => ({
      ...s,
      currentUser: undefined,
    }));
    const { pathname, search, hash } = window.location;
    if (pathname !== '/user/login') {
      history.replace(
        `/user/login?redirect=${encodeURIComponent(pathname + search + hash)}`,
      );
    }
  }, 500);
}

/** 是否值得自动重试 */
function shouldRetry(error: {
  config?: ExtendedRequestConfig;
  response?: { status?: number };
}): boolean {
  const config = error.config;
  if (!config || config.skipErrorHandler) return false;
  if ((config.method ?? 'get').toUpperCase() !== 'GET') return false;
  const status = error.response?.status;
  return status !== undefined && RETRYABLE_STATUS_CODES.has(status);
}

/** 请求拦截器：注入 token / Content-Type */
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = token;
  }
  if (
    config.data &&
    !(config.data instanceof FormData) &&
    !config.headers['Content-Type']
  ) {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

/** 响应拦截器：业务错误 / 401 防抖 / 自动重试 / 消息提示 */
instance.interceptors.response.use(
  (response) => {
    const data = response.data as Partial<ResponseStructure>;
    // 后端业务错误（约定响应体 success === false）
    if (data && typeof data === 'object' && 'success' in data && data.success === false) {
      return Promise.reject(createBizError(response.data as ResponseStructure));
    }
    const config = response.config as ExtendedRequestConfig;
    if (config.showSuccessMessage) {
      showSuccess(config.successMessage || '操作成功');
    }
    return response;
  },
  (error: {
    config?: ExtendedRequestConfig;
    response?: { status?: number };
    request?: unknown;
  }) => {
    const config = error.config;
    // 自动重试（幂等 GET + 可重试状态码）
    if (shouldRetry(error) && (config?.retryCount ?? 0) < MAX_RETRIES) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          instance
            .request({
              ...config,
              retryCount: (config?.retryCount ?? 0) + 1,
            } as ExtendedRequestConfig)
            .then(resolve)
            .catch(reject);
        }, RETRY_DELAY);
      });
    }
    // 401 防抖登出
    if (error.response?.status === ApiStatus.unauthorized) {
      handleUnauthorized();
    }
    // 统一错误消息（skipErrorHandler 或 showErrorMessage=false 时跳过）
    if (!config?.skipErrorHandler && config?.showErrorMessage !== false) {
      handleError(error);
    }
    return Promise.reject(error);
  },
);

export type RequestOptions = ExtendedRequestConfig;

/**
 * 统一请求方法（兼容原 umi request 的调用方式）：
 *   request<T>(url, { method, params, data, headers, skipErrorHandler, showSuccessMessage })
 */
export async function request<T = unknown>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    skipErrorHandler,
    showErrorMessage,
    showSuccessMessage,
    successMessage,
    ...rest
  } = options;
  const response = await instance.request({
    url,
    ...rest,
    skipErrorHandler,
    showErrorMessage,
    showSuccessMessage,
    successMessage,
  } as ExtendedRequestConfig);
  return response.data as T;
}

export default request;
