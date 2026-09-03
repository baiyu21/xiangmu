import request from '../request'
import type { ChangeDoc, MappedFile } from '@/utils/fileMap'

export interface CreateProjectPayload {
  repoUrl: string
  defaultBranch: string
}

export interface ProjectStats {
  files: number
  changes: number
  authors: number
  docs: number
}

export interface ProjectListItem {
  id: string
  name: string
  url: string
  branch: string
  mappedFiles: number
  changeCount: number
  /** 详情接口可能带回的完整统计 */
  stats?: ProjectStats
  lastSyncAt?: string
}

export interface ProjectDetail extends ProjectListItem {
  files: MappedFile[]
}

export interface SyncProjectPayload {
  github_token: string
}

type LooseRecord = Record<string, unknown>

function asRecord(value: unknown): LooseRecord | null {
  return value && typeof value === 'object' ? (value as LooseRecord) : null
}

function pickString(...candidates: unknown[]): string {
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim()
  }
  return ''
}

function pickId(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'string' && value.trim()) return value.trim()
  return null
}

function pickNumber(...candidates: unknown[]): number {
  for (const c of candidates) {
    if (typeof c === 'number' && Number.isFinite(c)) return c
    if (typeof c === 'string' && c.trim() && !Number.isNaN(Number(c))) {
      return Number(c)
    }
  }
  return 0
}

function nameFromUrl(url: string): string {
  const cleaned = url.trim().replace(/\/+$/, '')
  const segment = cleaned.split('/').pop() || 'project'
  return segment.replace(/\.git$/i, '') || 'project'
}

function extractArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw
  const root = asRecord(raw)
  if (!root) return []
  if (Array.isArray(root.data)) return root.data
  const data = asRecord(root.data)
  if (data) {
    if (Array.isArray(data.data)) return data.data
    if (Array.isArray(data.list)) return data.list
    if (Array.isArray(data.items)) return data.items
    if (Array.isArray(data.projects)) return data.projects
  }
  if (Array.isArray(root.list)) return root.list
  if (Array.isArray(root.projects)) return root.projects
  return []
}

function looksLikeProjectList(raw: unknown): boolean {
  if (Array.isArray(raw)) return true
  const root = asRecord(raw)
  if (!root) return false
  if (Array.isArray(root.data) || Array.isArray(root.list) || Array.isArray(root.projects)) {
    return true
  }
  const data = asRecord(root.data)
  return Boolean(
    data &&
      (Array.isArray(data.data) ||
        Array.isArray(data.list) ||
        Array.isArray(data.items) ||
        Array.isArray(data.projects)),
  )
}

function normalizeStats(row: LooseRecord): ProjectStats | undefined {
  const nested = asRecord(row.stats) || asRecord(row.statistics)
  const files = pickNumber(
    nested?.files,
    nested?.file_count,
    nested?.mapped_files,
    nested?.mappedFiles,
    nested?.documents,
    row.mappedFiles,
    row.mapped_files,
    row.file_count,
    row.files_count,
    row.documents,
  )
  const changes = pickNumber(
    nested?.changes,
    nested?.change_count,
    nested?.changes_count,
    nested?.modification_count,
    row.changeCount,
    row.change_count,
    row.changes,
  )
  const authors = pickNumber(
    nested?.authors,
    nested?.author_count,
    nested?.authors_count,
    nested?.contributors,
    row.authors,
    row.author_count,
  )
  const docs = pickNumber(
    nested?.docs,
    nested?.documents,
    nested?.document_count,
    nested?.related_docs,
    row.docs,
    row.documents,
    row.document_count,
  )

  if (!nested && files === 0 && changes === 0 && authors === 0 && docs === 0) {
    return undefined
  }

  return { files, changes, authors, docs }
}

function normalizeComment(raw: unknown) {
  const row = asRecord(raw)
  if (!row) return null
  const id = pickId(row.id) || `cn-${Date.now()}`
  const content = pickString(row.content, row.body, row.comment)
  if (!content) return null
  return {
    id,
    author: pickString(row.author, row.user_name, row.username, row.name) || '客户',
    role: pickString(row.role, 'customer') || 'customer',
    content,
    at: pickString(row.at, row.created_at, row.createdAt, row.time) || '',
  }
}

function normalizeChangeDoc(raw: unknown): ChangeDoc | null {
  const row = asRecord(raw)
  if (!row) return null
  const id = pickId(row.id) || pickString(row.code, row.record_code)
  if (!id) return null

  const commentsRaw =
    (Array.isArray(row.clientComments) && row.clientComments) ||
    (Array.isArray(row.client_comments) && row.client_comments) ||
    (Array.isArray(row.comments) && row.comments) ||
    []

  return {
    id,
    title: pickString(row.title, row.name, row.summary, id) || id,
    at: pickString(row.at, row.changed_at, row.created_at, row.createdAt, row.time) || '',
    author: pickString(row.author, row.user_name, row.username, row.committer) || '',
    summary: pickString(row.summary, row.description, row.desc, row.title) || '',
    aiBrief: pickString(row.aiBrief, row.ai_brief, row.ai_summary, row.brief) || undefined,
    clientComments: commentsRaw
      .map((c) => normalizeComment(c))
      .filter((c): c is NonNullable<typeof c> => c != null),
  }
}

export function normalizeMappedFile(raw: unknown, projectId: string): MappedFile | null {
  const row = asRecord(raw)
  if (!row) return null

  const id = pickId(row.id) || pickString(row.file_id, row.uuid)
  const path = pickString(row.path, row.file_path, row.filepath, row.relative_path, row.name)
  if (!id || !path) return null

  const docsRaw =
    (Array.isArray(row.docs) && row.docs) ||
    (Array.isArray(row.changes) && row.changes) ||
    (Array.isArray(row.records) && row.records) ||
    (Array.isArray(row.history) && row.history) ||
    []

  const docs = docsRaw
    .map((d) => normalizeChangeDoc(d))
    .filter((d): d is ChangeDoc => d != null)

  const authorsFromField = Array.isArray(row.authors)
    ? row.authors.filter((a): a is string => typeof a === 'string' && Boolean(a.trim()))
    : []
  const authorsFromDocs = [...new Set(docs.map((d) => d.author).filter(Boolean))]
  const authors = authorsFromField.length ? authorsFromField : authorsFromDocs

  const lastDoc = [...docs].sort((a, b) => (a.at < b.at ? 1 : -1))[0]

  return {
    id,
    projectId,
    module: pickString(row.module, row.module_name, row.moduleName, row.category, '未分类') || '未分类',
    path,
    authors,
    lastAt: pickString(row.lastAt, row.last_at, row.updated_at, row.updatedAt, lastDoc?.at) || '',
    lastAuthor:
      pickString(row.lastAuthor, row.last_author, row.updated_by, lastDoc?.author) || '',
    aiBrief: pickString(row.aiBrief, row.ai_brief, row.ai_summary, row.brief) || undefined,
    docs,
  }
}

export function normalizeProjectItem(raw: unknown): ProjectListItem | null {
  const row = asRecord(raw)
  if (!row) return null

  const id = pickId(row.id)
  if (id == null) return null

  const url = pickString(
    row.repoUrl,
    row.repo_url,
    row.url,
    row.git_url,
    row.gitUrl,
    row.repository_url,
  )
  const name =
    pickString(
      row.name,
      row.project_code,
      row.projectCode,
      row.repo_name,
      row.repoName,
      row.project_name,
      row.projectName,
    ) ||
    (url ? nameFromUrl(url) : '') ||
    id
  const branch =
    pickString(row.defaultBranch, row.default_branch, row.branch, row.default_branch_name) ||
    'main'

  const stats = normalizeStats(row)
  const mappedFiles = stats?.files ?? pickNumber(row.mappedFiles, row.mapped_files, row.file_count)
  const changeCount = stats?.changes ?? pickNumber(row.changeCount, row.change_count, row.changes)

  return {
    id,
    name,
    url,
    branch,
    mappedFiles,
    changeCount,
    stats,
    lastSyncAt: pickString(row.last_sync_at, row.lastSyncAt, row.synced_at) || undefined,
  }
}

export function normalizeProjectList(raw: unknown): ProjectListItem[] {
  if (!looksLikeProjectList(raw)) {
    const single = normalizeProjectItem(raw)
    if (single) return [single]
  }

  return extractArray(raw)
    .map((item) => normalizeProjectItem(item))
    .filter((item): item is ProjectListItem => item != null)
}

function extractFileArray(row: LooseRecord): unknown[] {
  const candidates = [
    row.files,
    row.mapped_files,
    row.mappedFiles,
    row.file_list,
    row.documents,
    row.docs,
  ]
  for (const c of candidates) {
    if (Array.isArray(c)) return c
  }
  return []
}

/** 解析 GET /projects/{id} 详情（含文件列表，字段尽量兼容） */
export function normalizeProjectDetail(raw: unknown, fallbackProjectId = ''): ProjectDetail | null {
  const root = asRecord(raw) || {}
  const data = asRecord(root.data) || root
  const base = normalizeProjectItem(data)
  if (!base) return null

  const projectId = base.id || fallbackProjectId
  const files = extractFileArray(data)
    .map((item) => normalizeMappedFile(item, projectId))
    .filter((item): item is MappedFile => item != null)

  // 若详情未给完整 stats，用文件列表回算补齐
  let stats = base.stats
  if (!stats || (files.length > 0 && stats.files === 0 && stats.changes === 0)) {
    const authors = new Set<string>()
    let changes = 0
    for (const f of files) {
      f.authors.forEach((a) => authors.add(a))
      changes += f.docs.length
    }
    stats = {
      files: files.length || base.mappedFiles,
      changes: changes || base.changeCount,
      authors: authors.size,
      docs: changes || base.stats?.docs || 0,
    }
  }

  return {
    ...base,
    mappedFiles: stats.files,
    changeCount: stats.changes,
    stats,
    files,
  }
}

export function fetchProjects() {
  return request.get('/v1/projects')
}

export function fetchProject(id: string | number) {
  return request.get(`/v1/projects/${id}`)
}

export function createProject(payload: CreateProjectPayload) {
  return request.post('/v1/projects', payload)
}

/** 同步单个项目仓库（可能较慢） */
export function syncProject(id: string | number, payload: SyncProjectPayload) {
  return request.post(`/v1/projects/${id}/sync`, payload, { timeout: 120000 })
}
