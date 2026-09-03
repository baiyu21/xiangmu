import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { parseProjectNameFromUrl, useProjectStore } from '../project'

describe('parseProjectNameFromUrl', () => {
  it('场景：从 git URL 解析仓库名', () => {
    expect(parseProjectNameFromUrl('https://github.com/org/repo.git')).toBe('repo')
  })

  it('场景：无 .git 后缀也能解析', () => {
    expect(parseProjectNameFromUrl('https://github.com/org/demo/')).toBe('demo')
  })
})

describe('useProjectStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('场景：初始为空列表', () => {
    const store = useProjectStore()
    expect(store.projects).toEqual([])
  })

  it('场景：setProjects 写入列表', () => {
    const store = useProjectStore()
    store.setProjects([
      {
        id: '1',
        name: 'xiangmu',
        url: 'https://github.com/baiyu21/xiangmu.git',
        branch: 'main',
        mappedFiles: 0,
        changeCount: 0,
      },
    ])
    expect(store.projects).toHaveLength(1)
    expect(store.getById('1')?.name).toBe('xiangmu')
  })

  it('场景：upsertProject 写入列表头部并可去重', () => {
    const store = useProjectStore()
    store.setProjects([
      {
        id: '1',
        name: 'old',
        url: 'https://github.com/a/old.git',
        branch: 'main',
        mappedFiles: 0,
        changeCount: 0,
      },
    ])
    store.upsertProject({
      id: '2',
      name: 'new',
      url: 'https://github.com/a/new.git',
      branch: 'main',
      mappedFiles: 0,
      changeCount: 0,
    })
    expect(store.projects[0]?.id).toBe('2')
    store.upsertProject({
      id: '2',
      name: 'new-2',
      url: 'https://github.com/a/new.git',
      branch: 'develop',
      mappedFiles: 1,
      changeCount: 2,
    })
    expect(store.projects).toHaveLength(2)
    expect(store.getById('2')?.name).toBe('new-2')
  })
})
