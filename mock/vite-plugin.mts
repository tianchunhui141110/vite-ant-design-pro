import type { IncomingMessage } from 'node:http';
import { readdirSync } from 'node:fs';
import { join, normalize, sep } from 'node:path';
import type { Connect, Plugin, ViteDevServer } from 'vite';

import {
  createExpressLikeResponse,
  type ExpressLikeResponse,
  type MockRoute,
} from './defineMock.mts';

interface UmiMockServerOptions {
  /** 仅拦截以该前缀开头的请求，默认 '/api' */
  prefix?: string;
}

/** mock 入口文件（相对项目根，POSIX 风格）。mock/pages.mts 聚合了 src/pages 下的页面级 _mock.ts */
function resolveMockEntries(root: string): string[] {
  const dir = join(root, 'mock');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.ts') || f.endsWith('.mts'))
    .filter((f) => !['utils.ts', 'defineMock.mts', 'vite-plugin.mts'].includes(f))
    .map((f) => `mock/${f}`);
}

/** 读取并解析请求体（JSON 或原始字符串） */
function readBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let raw = '';
    req.setEncoding('utf8');
    req.on('data', (chunk: string) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) return resolve(undefined);
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve(raw);
      }
    });
    req.on('error', () => resolve(undefined));
  });
}

function matchRoute(
  routes: Map<string, MockRoute[]>,
  pathname: string,
  method: string,
): MockRoute | undefined {
  const candidates = routes.get(pathname);
  if (!candidates) return undefined;
  return candidates.find((r) => {
    if (!r.method) return method === 'GET' || method === 'POST';
    return r.method === method;
  });
}

/**
 * 自研 mock 中间件，替代 vite-plugin-mock-dev-server。
 *
 * - 通过 dev server 的 ssrLoadModule 加载 mock 目录下的入口文件（天然支持 TS 与路径别名）
 * - 复用 mock/defineMock.mts 的 umi 风格格式
 * - handler 使用 express 风格 res.json / res.send / res.status
 * - mock 文件变更自动热重载（mock 目录与 src/pages 下的 _mock.ts）
 */
export function umiMockServer(options: UmiMockServerOptions = {}): Plugin {
  const prefix = options.prefix ?? '/api';
  const routes = new Map<string, MockRoute[]>();
  let entries: string[] = [];

  async function loadMocks(server: ViteDevServer) {
    routes.clear();
    for (const file of entries) {
      try {
        const mod = await server.ssrLoadModule(`/${file}`);
        const list = (mod.default ?? []) as MockRoute[];
        if (!Array.isArray(list)) {
          server.config.logger.warn(`[mock] ${file} 未导出 defineMock 数组，已跳过`);
          continue;
        }
        for (const route of list) {
          const bucket = routes.get(route.url) ?? [];
          bucket.push(route);
          routes.set(route.url, bucket);
        }
      } catch (e) {
        server.config.logger.error(`[mock] 加载 ${file} 失败：${e}`);
      }
    }
    server.config.logger.info(`[mock] 已注册 ${routes.size} 个路径的 mock 数据`);
  }

  async function invalidateModule(server: ViteDevServer, url: string) {
    const mod = await server.moduleGraph.getModuleByUrl(url, true);
    if (mod) server.moduleGraph.invalidateModule(mod);
  }

  return {
    name: 'umi-mock-server',
    apply: 'serve',

    configureServer(server) {
      entries = resolveMockEntries(server.config.root);

      // 首次加载在 server 启动后执行（等待 vite ready，避免阻塞启动）
      let ready = false;
      const init = async () => {
        if (ready) return;
        ready = true;
        await loadMocks(server);
      };
      server.httpServer?.once('listening', init);
      // 兜底：若 httpServer 尚未创建（测试环境等），延迟到下一个 tick
      if (!server.httpServer) {
        setTimeout(init, 0);
      }

      // mock 文件热更新：失效相关模块并重新加载
      server.watcher.on('change', async (file) => {
        const normalized = normalize(file);
        if (
          normalized.includes(`${sep}mock${sep}`) ||
          /_mock\.ts$/.test(normalized)
        ) {
          for (const entry of entries) {
            await invalidateModule(server, `/${entry}`);
          }
          // 依赖模块（utils.ts / _mock.ts 聚合的页面文件）失效后向上传播
          const rel = normalized.replace(
            server.config.root.replaceAll(sep, '/'),
            '',
          );
          invalidateModule(server, rel).then(() => loadMocks(server));
        }
      });

      // 拦截 /api 请求（在 vite 内部中间件之前）
      server.middlewares.use(
        (async (req: Connect.IncomingMessage, res, next) => {
          if (!req.url) return next();
          const url = new URL(req.url, 'http://localhost');
          const pathname = decodeURIComponent(url.pathname);
          if (!pathname.startsWith(prefix)) return next();

          if (!ready) await init();
          const method = (req.method ?? 'GET').toUpperCase();
          const route = matchRoute(routes, pathname, method);
          if (!route) return next();

          const mockReq = req as IncomingMessage & {
            body?: any;
            query?: Record<string, string>;
          };
          mockReq.query = Object.fromEntries(url.searchParams);
          if (method !== 'GET' && method !== 'HEAD') {
            mockReq.body = await readBody(req);
          }

          try {
            if (typeof route.handler === 'function') {
              await route.handler(
                mockReq,
                createExpressLikeResponse(res as any) as ExpressLikeResponse,
              );
            } else {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(route.body));
            }
          } catch (e) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ message: String(e) }));
          }
        }) as Connect.NextHandleFunction,
      );
    },
  };
}
