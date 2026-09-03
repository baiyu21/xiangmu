import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { ProjectListItem } from '@/api/modules/projects'

export type Project = ProjectListItem

export function parseProjectNameFromUrl(url: string): string {
  const cleaned = url.trim().replace(/\/+$/, '')
  const segment = cleaned.split('/').pop() || 'new-repo'
  return segment.replace(/\.git$/i, '') || 'new-repo'
}

export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>([])

  const projectCount = computed(() => projects.value.length)

  function getById(id: string): Project | undefined {
    return projects.value.find((p) => p.id === id)
  }

  function setProjects(list: Project[]) {
    projects.value = list
  }

  function upsertProject(project: Project) {
    projects.value = [project, ...projects.value.filter((p) => p.id !== project.id)]
  }

  return {
    projects,
    projectCount,
    getById,
    setProjects,
    upsertProject,
  }
})
