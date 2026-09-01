import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '../user'

describe('useUserStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('场景：setSession 后 isAuthenticated 为 true', () => {
    const store = useUserStore()
    store.setSession({
      token: 't-1',
      username: 'demo',
      displayName: 'Demo',
    })
    expect(store.isAuthenticated).toBe(true)
    expect(store.profile?.username).toBe('demo')
    expect(localStorage.getItem('ds_token')).toBe('t-1')
  })

  it('场景：clearAuth 后会话清空', () => {
    const store = useUserStore()
    store.setSession({
      token: 't-1',
      username: 'demo',
      displayName: 'Demo',
    })
    store.clearAuth()
    expect(store.isAuthenticated).toBe(false)
    expect(store.profile).toBeNull()
    expect(localStorage.getItem('ds_token')).toBeNull()
  })
})
