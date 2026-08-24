<h1 align="center">中台前端脚手架</h1>

<div align="center">

基于 Ant Design Pro v6 改造的内部中台前端脚手架：Vite 8 + React 19 + antd 6。

[![Checked with Biome](https://img.shields.io/badge/Checked_with-Biome-60a5fa?style=flat&logo=biome)](https://biomejs.dev)

</div>

- 使用文档：[docs/cheatsheet.zh-CN.md](./docs/cheatsheet.zh-CN.md)
- 常见问题：[docs/cheatsheet.zh-CN.md#faq](./docs/cheatsheet.zh-CN.md#faq)

## 技术栈

- React 19 + TypeScript（strict）
- Vite 8 构建 + `@vitejs/plugin-react`
- antd 6 + @ant-design/pro-components 3
- Tailwind CSS v4 + antd-style
- React Router 7（`src/max/` 兼容层保留 umi 习惯用法）
- Biome lint/格式化

## 快速开始

```bash
npm install
npm run dev   # http://localhost:8000（内置 Mock）
```

Mock 账号：`admin` / `ant.design` 或 `user` / `ant.design`。

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（端口 8000，带 Mock） |
| `npm run start:pre` / `start:test` | 按环境启动（走 `config/proxy.mts` 对应代理） |
| `npm run build` | 构建生产产物到 `dist/` |
| `npm run preview` | 预览构建产物（端口 8000） |
| `npm run lint` | Biome lint + TypeScript 类型检查 |
| `npm run biome` | Biome 自动修复 |
| `npm run simple` | 精简为最小脚手架（**不可逆**，执行前先提交） |


完整说明见 [docs/cheatsheet.zh-CN.md](./docs/cheatsheet.zh-CN.md)。

## 精简模式

项目默认包含全部示例页面。如需最小化脚手架：

```bash
git add -A && git commit -m "chore: save before simple"  # 必须先提交
npm run simple                                            # 不可逆
npm install                                               # 更新依赖
```

会移除多余的示例页面、mock 文件与依赖，并切换到精简版路由。

## 上游说明

本脚手架基于 [Ant Design Pro](https://github.com/ant-design/ant-design-pro) v6 改造：

- 构建工具由 umi 迁移至 Vite 8（`umi` API 通过 `src/max/` 兼容层提供）
- 已移除与内部使用无关的部分：PWA、GitHub Pages 部署、上游统计脚本等
- 跟进上游更新可参考 `.claude/skills/pro-upgrade` 的升级流程

## 浏览器支持

现代浏览器（Edge / Firefox / Chrome / Safari 最近两个版本）。
