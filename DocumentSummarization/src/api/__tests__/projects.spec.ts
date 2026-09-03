import { describe, expect, it } from 'vitest'
import {
  normalizeMappedFile,
  normalizeProjectDetail,
  normalizeProjectItem,
  normalizeProjectList,
} from '../modules/projects'

describe('normalizeProjectItem', () => {
  it('场景：解析列表项嵌套 stats', () => {
    const item = normalizeProjectItem({
      id: 8,
      project_code: 'xiangmu',
      name: 'xiangmu',
      repo_url: 'https://github.com/baiyu21/xiangmu.git',
      default_branch: 'main',
      stats: { documents: 1, changes: 0 },
      last_sync_at: '2026-09-03 14:57:17',
    })
    expect(item).toMatchObject({
      id: '8',
      name: 'xiangmu',
      url: 'https://github.com/baiyu21/xiangmu.git',
      branch: 'main',
      mappedFiles: 1,
      changeCount: 0,
    })
    expect(item?.stats?.docs).toBe(1)
  })
})

describe('normalizeProjectList', () => {
  it('场景：解析 data 数组', () => {
    const list = normalizeProjectList({
      data: [
        {
          id: 8,
          name: 'xiangmu',
          repo_url: 'https://github.com/baiyu21/xiangmu.git',
          default_branch: 'main',
          stats: { documents: 1, changes: 0 },
        },
      ],
    })
    expect(list).toHaveLength(1)
    expect(list[0]?.id).toBe('8')
    expect(list[0]?.mappedFiles).toBe(1)
  })
})

describe('normalizeProjectDetail', () => {
  it('场景：解析详情 + files', () => {
    const detail = normalizeProjectDetail({
      id: 8,
      name: 'xiangmu',
      repo_url: 'https://github.com/baiyu21/xiangmu.git',
      default_branch: 'main',
      stats: { documents: 1, changes: 2, authors: 1 },
      files: [
        {
          id: 101,
          path: 'src/App.vue',
          module: '前端',
          last_at: '2026-09-03 10:00',
          last_author: 'tsy',
          changes: [
            {
              id: 'REC-1',
              title: '调整布局',
              at: '2026-09-03 10:00',
              author: 'tsy',
              summary: '响应式',
            },
          ],
        },
      ],
    })
    expect(detail?.id).toBe('8')
    expect(detail?.files).toHaveLength(1)
    expect(detail?.files[0]?.path).toBe('src/App.vue')
    expect(detail?.files[0]?.docs[0]?.id).toBe('REC-1')
    expect(detail?.stats?.changes).toBe(2)
  })
})

describe('normalizeMappedFile', () => {
  it('场景：无 docs 时也能解析路径', () => {
    const file = normalizeMappedFile(
      { id: 'f1', file_path: 'README.md', module_name: '文档' },
      '8',
    )
    expect(file).toMatchObject({
      id: 'f1',
      projectId: '8',
      path: 'README.md',
      module: '文档',
      docs: [],
    })
  })
})
