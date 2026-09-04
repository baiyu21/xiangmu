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
  /** 仍保留旧 mock，便于本地演示；真实项目数据通过 setProjectFiles 写入 */
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

  /** 用接口数据替换某项目下的映射文件（不影响其他项目） */
  function setProjectFiles(projectId: string, next: MappedFile[]) {
    const others = files.value.filter((f) => f.projectId !== projectId)
    files.value = [...others, ...next.map((f) => ({ ...f, projectId }))]
  }

  /** 合并/更新单个文件（保留已有注释等本地字段时可按需扩展） */
  function upsertFile(file: MappedFile) {
    const idx = files.value.findIndex(
      (f) => f.projectId === file.projectId && (f.id === file.id || f.path === file.path),
    )
    if (idx >= 0) {
      const prev = files.value[idx]!
      const merged: MappedFile = {
        ...prev,
        ...file,
        projectId: file.projectId,
        id: prev.id || file.id,
        path: file.path || prev.path,
        docs: file.docs.length ? file.docs : prev.docs,
      }
      const copy = files.value.slice()
      copy[idx] = merged
      files.value = copy
      return merged
    }
    files.value = [...files.value, file]
    return file
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
    files.value = [...files.value]
    return comment
  }

  /** 用接口结果覆盖某次修改记录下的注释列表 */
  function setDocComments(
    projectId: string,
    fileId: string,
    docId: string,
    comments: ClientComment[],
  ) {
    const file = getFile(projectId, fileId)
    const doc = file?.docs.find((d) => d.id === docId || d.docId === docId)
    if (!doc) return
    doc.clientComments = comments
    files.value = [...files.value]
  }

  const totalFiles = computed(() => files.value.length)

  return {
    files,
    totalFiles,
    filesOf,
    getFile,
    projectStats,
    setProjectFiles,
    upsertFile,
    addComment,
    setDocComments,
    changeCountOf,
  }
})

export type { MappedFile, ChangeDoc, ClientComment }
