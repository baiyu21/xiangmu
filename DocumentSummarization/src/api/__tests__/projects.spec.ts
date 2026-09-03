import { describe, expect, it } from 'vitest'
import { normalizeProjectItem, normalizeProjectList } from '../modules/projects'

describe('normalizeProjectItem', () => {
  it('场景：解析 camelCase 字段', () => {
    const item = normalizeProjectItem({
      id: 3,
      name: 'xiangmu',
      repoUrl: 'https://github.com/baiyu21/xiangmu.git',
      defaultBranch: 'main',
      mappedFiles: 2,
      changeCount: 5,
    })
    expect(item).toEqual({
      id: '3',
      name: 'xiangmu',
      url: 'https://github.com/baiyu21/xiangmu.git',
      branch: 'main',
      mappedFiles: 2,
      changeCount: 5,
    })
  })

  it('场景：兼容 snake_case 并从 URL 推导名', () => {
    const item = normalizeProjectItem({
      id: '9',
      repo_url: 'https://github.com/org/demo.git',
      default_branch: 'develop',
    })
    expect(item?.name).toBe('demo')
    expect(item?.branch).toBe('develop')
    expect(item?.url).toContain('demo.git')
  })
})

describe('normalizeProjectList', () => {
  it('场景：解析 data 数组', () => {
    const list = normalizeProjectList({
      data: [
        { id: 1, repoUrl: 'https://github.com/a/b.git', defaultBranch: 'main' },
        { id: 2, repoUrl: 'https://github.com/c/d.git', defaultBranch: 'main' },
      ],
    })
    expect(list).toHaveLength(2)
    expect(list[0]?.id).toBe('1')
  })

  it('场景：单个对象也视为列表一项', () => {
    const list = normalizeProjectList({
      id: 8,
      repoUrl: 'https://github.com/x/y.git',
      defaultBranch: 'main',
    })
    expect(list).toHaveLength(1)
    expect(list[0]?.name).toBe('y')
  })
})
