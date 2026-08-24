<h1 align="center">Admin Front-end Scaffold</h1>

<div align="center">

Internal admin scaffold based on Ant Design Pro v6: Vite 8 + React 19 + antd 6.

[![Checked with Biome](https://img.shields.io/badge/Checked_with-Biome-60a5fa?style=flat&logo=biome)](https://biomejs.dev)

</div>

Language: English | [简体中文](./README.zh-CN.md)

- Documentation: [docs/cheatsheet.en-US.md](./docs/cheatsheet.en-US.md)
- FAQ: [docs/cheatsheet.en-US.md#faq](./docs/cheatsheet.en-US.md#faq)

## Tech Stack

- React 19 + TypeScript (strict)
- Vite 8 + `@vitejs/plugin-react`
- antd 6 + @ant-design/pro-components 3
- Tailwind CSS v4 + antd-style
- React Router 7 (`src/max/` compatibility layer keeps umi idioms)
- Biome (lint + formatting)

## Quick Start

```bash
npm install
npm run dev   # http://localhost:8000 (with Mock)
```

Mock credentials: `admin` / `ant.design` or `user` / `ant.design`.

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 8000, with Mock) |
| `npm run start:pre` / `start:test` | Start with environment proxy (`config/proxy.mts`) |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Preview built output (port 8000) |
| `npm run lint` | Biome lint + TypeScript type check |
| `npm run biome` | Auto-fix with Biome |
| `npm run simple` | Strip to minimal scaffold (**irreversible** — commit first) |


See [docs/cheatsheet.en-US.md](./docs/cheatsheet.en-US.md) for the full guide.

## Simple Mode

The project ships with all demo pages by default. To strip it down:

```bash
git add -A && git commit -m "chore: save before simple"  # commit first
npm run simple                                            # irreversible
npm install                                               # update dependencies
```

This removes demo pages, extra mock files and unused dependencies, then switches to the simple route set.

## Upstream Notes

This scaffold is derived from [Ant Design Pro](https://github.com/ant-design/ant-design-pro) v6:

- Build tooling migrated from umi to Vite 8 (umi APIs are provided by the `src/max/` compatibility layer)
- Removed parts irrelevant to internal use: PWA, GitHub Pages deployment, upstream analytics, etc.
- For upstream upgrades, see the workflow in `.claude/skills/pro-upgrade`

## Browsers Support

Modern browsers (last 2 versions of Edge / Firefox / Chrome / Safari).
