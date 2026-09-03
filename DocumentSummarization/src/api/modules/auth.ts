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

/** 更新个人资料（字段均可选，按需提交） */
export interface UpdateProfileInfoPayload {
  username?: string
  name?: string
  email?: string
  role?: string
}

/** 修改密码（邮箱验证码） */
export interface UpdatePasswordPayload {
  password: string
  password_confirmation: string
  code: string
}

export type UpdateProfilePayload = UpdateProfileInfoPayload | UpdatePasswordPayload

/** 后端可能返回的用户字段（兼容多种命名） */
export interface AuthUser {
  id?: number | string
  username?: string
  name?: string
  email?: string
  display_name?: string
  displayName?: string
  role?: string
  git_name?: string
  gitName?: string
}

export interface AuthSession {
  token: string
  username: string
  displayName: string
  email?: string
}

export interface NormalizedProfile {
  username: string
  displayName: string
  email?: string
  role?: string
  gitName?: string
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

/** 从 GET/PUT profile 响应解析用户资料 */
export function normalizeUserProfile(raw: unknown, fallback: Partial<NormalizedProfile> = {}): NormalizedProfile {
  const root = asRecord(raw) || {}
  const data = asRecord(root.data) || asRecord(root.user) || root
  const user = asRecord(data.user) || data

  const username = pickString(user.username, data.username, fallback.username) || 'user'
  const displayName =
    pickString(user.name, user.display_name, user.displayName, data.name, fallback.displayName, username) ||
    username
  const email = pickString(user.email, data.email, fallback.email) || undefined
  const role = pickString(user.role, data.role, fallback.role) || undefined
  const gitName = pickString(user.git_name, user.gitName, data.git_name, fallback.gitName) || undefined

  return { username, displayName, email, role, gitName }
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

/** 修改密码发验证码（需登录；服务端按当前用户邮箱发送） */
export function sendPasswordChangeCode() {
  return request.post('/v1/auth/send-password-change-code')
}

export function getUserProfile() {
  return request.get('/v1/auth/user/profile')
}

export function updateUserProfile(payload: UpdateProfilePayload) {
  return request.put('/v1/auth/user/profile', payload)
}

export interface UpdateGithubTokenPayload {
  github_token: string
}

/** 从 GET/PUT token 响应解析 GitHub Token 明文或预览字段 */
export function normalizeGithubToken(raw: unknown): string {
  if (typeof raw === 'string' && raw.trim()) return raw.trim()

  const root = asRecord(raw) || {}
  const data = asRecord(root.data) || root
  const user = asRecord(data.user) || asRecord(root.user)

  return pickString(
    data.token_preview,
    data.tokenPreview,
    data.github_token,
    data.githubToken,
    data.access_token,
    data.accessToken,
    data.token,
    user?.github_token,
    user?.githubToken,
    root.token_preview,
    root.tokenPreview,
    root.github_token,
    root.githubToken,
    root.token,
  )
}

/** 是否已配置 Token（兼容 has_token / 有预览值） */
export function hasGithubTokenConfigured(raw: unknown): boolean {
  const root = asRecord(raw) || {}
  const data = asRecord(root.data) || root
  if (typeof data.has_token === 'boolean') return data.has_token
  if (typeof data.hasToken === 'boolean') return data.hasToken
  return Boolean(normalizeGithubToken(raw))
}

/** 是否为掩码展示（不可用于同步请求） */
export function isMaskedGithubToken(token: string): boolean {
  const t = token.trim()
  if (!t) return true
  // 典型掩码：含 * 或 •，且不是正常 pat 明文
  if (/[*•●]+/.test(t)) return true
  return false
}

export function getGithubToken() {
  return request.get('/v1/auth/user/token')
}

export function updateGithubToken(payload: UpdateGithubTokenPayload) {
  return request.put('/v1/auth/user/token', payload)
}
