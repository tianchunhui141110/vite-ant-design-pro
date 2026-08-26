import { message } from 'antd';
import { ApiStatus } from './status';

/** 业务错误展示方式（与后端约定） */
export enum ErrorShowType {
  /** 静默，不提示 */
  SILENT = 0,
  /** 警告消息 */
  WARN_MESSAGE = 1,
  /** 错误消息 */
  ERROR_MESSAGE = 2,
  /** 通知 */
  NOTIFICATION = 3,
  /** 跳转登录 */
  REDIRECT = 9,
}

/** 与后端约定的响应数据格式 */
export interface ResponseStructure {
  success?: boolean;
  data?: unknown;
  errorCode?: string | number;
  errorMessage?: string;
  showType?: ErrorShowType;
}

export interface HttpErrorOptions {
  code?: string | number;
  status?: number;
  url?: string;
  method?: string;
  data?: unknown;
  showType?: ErrorShowType;
}

/**
 * 统一错误对象：同时覆盖「HTTP 错误」与「业务错误」。
 * 携带 code / status / url / method / timestamp 等元数据，便于定位与上报。
 */
export class HttpError extends Error {
  readonly name = 'HttpError';
  readonly timestamp = Date.now();
  /** 业务错误码（后端 errorCode）或 HTTP 状态码 */
  code: string | number;
  /** HTTP 状态码（无 HTTP 响应时为 undefined） */
  status?: number;
  url?: string;
  method?: string;
  data?: unknown;
  showType?: ErrorShowType;

  constructor(message: string, options: HttpErrorOptions = {}) {
    super(message);
    this.code = options.code ?? options.status ?? ApiStatus.error;
    this.status = options.status;
    this.url = options.url;
    this.method = options.method;
    this.data = options.data;
    this.showType = options.showType;
  }

  /** 转换为可上报日志的数据结构 */
  toLogData() {
    return {
      name: this.name,
      code: this.code,
      status: this.status,
      message: this.message,
      url: this.url,
      method: this.method,
      timestamp: this.timestamp,
    };
  }
}

/** 便捷创建「业务错误」 */
export function createBizError(payload: ResponseStructure): HttpError {
  return new HttpError(payload.errorMessage || '请求失败', {
    code: payload.errorCode,
    data: payload.data,
    showType: payload.showType,
  });
}

/** 便捷创建「HTTP 错误」 */
export function createHttpError(
  msg: string,
  status?: number,
  options?: { url?: string; method?: string },
): HttpError {
  return new HttpError(msg, {
    code: status,
    status,
    url: options?.url,
    method: options?.method,
  });
}

export function showError(content: string) {
  if (!content) return;
  message.error(content);
}

export function showSuccess(content: string) {
  if (!content) return;
  message.success(content);
}

/** 是否 HTTP 层错误（Axios 错误），而非业务错误 */
function isAxiosError(error: unknown): error is {
  response?: { status?: number };
  request?: unknown;
  message?: string;
} {
  return error instanceof Error && error.name !== 'HttpError';
}

/** 统一错误处理入口：根据错误类型弹出对应的提示 */
export function handleError(error: unknown) {
  if (error instanceof HttpError) {
    const { showType, message: msg } = error;
    switch (showType) {
      case ErrorShowType.SILENT:
        return;
      case ErrorShowType.WARN_MESSAGE:
        message.warning(msg);
        return;
      case ErrorShowType.NOTIFICATION:
        message.error(msg);
        return;
      case ErrorShowType.REDIRECT:
        window.location.href = '/user/login';
        return;
      default:
        message.error(msg);
        return;
    }
  }

  if (isAxiosError(error)) {
    if (error.response) {
      message.error(`请求失败（HTTP ${error.response.status}）`);
    } else if (typeof navigator !== 'undefined' && !navigator.onLine) {
      message.error('网络不可用，请检查网络连接后重试。');
    } else if (error.request) {
      message.error('服务器无响应，请稍后重试。');
    } else {
      message.error(error.message || '请求出错，请重试。');
    }
  } else {
    message.error('请求出错，请重试。');
  }
}
