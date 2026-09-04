import { describe, expect, it } from 'vitest'
import {
  buildModuleNodes,
  buildRepoNodes,
  changeCountOf,
  filterFiles,
  formatPath,
  sortFiles,
  statsOf,
  type MappedFile,
} from '../fileMap'

const sample: MappedFile[] = [
  {
    id: 'a',
    projectId: 'p',
    module: '合同模块',
    path: 'src/views/List.vue',
    authors: ['alice'],
    lastAt: '2026-09-01 10:00',
    lastAuthor: 'alice',
    docs: [
      { id: '1', title: 't', at: '2026-09-01', author: 'alice', summary: 's' },
      { id: '2', title: 't2', at: '2026-08-01', author: 'alice', summary: 's' },
    ],
  },
  {
    id: 'b',
    projectId: 'p',
    module: '客户模块',
    path: 'src/api/x.ts',
    authors: ['bob', 'alice'],
    lastAt: '2026-08-20 10:00',
    lastAuthor: 'bob',
    docs: [{ id: '3', title: 't3', at: '2026-08-20', author: 'bob', summary: 's' }],
  },
]

describe('fileMap utils', () => {
  it('场景：statsOf 汇总文件与修改', () => {
    const s = statsOf(sample)
    expect(s.files).toBe(2)
    expect(s.changes).toBe(3)
    expect(s.authors).toBe(2)
    expect(s.docs).toBe(3)
  })

  it('场景：模块树按模块归组', () => {
    const nodes = buildModuleNodes(sample)
    expect(nodes.map((n) => n.label)).toEqual(['合同模块', '客户模块'])
    expect(nodes[0]?.count).toBe(2)
  })

  it('场景：仓库树含根目录', () => {
    const nodes = buildRepoNodes(sample)
    expect(nodes[0]?.label).toBe('仓库根目录')
    expect(nodes[0]?.kids?.some((k) => k.label === 'src')).toBe(true)
  })

  it('场景：按模块 scope 过滤', () => {
    const rows = filterFiles(sample, '', 'mod:客户模块', 'module')
    expect(rows).toHaveLength(1)
    expect(rows[0]?.id).toBe('b')
  })

  it('场景：搜索作者', () => {
    const rows = filterFiles(sample, 'bob', 'all', 'module')
    expect(rows.map((r) => r.id)).toEqual(['b'])
  })

  it('场景：按修改次数排序', () => {
    const rows = sortFiles(sample, 'count')
    expect(rows[0]?.id).toBe('a')
    expect(changeCountOf(rows[0]!)).toBe(2)
  })

  it('场景：formatPath 拆分目录与文件名', () => {
    expect(formatPath('src/views/List.vue')).toEqual({
      dir: 'src/views/',
      name: 'List.vue',
    })
  })

  it('场景：列表计数优先于 docs.length', () => {
    const file: MappedFile = {
      id: 'c',
      projectId: 'p',
      module: '源码',
      path: 'src/a.ts',
      authors: [],
      lastAt: '2026-09-02',
      lastAuthor: '1 人',
      docs: [],
      changeCount: 3,
      authorCount: 1,
      documentCount: 1,
    }
    expect(changeCountOf(file)).toBe(3)
    expect(statsOf([file])).toMatchObject({ files: 1, changes: 3, docs: 1, authors: 1 })
  })
})
