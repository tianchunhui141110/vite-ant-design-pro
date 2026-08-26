import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';

import { errorConfig } from '@/requestErrorConfig';

/**
 * 兼容 umi request 的请求封装，底层基于 axios。
 * 用法与原 @umijs/max 的 request 一致：
 *   request<T>(url, { method, params, data, headers, skipErrorHandler })
 */
const instance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '' : undefined),
  timeout: 30000,
});

type RequestOptions = AxiosRequestConfig & {
  skipErrorHandler?: boolean;
};

const { errorHandler, errorThrower } = errorConfig.errorConfig ?? {};
const { requestInterceptors, responseInterceptors } = errorConfig;

requestInterceptors?.forEach((interceptor) => {
  instance.interceptors.request.use((config) => {
    const result = interceptor(config);
    return (result as InternalAxiosRequestConfig) ?? config;
  });
});

responseInterceptors?.forEach((interceptor) => {
  instance.interceptors.response.use((response) => {
    const result = interceptor(response);
    return result === undefined || result === null
      ? response
      : (result as typeof response);
  });
});

export async function request<T = unknown>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = 'GET',
    params,
    data,
    headers,
    skipErrorHandler,
    ...rest
  } = options;
  try {
    const response = await instance.request({
      url,
      method: method as AxiosRequestConfig['method'],
      params,
      data,
      headers,
      ...rest,
    });
    const responseData = response.data;
    // 业务错误抛出（沿用原 umi 逻辑）：
    // 仅当响应体 success === false 时才调用 errorThrower。
    // 无 success 字段的响应（如登录接口 { status: 'ok' }）不应被当作业务错误。
    if (
      errorThrower &&
      (responseData as { success?: boolean })?.success === false
    ) {
      errorThrower(responseData);
    }
    return responseData as T;
  } catch (error) {
    // 跳过错误处理时直接抛出，由调用方处理
    if (skipErrorHandler || !errorHandler) {
      throw error;
    }
    errorHandler(error, { skipErrorHandler, method, params, data });
    throw error;
  }
}

export default request;
