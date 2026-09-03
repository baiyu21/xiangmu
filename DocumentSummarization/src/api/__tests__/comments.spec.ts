import { describe, expect, it } from 'vitest'
import { normalizeRecordComment, normalizeRecordComments } from '../modules/comments'

describe('normalizeRecordComments', () => {
  it('场景：解析注释列表', () => {
    const list = normalizeRecordComments({
      data: [
        {
          id: 1,
          content: '留言内容1',
          author: '王经理',
          role: 'customer',
          created_at: '2026-09-03 10:00:00',
        },
      ],
    })
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({
      id: '1',
      content: '留言内容1',
      author: '王经理',
      role: 'customer',
      at: '2026-09-03 10:00:00',
    })
  })

  it('场景：兼容 user 嵌套作者', () => {
    const item = normalizeRecordComment({
      id: '9',
      content: '建议加提示',
      user: { name: '李主管', role: 'customer' },
      createdAt: '2026-09-03',
    })
    expect(item?.author).toBe('李主管')
    expect(item?.at).toBe('2026-09-03')
  })
})
