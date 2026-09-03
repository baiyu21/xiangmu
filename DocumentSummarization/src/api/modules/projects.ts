import request from '../request'
import { parseProjectNameFromUrl } from '@/stores/project'

export interface CreateProjectPayload {
  repoUrl: string
  defaultBranch: string
}

export interface ProjectListItem {
  id: string
  name: string
  url: string
  branch: string
  mappedFiles: number
  changeCount: number
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
    pickString(row.name, row.repo_name, row.repoName, row.project_name, row.projectName) ||
    (url ? parseProjectNameFromUrl(url) : '') ||
    id
  const branch =
    pickString(row.defaultBranch, row.default_branch, row.branch, row.default_branch_name) ||
    'main'

  return {
    id,
    name,
    url,
    branch,
    mappedFiles: pickNumber(
      row.mappedFiles,
      row.mapped_files,
      row.file_count,
      row.files_count,
      row.mapped_file_count,
    ),
    changeCount: pickNumber(
      row.changeCount,
      row.change_count,
      row.changes_count,
      row.modification_count,
    ),
  }
}

export function normalizeProjectList(raw: unknown): ProjectListItem[] {
  // 创建接口可能直接返回单个对象
  const single = normalizeProjectItem(raw)
  if (single && !Array.isArray(raw)) {
    const root = asRecord(raw)
    const looksLikeList =
      root &&
      (Array.isArray(root) ||
        Array.isArray(root.data) ||
        Array.isArray(root.list) ||
        Array.isArray(root.projects) ||
        (asRecord(root.data) &&
          (Array.isArray(asRecord(root.data)?.data) ||
            Array.isArray(asRecord(root.data)?.list) ||
            Array.isArray(asRecord(root.data)?.projects))))
    if (!looksLikeList && root && ('id' in root || 'repoUrl' in root || 'repo_url' in root)) {
      return [single]
    }
  }

  return extractArray(raw)
    .map((item) => normalizeProjectItem(item))
    .filter((item): item is ProjectListItem => item != null)
}

export function fetchProjects() {
  return request.get('/v1/projects')
}

export function createProject(payload: CreateProjectPayload) {
  return request.post('/v1/projects', payload)
}

export interface SyncProjectPayload {
  github_token: string
}

/** 同步单个项目仓库（可能较慢） */
export function syncProject(id: string | number, payload: SyncProjectPayload) {
  return request.post(`/v1/projects/${id}/sync`, payload, { timeout: 120000 })
}
