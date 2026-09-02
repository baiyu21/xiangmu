import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { MOCK_MAPPED_FILES } from './fileMap.mock'
import type { ChangeDoc, ClientComment, MappedFile } from '@/utils/fileMap'
import { changeCountOf, statsOf } from '@/utils/fileMap'
import { useUserStore } from './user'

function cloneFiles(files: MappedFile[]): MappedFile[] {
  return structuredClone(files)
}

export const useFileMapStore = defineStore('fileMap', () => {
  const files = ref<MappedFile[]>(cloneFiles(MOCK_MAPPED_FILES))

  function filesOf(projectId: string): MappedFile[] {
    return files.value.filter((f) => f.projectId === projectId)
  }

  function getFile(projectId: string, fileId: string): MappedFile | undefined {
    return files.value.find((f) => f.projectId === projectId && f.id === fileId)
  }

  function projectStats(projectId: string) {
    return statsOf(filesOf(projectId))
  }

  function addComment(
    projectId: string,
    fileId: string,
    docId: string,
    content: string,
  ): ClientComment {
    const text = content.trim()
    if (!text) throw new Error('请输入注释内容')

    const file = getFile(projectId, fileId)
    const doc = file?.docs.find((d) => d.id === docId)
    if (!doc) throw new Error('未找到对应修改记录')

    const userStore = useUserStore()
    const comment: ClientComment = {
      id: `cn-${Date.now()}`,
      author: userStore.profile?.displayName || userStore.profile?.username || '客户',
      role: 'customer',
      content: text,
      at: new Date().toISOString().slice(0, 16).replace('T', ' '),
    }
    if (!doc.clientComments) doc.clientComments = []
    doc.clientComments.push(comment)
    return comment
  }

  const totalFiles = computed(() => files.value.length)

  return {
    files,
    totalFiles,
    filesOf,
    getFile,
    projectStats,
    addComment,
    changeCountOf,
  }
})

export type { MappedFile, ChangeDoc, ClientComment }
