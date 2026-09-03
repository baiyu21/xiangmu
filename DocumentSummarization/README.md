# Document Summarization（前端）

Vue 3 + Vite + TypeScript 文档智能摘要系统前端工程。

## 技术栈

- Vue 3 / Vue Router / Pinia / Element Plus
- Vite 8 / TypeScript
- axios 请求封装（`src/api/request.ts`）
- ESLint + oxlint + Prettier
- Vitest（单测）/ Playwright（E2E，可选）

## 一条命令跑起来

```sh
cd DocumentSummarization
cp .env.example .env.development
npm ci
npm run dev
```

浏览器打开控制台提示的本地地址（默认 `http://localhost:5173`）。

## 常用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 本地开发 |
| `npm run build` | 类型检查 + 生产构建 |
| `npm run lint` | ESLint + oxlint |
| `npm run test` | Vitest 单测 |
| `npm run test:e2e` | Playwright E2E |

## 目录约定

```
src/
  api/          # 请求封装与接口模块
  components/   # 可复用组件
  stores/       # Pinia stores
  utils/        # 工具函数
  styles/       # 全局样式与设计 token
  layouts/      # 布局
  router/       # 路由
  views/        # 页面
```

## 环境变量

只提交 `.env.example`。本地复制为 `.env.development` 后按需修改：

- `VITE_API_BASE_URL`：后端 API 根路径（本地推荐 `/api`，由 Vite 代理到 `http://127.0.0.1:8000`）
- `VITE_APP_TITLE`：应用标题

认证接口（相对 `VITE_API_BASE_URL`）：

- `POST /v1/auth/login`
- `POST /v1/auth/register`
- `POST /v1/auth/send-code`


## Git 提交

使用 Conventional Commits：`feat|fix|refactor|test|chore|docs|style|perf|ci`。

示例：`feat: add axios request wrapper`

husky 会在 `npm install`（`prepare`）时把 hooks 挂到仓库根目录。若本机未识别 git，请确保 PATH 中有 git 后重新执行一次 `npm install`。
