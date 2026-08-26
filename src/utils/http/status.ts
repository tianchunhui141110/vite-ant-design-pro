/**
 * HTTP 状态码与业务状态常量。
 * 集中定义，供拦截器 / 错误处理 / 重试策略共用，避免魔法数字散落。
 */
export const ApiStatus = {
  /** 业务成功 */
  success: 'success',
  /** 业务失败 */
  error: 'error',
  badRequest: 400,
  unauthorized: 401,
  forbidden: 403,
  notFound: 404,
  requestTimeout: 408,
  internalServerError: 500,
  badGateway: 502,
  serviceUnavailable: 503,
  gatewayTimeout: 504,
} as const;

export type ApiStatusValue = (typeof ApiStatus)[keyof typeof ApiStatus];

/** 值得自动重试的 HTTP 状态码（仅对幂等请求生效） */
export const RETRYABLE_STATUS_CODES = new Set<number>([
  ApiStatus.requestTimeout,
  ApiStatus.internalServerError,
  ApiStatus.badGateway,
  ApiStatus.serviceUnavailable,
  ApiStatus.gatewayTimeout,
]);
