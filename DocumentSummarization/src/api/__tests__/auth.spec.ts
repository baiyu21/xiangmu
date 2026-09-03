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
