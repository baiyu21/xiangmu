import { describe, expect, it } from 'vitest'
import { normalizeAuthSession } from '../modules/auth'

describe('normalizeAuthSession', () => {
  it('场景：解析 data.token + data.user', () => {
    const session = normalizeAuthSession({
      token: 'abc',
      user: { username: 'user', name: '展示名', email: 'a@b.com' },
    })
    expect(session.token).toBe('abc')
    expect(session.username).toBe('user')
    expect(session.displayName).toBe('展示名')
    expect(session.email).toBe('a@b.com')
  })

  it('场景：兼容 access_token', () => {
    const session = normalizeAuthSession(
      { access_token: 'tok-2', username: 'u2' },
      'fallback',
    )
    expect(session.token).toBe('tok-2')
    expect(session.username).toBe('u2')
  })

  it('场景：无 token 时抛错', () => {
    expect(() => normalizeAuthSession({ user: { name: 'x' } })).toThrow(/token/)
  })
})

describe('normalizeUserProfile', () => {
  it('场景：解析 name / email', async () => {
    const { normalizeUserProfile } = await import('../modules/auth')
    const profile = normalizeUserProfile({
      username: 'user',
      name: '王文杰',
      email: 'a@b.com',
      role: 'admin',
    })
    expect(profile.displayName).toBe('王文杰')
    expect(profile.email).toBe('a@b.com')
    expect(profile.role).toBe('admin')
  })
})

describe('normalizeGithubToken', () => {
  it('场景：解析 github_token', async () => {
    const { normalizeGithubToken } = await import('../modules/auth')
    expect(normalizeGithubToken({ github_token: 'ghp_xxx' })).toBe('ghp_xxx')
    expect(normalizeGithubToken({ data: { github_token: 'pat_1' } })).toBe('pat_1')
  })
})
