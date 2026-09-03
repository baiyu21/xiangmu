# F0 Framework Scaffold Implementation Plan

> **For agentic workers:** Execute task-by-task. Steps use checkbox syntax.
> Spec: `docs/superpowers/specs/2026-09-01-f0-framework-scaffold-design.md`

**Goal:** 为 DocumentSummarization 补齐规范要求的前端框架骨架（目录、axios、env、CI、husky/commitlint、README），不改业务页交互。

**Architecture:** 在现有 Vue3+Vite 工程内新增分层目录与请求/store 壳；CI 挂在 `xiangmu/.github`（git 根）；业务 views 保持 mock。

**Tech Stack:** Vue 3、Vite 8、Pinia、axios、ESLint/oxlint、Vitest、husky、commitlint、GitHub Actions、gitleaks

## Global Constraints

- 不修改 `src/views/**` 业务逻辑与模板交互
- 不修改 `src/router/index.ts` 路由表（request 内可动态 import router）
- 覆盖率门禁本阶段不卡死 CI
- 不主动 git commit（除非用户明确要求）

---

### Task 1: 目录分层 + utils/styles/components 占位

**Files:**
- Create: `src/utils/storage.ts`
- Create: `src/utils/index.ts`
- Create: `src/styles/tokens.css`
- Create: `src/components/index.ts`
- Modify: `src/main.ts`（引入 tokens.css）

**Interfaces:**
- Produces: `getToken(): string | null`, `setToken(token: string): void`, `clearToken(): void`（storage key `ds_token`）
- Produces: CSS vars `--color-brand`, `--color-text`, `--color-bg` in `tokens.css`

- [ ] Create `storage.ts` with get/set/clear for `ds_token`
- [ ] Create barrel `utils/index.ts` exporting storage helpers
- [ ] Create `tokens.css` with brand tokens matching existing `#0f766e`
- [ ] Create `components/index.ts` exporting empty object comment placeholder: `export {}`
- [ ] Import `./styles/tokens.css` in `main.ts`
- [ ] Verify: TypeScript resolves `@/utils`

---

### Task 2: Pinia user store 壳

**Files:**
- Create: `src/stores/user.ts`
- Create: `src/stores/index.ts`

**Interfaces:**
- Consumes: `getToken` / `setToken` / `clearToken` from `@/utils/storage`
- Produces: `useUserStore` with `token`, `setToken(token: string)`, `clearAuth()`

- [ ] Implement store syncing pinia state with storage
- [ ] Export from `stores/index.ts`
- [ ] Do not wire LoginView

---

### Task 3: axios 请求封装

**Files:**
- Create: `src/api/request.ts`
- Create: `src/api/index.ts`
- Modify: `package.json`（dependency axios）
- Modify: `env.d.ts`（`ImportMetaEnv`）

**Interfaces:**
- Consumes: `useUserStore`, `import.meta.env.VITE_API_BASE_URL`, vue-router, `ElMessage`
- Produces: default `request` axios instance; response interceptor returns `response.data`

- [ ] `npm install axios`
- [ ] Implement request/response interceptors per spec 4.2
- [ ] Export from `api/index.ts`
- [ ] Extend `env.d.ts`:

```ts
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_TITLE: string
}
```

---

### Task 4: 环境变量与 gitignore

**Files:**
- Create: `.env.example`
- Modify: `.gitignore`

- [ ] Write `.env.example` with `VITE_API_BASE_URL` and `VITE_APP_TITLE`
- [ ] Ensure `.gitignore` ignores `.env`, `.env.local`, `.env.*.local`, `.env.development`, `.env.staging`, `.env.production` but NOT `.env.example`

---

### Task 5: package scripts + husky + commitlint

**Files:**
- Modify: `package.json`
- Create: `commitlint.config.js`
- Create: `.husky/pre-commit`
- Create: `.husky/commit-msg`
- Create: `.lintstagedrc.json`（optional）

- [ ] Add scripts: `"test": "vitest run"`, `"test:coverage": "vitest run --coverage"`, `"prepare": "husky"`
- [ ] Install devDeps: husky, @commitlint/cli, @commitlint/config-conventional, lint-staged
- [ ] commitlint extends `@commitlint/config-conventional`
- [ ] pre-commit runs `npx lint-staged`
- [ ] commit-msg runs `npx --no -- commitlint --edit $1`
- [ ] lint-staged: `*.{vue,ts,tsx}` → `eslint --fix`

---

### Task 6: GitHub Actions CI

**Files:**
- Create: `xiangmu/.github/workflows/frontend-ci.yml`

- [ ] Job secret-scan: gitleaks with fetch-depth 0
- [ ] Job frontend-gate: working-directory DocumentSummarization; node 22; npm ci; lint; build; `npm run test`
- [ ] Do not fail on coverage thresholds

---

### Task 7: README 交付说明

**Files:**
- Modify: `README.md`

- [ ] Replace template README with project title, stack, setup steps matching验收清单

---

### Task 8: 验证

- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `npm run test`
- [ ] Confirm views unchanged（no edits under views except if accidental — revert）
