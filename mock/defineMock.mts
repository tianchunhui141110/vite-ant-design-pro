import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * umi mock handler 类型。
 * handler 内部使用 express 风格 API：res.send / res.json / res.status。
 */
export type UmiMockHandler = (
  req: IncomingMessage & { body?: any; query?: Record<string, string> },
  res: ExpressLikeResponse,
) => void | Promise<void>;

/** 在 Node 原生 ServerResponse 上补充 express 风格的最小兼容方法 */
export type ExpressLikeResponse = ServerResponse & {
  json: (data: unknown) => ExpressLikeResponse;
  send: (data: unknown) => ExpressLikeResponse;
  status: (code: number) => ExpressLikeResponse;
};

/** defineMock 转换后的 mock 路由 */
export interface MockRoute {
  /** 请求路径 */
  url: string;
  /** 未指定时 GET/POST 均可匹配（与 umi 行为一致） */
  method?: string;
  /** express 风格 handler */
  handler?: UmiMockHandler;
  /** 静态响应体（handler 优先） */
  body?: unknown;
}

export function createExpressLikeResponse(
  res: ServerResponse,
): ExpressLikeResponse {
  const shim = res as ExpressLikeResponse;
  shim.status = (code: number) => {
    res.statusCode = code;
    return shim;
  };
  shim.json = (data: unknown) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
    return shim;
  };
  shim.send = (data: unknown) => {
    if (typeof data === 'object' && data !== null) {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    } else {
      res.end(data == null ? '' : String(data));
    }
    return shim;
  };
  return shim;
}

const HTTP_METHODS = new Set([
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'PATCH',
  'HEAD',
  'OPTIONS',
  'TRACE',
]);

/**
 * 将 umi 风格的 mock 对象转换为统一的 MockRoute 数组。
 *
 * 支持的 key：
 *  - 'GET /api/xxx'        方法 + 路径
 *  - '/api/xxx'            仅路径（匹配默认 GET/POST）
 *
 * 函数值作为 handler 调用（res 已注入 express 风格 send/json/status）；
 * 非函数值作为静态响应体。
 */
export function defineMock(routes: Record<string, unknown>): MockRoute[] {
  return Object.entries(routes).map(([key, value]) => {
    const trimmed = key.trim();
    const match = trimmed.match(/^([A-Z]+)\s+(.+)$/);
    const method =
      match && HTTP_METHODS.has(match[1].toUpperCase())
        ? match[1].toUpperCase()
        : undefined;

    const route: MockRoute = {
      url: method ? match![2] : trimmed,
      ...(method ? { method } : {}),
    };

    if (typeof value === 'function') {
      route.handler = value as UmiMockHandler;
    } else {
      route.body = value;
    }

    return route;
  });
}
