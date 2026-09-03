import request from '../request'

export interface LoginPayload {
  username: string
  password: string
}

export interface RegisterPayload {
  username: string
  name: string
  email: string
  code: string
  password: string
}

export interface SendCodePayload {
  email: string
}

/** 后端可能返回的用户字段（兼容多种命名） */
export interface AuthUser {
  id?: number | string
  username?: string
  name?: string
  email?: string
  display_name?: string
  displayName?: string
}

export interface AuthSession {
  token: string
  username: string
  displayName: string
  email?: string
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

/** 从登录/注册响应中解析 token 与用户资料 */
export function normalizeAuthSession(raw: unknown, fallbackUsername = ''): AuthSession {
  const root = asRecord(raw) || {}
  const data = asRecord(root.data) || root
  const user = asRecord(data.user) || asRecord(root.user) || data

  const token = pickString(
    data.token,
    data.access_token,
    data.accessToken,
    root.token,
    root.access_token,
  )
  if (!token) {
    throw new Error('登录成功但未返回 token，请检查后端响应')
  }

  const username = pickString(user.username, data.username, root.username, fallbackUsername)
  const displayName = pickString(
    user.name,
    user.display_name,
    user.displayName,
    data.name,
    username,
    fallbackUsername,
  )
  const email = pickString(user.email, data.email, root.email) || undefined

  return { token, username: username || displayName || 'user', displayName: displayName || username || 'user', email }
}

export function login(payload: LoginPayload) {
  return request.post('/v1/auth/login', payload)
}

export function register(payload: RegisterPayload) {
  return request.post('/v1/auth/register', payload)
}

export function sendRegisterCode(payload: SendCodePayload) {
  return request.post('/v1/auth/send-code', payload)
}
