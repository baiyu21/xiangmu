# 一期接口清单（流程图用）

> **日期**：2026-09-03  
> **范围**：当前前端已实现能力（含 mock）；**不含 AI 问答（二期）**  
> **说明**：仅列接口名称与用途，不含字段明细与实现

---

## 1. 认证 / 会话

| 序号 | 方法 | 接口 | 用途 |
|------|------|------|------|
| 1 | POST | `/api/auth/login` | 登录，返回 token + 用户资料 |
| 2 | POST | `/api/auth/register` | 注册（登录页有注册 tab） |
| 3 | POST | `/api/auth/logout` | 登出（可选；前端也可仅清本地 token） |
| 4 | GET | `/api/auth/me` | 获取当前登录用户资料 |

---

## 2. 个人中心

| 序号 | 方法 | 接口 | 用途 |
|------|------|------|------|
| 5 | GET | `/api/me/profile` | 获取个人资料 |
| 6 | PUT | `/api/me/profile` | 更新个人资料 |
| 7 | PUT | `/api/me/password` | 修改密码 |
| 8 | GET | `/api/me/access-token` | 获取已保存的访问令牌（Git 等） |
| 9 | PUT | `/api/me/access-token` | 保存/更新访问令牌 |

---

## 3. 用户管理

| 序号 | 方法 | 接口 | 用途 |
|------|------|------|------|
| 10 | GET | `/api/users` | 用户列表（可带 keyword 搜索） |
| 11 | POST | `/api/users` | 新建用户 |
| 12 | GET | `/api/users/{userId}` | 用户详情 |
| 13 | PUT | `/api/users/{userId}` | 更新用户 |
| 14 | DELETE | `/api/users/{userId}` | 删除/停用用户（可选） |

---

## 4. 项目管理

| 序号 | 方法 | 接口 | 用途 |
|------|------|------|------|
| 15 | GET | `/api/projects` | 项目列表（含映射文件数、修改次数等统计） |
| 16 | POST | `/api/projects` | 添加项目（仓库地址 + 分支） |
| 17 | GET | `/api/projects/{projectId}` | 项目详情 |
| 18 | POST | `/api/projects/{projectId}/sync` | 同步单个项目 |
| 19 | POST | `/api/projects/sync-all` | 全部项目同步 |

---

## 5. 文件映射

| 序号 | 方法 | 接口 | 用途 |
|------|------|------|------|
| 20 | GET | `/api/projects/{projectId}/stats` | 项目统计（文件数 / 修改次数 / 作者数 / 文档数） |
| 21 | GET | `/api/projects/{projectId}/files` | 映射文件列表（支持搜索、排序） |
| 22 | GET | `/api/projects/{projectId}/files/{fileId}` | 单文件详情（含修改记录列表） |

---

## 6. 修改记录 / 文档详情

| 序号 | 方法 | 接口 | 用途 |
|------|------|------|------|
| 23 | GET | `/api/projects/{projectId}/files/{fileId}/records` | 某文件的修改历史列表 |
| 24 | GET | `/api/projects/{projectId}/files/{fileId}/records/{docId}` | 单次修改详情（含 AI 简介、正文等） |
| 25 | GET | `/api/projects/{projectId}/files/{fileId}/records/{docId}/download` | 下载修改文档 `.md`（可选） |

---

## 7. 客户注释

| 序号 | 方法 | 接口 | 用途 |
|------|------|------|------|
| 26 | GET | `/api/projects/{projectId}/files/{fileId}/records/{docId}/comments` | 某次修改的客户注释列表 |
| 27 | POST | `/api/projects/{projectId}/files/{fileId}/records/{docId}/comments` | 发表客户注释 |

---

## 8. 二期（本期不做）

| 序号 | 方法 | 接口 | 用途 |
|------|------|------|------|
| — | — | AI 问答相关（chat / 网关配置 / 索引任务等） | **二期** |

---

## 流程图模块顺序建议

```
登录/注册 → 个人中心（资料/令牌）
         → 用户管理（CRUD）
         → 项目列表 → 添加项目 / 同步
                   → 文件映射（统计 + 文件列表 + 简略历史）
                   → 文档详情（完整历史 + AI简介 + 注释）
                   → 修改正文 / 下载
```
