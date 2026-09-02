# 项目管理板块 · 前端字段说明

> **日期**：2026-09-02  
> **范围**：项目管理整条链路（列表 → 文件映射 → 文档详情 → 修改正文）  
> **依据**：当前前端 `stores` / `views` / mock 实际使用字段  
> **用途**：后端接口设计、联调对齐

---

## 页面与路由对照

| 页面 | 路由 | 主要数据 |
|------|------|----------|
| 项目列表 | `/app/projects` | Project 列表 |
| 添加项目 | 弹窗 | 创建请求 |
| 文件映射 | `/app/projects/:id` | Project + MappedFile[] + 统计 |
| 文档详情 | `/app/projects/:id/files/:fileId` | MappedFile + ChangeDoc[] + 发表注释 |
| 修改文档正文 | `/app/projects/:id/files/:fileId/records/:docId` | ChangeDoc（含正文/下载） |

路径参数：

| 参数 | 含义 | 类型 |
|------|------|------|
| `id` | 项目 ID（`projectId`） | `string` |
| `fileId` | 映射文件 ID | `string` |
| `docId` | 修改记录 ID | `string` |

---

## 1. 项目（Project）

### 1.1 列表 / 详情展示字段

| 字段 | 类型 | 必填 | 说明 | 使用页面 |
|------|------|------|------|----------|
| `id` | `string` | ✅ | 项目唯一 ID，用于路由与关联 | 全链路 |
| `name` | `string` | ✅ | 项目名称（可从仓库 URL 解析） | 列表卡片、面包屑 |
| `url` | `string` | ✅ | Git 仓库地址 | 列表卡片 |
| `branch` | `string` | ✅ | 默认分支，缺省 `main` | 列表卡片 tag |
| `mappedFiles` | `number` | ✅ | 映射文件数（可后端聚合） | 列表卡片统计 |
| `changeCount` | `number` | ✅ | 修改次数（可后端聚合） | 列表卡片统计 |

> 当前前端在有文件映射数据时，会用文件侧统计覆盖 `mappedFiles` / `changeCount`。后端也可只返回聚合值，或由文件接口派生。

### 1.2 创建项目（请求体）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `url` | `string` | ✅ | 仓库地址，如 `https://github.com/org/repo.git` |
| `branch` | `string` | ❌ | 默认分支；空则后端按 `main` |

### 1.3 创建项目（响应）

返回完整 `Project`（至少含上表 1.1 全部字段；新建时 `mappedFiles` / `changeCount` 可为 `0`）。

### 1.4 建议接口

```text
GET  /api/projects
POST /api/projects                    # body: { url, branch? }
GET  /api/projects/{projectId}
POST /api/projects/{projectId}/sync   # 同步（前端已有按钮，当前 mock）
POST /api/projects/sync-all           # 全部同步（可选）
```

---

## 2. 映射文件（MappedFile）

用于：**文件映射页**表格 / 树，以及进入文档详情的入口数据。

| 字段 | 类型 | 必填 | 说明 | 使用处 |
|------|------|------|------|--------|
| `id` | `string` | ✅ | 文件 ID（如 `f1`） | 路由 `fileId`、树节点 |
| `projectId` | `string` | ✅ | 所属项目 ID | 隔离过滤 |
| `module` | `string` | ✅ | 业务模块名（如「合同模块」） | 模块模式树 / 筛选 / 表格 |
| `path` | `string` | ✅ | 仓库内相对路径 | 表格、搜索、仓库模式树 |
| `authors` | `string[]` | ✅ | 历史修改人列表 | 表格「修改人」、搜索 |
| `lastAt` | `string` | ✅ | 最近修改时间，建议格式 `YYYY-MM-DD HH:mm` | 表格、按时间排序 |
| `lastAuthor` | `string` | ✅ | 最近修改人 | 表格展示 |
| `aiBrief` | `string` | ❌ | 文件级 AI 通俗简介 | 文档详情页头部 |
| `docs` | `ChangeDoc[]` | ✅ | 关联修改记录列表 | 映射页次数、详情时间线 |

### 2.1 前端派生（后端可不单独返回）

| 派生项 | 计算方式 | 使用处 |
|--------|----------|--------|
| 修改次数 | `docs.length` | 统计卡片、表格列、树 count |
| 文件名 | `path` 最后一段 | 面包屑、树叶子 |
| 目录 | `path` 去掉文件名 | 表格路径展示 |

### 2.2 项目统计（可由后端聚合，或前端用文件列表算）

| 字段 | 类型 | 说明 |
|------|------|------|
| `files` | `number` | 映射文件数 |
| `changes` | `number` | 修改总次数（所有文件 `docs` 之和） |
| `authors` | `number` | 去重作者数 |
| `docs` | `number` | 修改文档条数（当前与 `changes` 同口径） |

### 2.3 建议接口

```text
GET /api/projects/{projectId}/files
GET /api/projects/{projectId}/files/{fileId}
GET /api/projects/{projectId}/stats   # 可选；无则前端用 files 聚合
```

查询参数（可选，前端当前本地过滤，后端也可代做）：

| 参数 | 类型 | 说明 |
|------|------|------|
| `q` | `string` | 搜 path / authors / module |
| `module` | `string` | 按模块过滤 |
| `sort` | `count \| recent \| path` | 排序 |

---

## 3. 修改记录（ChangeDoc）

用于：**文档详情**左侧时间线 + 右侧 AI 简介；**修改正文页**主内容。

| 字段 | 类型 | 必填 | 说明 | 使用处 |
|------|------|------|------|--------|
| `id` | `string` | ✅ | 修改记录 ID（如 `REC-001`） | 路由 `docId`、选中态 |
| `title` | `string` | ✅ | 修改标题 | 时间线、正文页标题 |
| `at` | `string` | ✅ | 修改时间 `YYYY-MM-DD HH:mm` | 时间线、排序、简介头 |
| `author` | `string` | ✅ | 修改人 | 时间线、简介头、下载 md |
| `summary` | `string` | ✅ | 技术摘要（短） | 时间线、AI 未就绪时的回退文案 |
| `aiBrief` | `string` | ❌ | AI 通俗说明（长） | 详情右侧、正文页、下载 md |
| `clientComments` | `ClientComment[]` | ❌ | 客户注释列表 | 详情右侧、正文页、下载 md |
| `content` / `body` | `string` | ❌* | 修改文档正文（Markdown） | **正文页正式渲染**（当前前端用本地拼装 md，正式版需此字段） |
| `diff` | `string` | ❌ | 代码 diff（可选） | 正文页增强 |

\* 当前前端下载的 `.md` 由已有字段本地拼装；对接后端后建议提供完整 `content`（Markdown）。

### 3.1 建议接口

```text
GET  /api/projects/{projectId}/files/{fileId}/records
GET  /api/projects/{projectId}/files/{fileId}/records/{docId}
GET  /api/projects/{projectId}/files/{fileId}/records/{docId}/download  # 返回 .md 文件流（可选）
```

---

## 4. 客户注释（ClientComment）

用于：文档详情发表注释、列表展示；正文页展示。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `string` | ✅ | 注释 ID |
| `author` | `string` | ✅ | 发表人显示名 |
| `role` | `string` | ✅ | 角色标识，如 `customer`（前端展示可用） |
| `content` | `string` | ✅ | 注释正文 |
| `at` | `string` | ✅ | 发表时间 `YYYY-MM-DD HH:mm` |

### 4.1 发表注释（请求体）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `content` | `string` | ✅ | 注释内容（trim 后非空） |

> `author` / `role` / `at` / `id` 建议由后端根据登录态生成，前端可不传。

### 4.2 建议接口

```text
POST /api/projects/{projectId}/files/{fileId}/records/{docId}/comments
     # body: { content }
     # response: ClientComment
```

---

## 5. 实体关系（简图）

```text
Project (1)
  └── MappedFile (N)          # projectId
        └── ChangeDoc (N)     # docs[]
              └── ClientComment (N)  # clientComments[]
```

---

## 6. 按页面汇总「最小必需字段」

### 6.1 项目列表页

**响应列表项最小集：**

```json
{
  "id": "rd-xmz",
  "name": "rd-xmz",
  "url": "https://github.com/rd/xmz.git",
  "branch": "main",
  "mappedFiles": 6,
  "changeCount": 18
}
```

**创建请求：**

```json
{
  "url": "https://github.com/org/repo.git",
  "branch": "main"
}
```

### 6.2 文件映射页

**项目信息：** `id`, `name`  
**文件列表项最小集：**

```json
{
  "id": "f1",
  "projectId": "rd-xmz",
  "module": "合同模块",
  "path": "src/views/contract/List.vue",
  "authors": ["demo-user", "alice"],
  "lastAt": "2026-09-01 09:48",
  "lastAuthor": "demo-user",
  "docs": [{ "id": "REC-001" }]
}
```

> 映射页表格只需知道 `docs.length`；详情页需要完整 `docs`。列表接口可返回精简 `docs`（仅 id）或直接返回 `changeCount` 字段以减负。

**推荐列表扩展（减负）：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `changeCount` | `number` | 直接返回修改次数，避免映射页拉全量 docs |

### 6.3 文档详情页

**文件：** `id`, `path`, `module`, `aiBrief?`, `docs[]`（完整）  
**每条 ChangeDoc：** `id`, `title`, `at`, `author`, `summary`, `aiBrief?`, `clientComments?`  
**发表注释请求：** `{ "content": "..." }`

### 6.4 修改文档正文页

**ChangeDoc：** `id`, `title`, `at`, `author`, `summary`, `aiBrief?`, `clientComments?`  
**关联文件：** `path`  
**建议新增：** `content`（完整 Markdown 正文）

---

## 7. 类型定义（与前端一致，可供后端对照）

```typescript
interface Project {
  id: string
  name: string
  url: string
  branch: string
  mappedFiles: number
  changeCount: number
}

interface ClientComment {
  id: string
  author: string
  role: string
  content: string
  at: string
}

interface ChangeDoc {
  id: string
  title: string
  at: string
  author: string
  summary: string
  aiBrief?: string
  clientComments?: ClientComment[]
  content?: string // 建议后端补充：修改文档 Markdown 正文
}

interface MappedFile {
  id: string
  projectId: string
  module: string
  path: string
  authors: string[]
  lastAt: string
  lastAuthor: string
  aiBrief?: string
  docs: ChangeDoc[]
  changeCount?: number // 建议列表接口补充
}

interface ProjectStats {
  files: number
  changes: number
  authors: number
  docs: number
}
```

---

## 8. 前端本地 UI 状态（无需后端）

| 字段 | 说明 |
|------|------|
| `mode` | `module` \| `repo` 树模式 |
| `scope` | 树选中范围 `all` / `mod:*` / `dir:*` / `file:*` |
| `query` | 搜索关键字 |
| `sort` | `count` \| `recent` \| `path` |
| `selectedDocId` | 详情页当前选中的修改记录 |
| `commentInput` | 注释输入草稿 |

---

## 9. 备注

1. 时间字段统一建议：`YYYY-MM-DD HH:mm`（与当前 mock 一致）；若后端用 ISO8601，前端可格式化。
2. 项目隔离：所有文件 / 记录 / 注释接口路径必须带 `projectId`，并做权限校验。
3. AI 相关字段（`aiBrief`）允许为空；前端已有「尚未就绪」回退文案。
4. 同步按钮（单项目 / 全部）当前为 mock，后端需提供对应任务接口时再对齐请求/响应字段。

---

*项目管理前端字段 · 2026-09-02*
