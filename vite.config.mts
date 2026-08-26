import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type ProxyOptions } from 'vite';

import proxy from './config/proxy.mts';
import pkg from './package.json' with { type: 'json' };
import { umiMockServer } from './mock/vite-plugin.mts';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Compute commit hash: env vars take precedence, fall back to git at build time
const commitHash =
  process.env.COMMIT_HASH ||
  process.env.CF_PAGES_COMMIT_SHA ||
  (() => {
    try {
      return execSync('git rev-parse HEAD', {
        stdio: ['ignore', 'pipe', 'ignore'],
        encoding: 'utf-8',
      }).trim();
    } catch {
      return '';
    }
  })();

const PUBLIC_PATH = '/';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';

  return {
    base: PUBLIC_PATH,
    plugins: [
      react(),
      tailwindcss(),
      // dev / mock 模式下启用本地 mock（对应原 umi 的 mock 功能）
      // - dev：默认开发环境，配合本地代理使用；
      // - mock：由 npm run dev:mock 触发（vite --mode mock），此时不会注入
      //   .env.development 里的 VITE_API_BASE_URL，请求走本地 mock，
      //   不影响 dev / test / prod 的环境配置。
      // 自研中间件（mock/vite-plugin.mts），加载 mock 目录下入口，
      // 兼容 umi 的 mock 对象格式（通过 defineMock 转换），支持热重载
      (isDev || mode === 'mock') && umiMockServer({ prefix: '/api' }),
    ],
    resolve: {
      alias: {
        '@': join(__dirname, 'src'),
        '@root': __dirname,
      },
    },
    define: {
      'process.env.CI': JSON.stringify(process.env.CI),
      'process.env.COMMIT_HASH': JSON.stringify(commitHash),
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    server: {
      port: 8000,
      // 原 config/proxy.mts 的代理配置，key 为 Vite mode
      proxy: (proxy as Record<string, Record<string, ProxyOptions>>)[mode] ?? {},
    },
    build: {
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        // @ant-design/pro-components 内部存在互相 re-export（ProForm、
        // FooterToolbar 等），Rollup 拆分 chunk 时会打印循环依赖警告。
        // 属第三方库已知问题，不影响运行，此处仅过滤这类特定警告。
        onwarn(warning, defaultHandler) {
          const { message } = warning;
          if (
            message.includes('pro-components') &&
            (message.includes('reexported') ||
              message.includes('Circular chunk'))
          ) {
            return;
          }
          defaultHandler(warning);
        },
        output: {
          // 与原 umi hash 行为一致：产物带 contenthash
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash][extname]',
        },
      },
    },
  };
});
