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

  it('场景：初始包含原型两项目', () => {
    const store = useProjectStore()
    expect(store.projects.map((p) => p.id)).toEqual(['rd-xmz', 'school-portal'])
  })

  it('场景：addProject 写入列表头部', () => {
    const store = useProjectStore()
    const created = store.addProject({
      url: 'https://github.com/demo/new-repo.git',
      branch: 'main',
    })
    expect(created.id).toBe('new-repo')
    expect(store.projects[0]?.id).toBe('new-repo')
    expect(created.mappedFiles).toBe(0)
  })

  it('场景：getById 可查到项目', () => {
    const store = useProjectStore()
    expect(store.getById('rd-xmz')?.branch).toBe('main')
    expect(store.getById('missing')).toBeUndefined()
  })

  it('场景：空 URL 抛错', () => {
    const store = useProjectStore()
    expect(() => store.addProject({ url: '  ' })).toThrow('请输入仓库地址')
  })
})
