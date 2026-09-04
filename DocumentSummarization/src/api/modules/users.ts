import request from '../request'

export interface CreateUserPayload {
  username: string
  name: string
  email: string
  role: string
  password: string
}

export interface UpdateUserPayload {
  name?: string
  email?: string
  role?: string
  username?: string
  password?: string
}

export interface UserListItem {
  id: number
  username: string
  name: string
  email: string
  role: string
  gitName?: string
  projects?: string
  status?: string
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

function pickId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) {
    return Number(value)
  }
  return null
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
    if (Array.isArray(data.users)) return data.users
  }
  if (Array.isArray(root.list)) return root.list
  if (Array.isArray(root.users)) return root.users
  return []
}

/** API role → 列表展示文案 */
export const ROLE_LABEL: Record<string, string> = {
  admin: '管理员',
  customer: '客户',
  member: '项目成员',
}

export function roleLabel(role: string): string {
  return ROLE_LABEL[role] || role
}

export function normalizeUserItem(raw: unknown): UserListItem | null {
  const row = asRecord(raw)
  if (!row) return null
  const id = pickId(row.id)
  if (id == null) return null

  const username = pickString(row.username, row.user_name)
  const name = pickString(row.name, row.display_name, row.displayName, username)
  const email = pickString(row.email)
  const role = pickString(row.role, 'customer') || 'customer'
  const gitName = pickString(row.git_name, row.gitName, username) || undefined
  const projects = pickString(row.projects, row.project_names)

  // 状态：兼容 status/state/is_active/enabled 等
  let status = '启用'
  if (typeof row.is_active === 'boolean') {
    status = row.is_active ? '启用' : '停用'
  } else if (typeof row.enabled === 'boolean') {
    status = row.enabled ? '启用' : '停用'
  } else {
    const statusRaw = pickString(row.status, row.state)
    if (
      statusRaw === '0' ||
      statusRaw === 'disabled' ||
      statusRaw === '停用' ||
      statusRaw === 'inactive'
    ) {
      status = '停用'
    } else if (statusRaw === '启用' || statusRaw === 'active' || statusRaw === '1' || !statusRaw) {
      status = '启用'
    } else {
      status = statusRaw
    }
  }

  return {
    id,
    username: username || name || String(id),
    name: name || username || String(id),
    email,
    role,
    gitName,
    projects: projects || undefined,
    status,
  }
}

export function normalizeUserList(raw: unknown): UserListItem[] {
  return extractArray(raw)
    .map((item) => normalizeUserItem(item))
    .filter((item): item is UserListItem => item != null)
}

export function fetchUsers() {
  return request.get('/v1/users')
}

export function createUser(payload: CreateUserPayload) {
  return request.post('/v1/users', payload)
}

export function updateUser(id: number | string, payload: UpdateUserPayload) {
  return request.put(`/v1/users/${id}`, payload)
}

/** 切换启用 / 停用 */
export function toggleUser(id: number | string) {
  return request.patch(`/v1/users/${id}/toggle`)
}

/** 批量删除用户（单删也走此接口，传一个 id） */
export function deleteUsersBatch(userIds: Array<number | string>) {
  const ids = userIds
    .map((id) => (typeof id === 'number' ? id : Number(id)))
    .filter((id) => Number.isFinite(id))
  if (!ids.length) {
    return Promise.reject(new Error('请选择要删除的用户'))
  }
  return request.delete('/v1/users/batch', { data: { user_ids: ids } })
}
