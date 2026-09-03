import { describe, expect, it } from 'vitest'
import { normalizeUserList, roleLabel } from '../modules/users'

describe('normalizeUserList', () => {
  it('场景：解析用户数组', () => {
    const rows = normalizeUserList([
      { id: 4, username: 'wwjtwo', name: '王文杰', email: 'a@b.com', role: 'customer' },
    ])
    expect(rows).toHaveLength(1)
    expect(rows[0]?.id).toBe(4)
    expect(rows[0]?.name).toBe('王文杰')
    expect(rows[0]?.role).toBe('customer')
  })

  it('场景：解析 data 包装', () => {
    const rows = normalizeUserList({
      data: [{ id: '1', username: 'admin', email: 'x@y.com', role: 'admin' }],
    })
    expect(rows[0]?.id).toBe(1)
    expect(rows[0]?.username).toBe('admin')
  })
})

describe('roleLabel', () => {
  it('场景：customer 显示为客户', () => {
    expect(roleLabel('customer')).toBe('客户')
  })
})
