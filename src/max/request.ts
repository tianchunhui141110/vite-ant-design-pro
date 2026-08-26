/**
 * 兼容 umi request 的请求层入口。
 * 具体实现已迁移到 src/utils/http/（四层拆分：index / error / status），
 * 此处仅做转发以保持 `import { request } from '@/max'` 的调用方式不变。
 */
export { request, default } from '@/utils/http';
export type { RequestOptions, ExtendedRequestConfig } from '@/utils/http';
