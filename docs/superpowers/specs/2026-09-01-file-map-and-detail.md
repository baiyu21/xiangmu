# 文件映射 + 文档详情 + 修改文档正文

> **日期**：2026-09-01  
> **原型**：`index.html` v-overview / v-file / v-record  
> **范围**：映射页 + 文档详情（含注释）+ 修改文档正文壳（下载 .md）  
> **约束**：本地 mock，不接 API

## 路由

- `/app/projects/:id` → 文件映射
- `/app/projects/:id/files/:fileId` → 文档详情
- `/app/projects/:id/files/:fileId/records/:docId` → 修改文档正文

---
*Extended 2026-09-01 · record page*
