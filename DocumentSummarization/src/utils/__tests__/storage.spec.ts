import { describe, it, expect, beforeEach } from 'vitest'
import { clearToken, getToken, setToken } from '../storage'

describe('storage token helpers', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('场景：写入后可读回 token', () => {
    setToken('abc')
    expect(getToken()).toBe('abc')
  })

  it('场景：clear 后返回 null', () => {
    setToken('abc')
    clearToken()
    expect(getToken()).toBeNull()
  })
})
