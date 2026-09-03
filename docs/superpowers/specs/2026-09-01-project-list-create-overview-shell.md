# 项目管理：列表 / 新建 / 详情跳转（方案 A）

> **日期**：2026-09-01  
> **原型**：仓库根目录 `index.html`（v-projects / 添加项目弹窗 / 进入概览）  
> **范围**：列表对齐表格 + 弹窗新建 + 详情路由壳；**不含**文件映射树与文件表  
> **约束**：不接真实 API；遵守现有目录分层、三态、鉴权守卫、单测约定

---

## 1. 目标

1. 项目管理列表按原型改为表格，支持「添加项目」「进入概览」。  
2. 新建项目为弹窗（仓库地址 + 默认分支），结果写入本地 Pinia mock。  
3. 「进入概览」跳转 `/app/projects/:id`，详情页为文件映射壳（面包屑 + 标题 + 占位）。

## 2. 非目标

- 文件映射：模块/仓库树、搜索排序、文件行、文档详情  
- 真实同步仓库 / 后端 CRUD  
- 按角色过滤可访问项目（可后续接用户权限）

## 3. 数据模型

```ts
interface Project {
  id: string
  name: string
  url: string
  branch: string
  mappedFiles: number  // mock
  changeCount: number  // mock
}
```

初始数据：

| id | name | url | branch |
|----|------|-----|--------|
| rd-xmz | rd-xmz | https://github.com/rd/xmz.git | main |
| school-portal | school-portal | https://github.com/school/portal.git | develop |

添加逻辑：从 URL 末段解析 `name`（去 `.git`），`id` 可用 name；`mappedFiles`/`changeCount` 初始为 0。

## 4. 页面与路由

| 路径 | 组件 | 说明 |
|------|------|------|
| `/app/projects` | `ProjectManagement.vue` | 表格列表 + 弹窗 |
| `/app/projects/:id` | `ProjectOverview.vue` | 详情壳 |

- 守卫：沿用 `requiresAuth`（挂在 `/app` 下）  
- 无效 id：错误态 + 返回列表按钮

## 5. UI 要点（对齐原型）

**列表**

- 表头：项目 / 仓库 / 分支 / 映射文件 / 修改次数 / 操作  
- 操作：进入概览（主按钮）；同步可 Toast「同步完成（模拟）」  
- 工具栏：全部同步（Toast）、添加项目  
- 说明文案对齐原型主路径提示（可精简）

**弹窗**

- 仓库地址必填；分支默认 `main`  
- 取消关闭；保存校验后写入 store 并关闭 + Toast

**详情壳**

- 面包屑：项目管理 → {name} → 文件映射  
- H1：文件映射；副文案：按文件查看修改次数…  
- 占位区提示下一阶段实现完整映射

## 6. 文件清单

- Create: `src/stores/project.ts`、`src/stores/__tests__/project.spec.ts`  
- Create: `src/components/ProjectFormModal.vue`（或内联于列表页，优先独立组件）  
- Create: `src/views/ProjectManagement/ProjectOverview.vue`  
- Modify: `ProjectManagement.vue`、`router/index.ts`、`stores/index.ts`

## 7. 验收

- [ ] 列表为表格且展示 mock 两行  
- [ ] 弹窗可添加项目并出现在列表  
- [ ] 进入概览跳转正确；返回面包屑回列表  
- [ ] 无效 id 有错误态  
- [ ] `npm run lint` / `test` / `build` 通过  

---

*Approved verbally 2026-09-01 · Option A*
