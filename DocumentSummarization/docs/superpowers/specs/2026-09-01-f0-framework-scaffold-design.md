# F0 前端框架骨架设计

> **日期**：2026-09-01  
> **范围**：`xiangmu/DocumentSummarization`  
> **目标**：按团队《框架搭建交付清单》完成「只搭骨架」验收，业务页保持 mock、不改交互  
> **状态**：设计已口头确认（方案 A / 落地方式 1）

---

## 1. 背景与成功标准

对照团队开发流程规范「阶段四 · 框架搭建」，当前项目仅有 `layouts / router / views`，缺少请求封装、目录分层、环境隔离、CI、提交钩子。

**成功标准（全部满足即视为 F0 完成）：**

1. `git clone` 后按 README：`cp .env.example .env.development` → `npm ci` → `npm run dev` 可启动  
2. `npm run lint` 与 `npm run build` 通过  
3. 存在规范要求目录：`src/{api,components,stores,utils,styles}`  
4. 存在可复用的 axios 请求封装（token 注入、401 跳登录、错误 Toast）  
5. 存在 `.env.example`；真实 `.env*` 不进仓库  
6. 存在 GitHub Actions：密钥扫描 + lint + build（单测可跑；覆盖率阈值本阶段不强制卡死）  
7. 存在 husky + commitlint（`feat|fix|refactor|test|chore|docs`）  
8. **不改**既有业务页面交互与 mock 数据

---

## 2. 范围

### 做

| 项 | 说明 |
|----|------|
| 目录分层 | 新建 `api` / `components` / `stores` / `utils` / `styles`，各层有可导入的入口或占位 |
| 请求封装 | `src/api/request.ts`：axios 实例 + 拦截器 |
| 用户 store 壳 | `src/stores/user.ts`：token / profile 读写，供拦截器读取；**不**接真实登录 |
| 环境变量 | `.env.example`、`.env.development`（本地假值）、`env.d.ts` 类型声明 |
| CI | `.github/workflows/ci.yml`：gitleaks + lint + build + `vitest run` |
| Git 钩子 | husky `pre-commit`（lint-staged 或 lint）、`commit-msg`（commitlint） |
| README | 替换为项目说明 + 一条命令跑通步骤 |

### 不做（P1）

- 改 Login / 用户 / 项目 / AI 等业务页逻辑  
- 路由守卫、真实 API 对接  
- 业务单测与覆盖率硬门禁生效（阈值可写在配置注释或后续开启）  
- 修复 `RegisterView` 死代码、E2E 模板断言

---

## 3. 架构

```
src/
├── api/
│   ├── request.ts      # axios 单例 + 拦截器
│   └── index.ts        # 导出 request
├── stores/
│   ├── user.ts         # token / userInfo
│   └── index.ts
├── components/
│   └── index.ts        # 占位导出（暂无业务组件）
├── utils/
│   ├── storage.ts      # localStorage 读写 token 的薄封装
│   └── index.ts
├── styles/
│   └── tokens.css      # CSS 变量占位（品牌色等），main.ts 引入
├── layouts/            # 已有，不动业务
├── router/             # 已有，不动路由表
└── views/              # 已有，不动页面
```

**数据流（骨架期）：**

- 业务页仍用本地 mock，**不强制**调用 `request`  
- `request` 从 `user` store / `utils/storage` 读 token；401 时清 token 并 `router.push('/login')`  
- `ElMessage` 展示接口错误信息（若后端返回 `msg` 则优先使用）

---

## 4. 关键实现约定

### 4.1 环境变量

`.env.example`：

```ini
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_TITLE=Document Summarization
```

- 仓库提交：`.env.example`  
- 本地开发：复制为 `.env.development`（可提交假值模板，或仅 example；推荐 **example 入库，`.env.development` 本机复制、gitignore**）  
- `.gitignore` 增加：`.env`、`.env.local`、`.env.*.local`，以及 `.env.development` / `.env.staging` / `.env.production`（若含真实密钥）；若团队希望 example 以外一律忽略，则全部忽略除 `.env.example` 外的 env 文件

### 4.2 axios 拦截器

- Request：`Authorization: Bearer <token>`（有 token 才加）  
- Response 成功：直接返回 `response.data`（或保持 AxiosResponse，团队统一选 **返回 `data`**）  
- Response 失败：  
  - `401` → 清登录态 → 跳转 `/login` → Toast「请重新登录」  
  - 其它 → Toast 错误信息，`Promise.reject(error)`

### 4.3 Pinia user store

- `token: string | null`  
- `setToken` / `clearAuth`  
- 持久化：通过 `utils/storage` 同步 localStorage（key：`ds_token`）  
- **不**在本阶段改 LoginView 调用 store

### 4.4 CI（`DocumentSummarization/.github/workflows/ci.yml`）

因当前 git 根在 `xiangmu/`（前端在子目录），workflow 放在：

- **优先**：`xiangmu/.github/workflows/ci.yml`，`working-directory: DocumentSummarization`  
- 若仅维护前端子仓习惯，也可放在 `DocumentSummarization/.github/`（仅当该目录为独立 remote 时有效）

本设计采用：**`xiangmu/.github/workflows/frontend-ci.yml`**，`defaults.run.working-directory: DocumentSummarization`。

Jobs：

1. gitleaks（`fetch-depth: 0`）  
2. frontend-gate：`npm ci` → `npm run lint` → `npm run build` → `npm run test:unit -- --run`（或新增 `test` / `test:coverage` 脚本）

覆盖率：`vitest` 可预留 `test:coverage` 脚本与 thresholds 注释；**本阶段 CI 不因覆盖率失败而红灯**。

### 4.5 husky + commitlint

- 在 `DocumentSummarization` 下配置（前端工程根）  
- commitlint type：`feat|fix|refactor|test|chore|docs|style|perf|ci`  
- pre-commit：对暂存文件跑 eslint/prettier（lint-staged）

### 4.6 依赖

新增：`axios`；dev：`husky`、`@commitlint/cli`、`@commitlint/config-conventional`、`lint-staged`

---

## 5. 风险与约束

- Lint 当前对空目录 / 未使用导出可能告警：用 `index.ts` 显式导出或 `.gitkeep` + 最小实现避免空包问题  
- `main.ts` 仅增加：引入 `styles/tokens.css`；**不**强制改 App 结构  
- 不引入业务 mock 服务；axios 可被后续 MSW 替换  

---

## 6. 验收清单

- [ ] 目录 `api/components/stores/utils/styles` 存在且可 import  
- [ ] `request` 拦截器行为符合 4.2（可用单测或手工注释说明；骨架期不强制单测）  
- [ ] `.env.example` 存在；README 写明复制步骤  
- [ ] `npm run lint` / `npm run build` 通过  
- [ ] CI workflow 文件存在且路径正确  
- [ ] husky + commitlint 配置存在  
- [ ] 既有 views 无功能性改动  

---

*F0 Framework Scaffold Design · 2026-09-01*
