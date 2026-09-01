import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export interface Project {
  id: string
  name: string
  url: string
  branch: string
  mappedFiles: number
  changeCount: number
}

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'rd-xmz',
    name: 'rd-xmz',
    url: 'https://github.com/rd/xmz.git',
    branch: 'main',
    mappedFiles: 6,
    changeCount: 18,
  },
  {
    id: 'school-portal',
    name: 'school-portal',
    url: 'https://github.com/school/portal.git',
    branch: 'develop',
    mappedFiles: 3,
    changeCount: 7,
  },
]

export function parseProjectNameFromUrl(url: string): string {
  const cleaned = url.trim().replace(/\/+$/, '')
  const segment = cleaned.split('/').pop() || 'new-repo'
  return segment.replace(/\.git$/i, '') || 'new-repo'
}

export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>([...INITIAL_PROJECTS])

  const projectCount = computed(() => projects.value.length)

  function getById(id: string): Project | undefined {
    return projects.value.find((p) => p.id === id)
  }

  function addProject(input: { url: string; branch?: string }): Project {
    const url = input.url.trim()
    if (!url) {
      throw new Error('请输入仓库地址')
    }
    const name = parseProjectNameFromUrl(url)
    let id = name
    let suffix = 2
    while (projects.value.some((p) => p.id === id)) {
      id = `${name}-${suffix}`
      suffix += 1
    }

    const project: Project = {
      id,
      name: id === name ? name : id,
      url,
      branch: (input.branch || 'main').trim() || 'main',
      mappedFiles: 0,
      changeCount: 0,
    }
    projects.value = [project, ...projects.value]
    return project
  }

  return {
    projects,
    projectCount,
    getById,
    addProject,
  }
})
