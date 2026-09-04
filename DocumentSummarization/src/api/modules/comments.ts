import request from '../request'
import type { ClientComment } from '@/utils/fileMap'

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
    if (Array.isArray(data.comments)) return data.comments
  }
  if (Array.isArray(root.list)) return root.list
  if (Array.isArray(root.comments)) return root.comments
  return []
}

export interface CreateCommentPayload {
  content: string
}

export function normalizeRecordComment(raw: unknown): ClientComment | null {
  const row = asRecord(raw)
  if (!row) return null

  const id = pickId(row.id) || pickString(row.uuid)
  const content = pickString(row.content, row.body, row.comment, row.message)
  if (!id || !content) return null

  const user = asRecord(row.user) || asRecord(row.author_user) || null
  const author =
    pickString(
      row.author,
      row.user_name,
      row.username,
      row.name,
      user?.name,
      user?.username,
      user?.display_name,
    ) || '用户'

  return {
    id,
    author,
    role: pickString(row.role, user?.role, 'customer') || 'customer',
    content,
    at: pickString(
      row.at,
      row.created_at,
      row.createdAt,
      row.updated_at,
      row.time,
      row.date,
    ),
  }
}

export function normalizeRecordComments(raw: unknown): ClientComment[] {
  return extractArray(raw)
    .map((item) => normalizeRecordComment(item))
    .filter((item): item is ClientComment => item != null)
}

/** 获取变更项下的留言（路径参数为 change_items 主键 changeItemId） */
export function fetchRecordComments(changeItemId: string | number) {
  return request.get(`/v1/records/${changeItemId}/comments`)
}

/** 发表变更项留言（路径参数为 change_items 主键 changeItemId） */
export function createRecordComment(
  changeItemId: string | number,
  payload: CreateCommentPayload,
) {
  const content = payload.content?.trim()
  if (!content) {
    return Promise.reject(new Error('注释内容不能为空'))
  }
  return request.post(`/v1/records/${changeItemId}/comments`, { content })
}
