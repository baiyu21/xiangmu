<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PageState } from '@/components'
import type { PageLoadStatus } from '@/utils/useMockPageLoad'
import { useProjectStore } from '@/stores/project'
import { useFileMapStore } from '@/stores/fileMap'
import {
  fetchProject,
  fetchProjectFiles,
  fetchProjectFileDetail,
  normalizeProjectDetail,
  normalizeProjectFileList,
  normalizeFileDetail,
} from '@/api'
import {
  changeCountOf,
  filterFiles,
  formatPath,
  sortFiles,
  statsOf,
  type ChangeDoc,
  type SortKey,
} from '@/utils/fileMap'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const fileMapStore = useFileMapStore()

const projectId = computed(() => String(route.params.id || ''))
const project = computed(() => projectStore.getById(projectId.value))

const status = ref<PageLoadStatus>('loading')
const historyLoading = ref(false)
let historyReqSeq = 0
/** 进入页批量选中首文件时，避免与显式拉历史重复 */
let skipHistoryWatch = false
const query = ref('')
const sort = ref<SortKey>('count')
const selectedFileId = ref<string | null>(null)

const projectFiles = computed(() => fileMapStore.filesOf(projectId.value))
const stats = computed(() => statsOf(projectFiles.value))

const tableRows = computed(() =>
  sortFiles(filterFiles(projectFiles.value, query.value, 'all', 'module'), sort.value),
)

const selectedFile = computed(() => {
  if (!selectedFileId.value) return undefined
  return fileMapStore.getFile(projectId.value, selectedFileId.value)
})

const briefHistory = computed(() => {
  if (!selectedFile.value) return [] as ChangeDoc[]
  return [...selectedFile.value.docs].sort((a, b) => (a.at < b.at ? 1 : -1))
})

const pageStatus = computed(() => {
  if (status.value === 'loading' || status.value === 'error') return status.value
  return project.value ? 'ready' : 'error'
})

function encodeFileId(fileId: string) {
  return encodeURIComponent(fileId)
}

async function loadFileHistory(filePath: string) {
  if (!projectId.value || !filePath) return
  const seq = ++historyReqSeq
  historyLoading.value = true
  try {
    const raw = await fetchProjectFileDetail(projectId.value, { file: filePath })
    if (seq !== historyReqSeq) return
    const detail = normalizeFileDetail(raw, projectId.value)
    if (detail) {
      fileMapStore.upsertFile(detail)
    }
  } catch {
    // 拦截器已 Toast
  } finally {
    if (seq === historyReqSeq) historyLoading.value = false
  }
}

async function loadDetail() {
  const id = projectId.value
  if (!id) {
    status.value = 'error'
    return
  }

  status.value = 'loading'
  try {
    // 项目基础信息（可选，失败仍可用列表缓存）
    try {
      const rawProject = await fetchProject(id)
      const detail = normalizeProjectDetail(rawProject, id)
      if (detail) projectStore.upsertProject(detail)
    } catch {
      // 忽略；下面用缓存或仅文件列表
    }

    const rawFiles = await fetchProjectFiles(id)
    const files = normalizeProjectFileList(rawFiles, id)

    skipHistoryWatch = true
    fileMapStore.setProjectFiles(id, files)

    if (!projectStore.getById(id)) {
      projectStore.upsertProject({
        id,
        name: id,
        url: '',
        branch: 'main',
        mappedFiles: files.length,
        changeCount: files.reduce((sum, f) => sum + changeCountOf(f), 0),
      })
    } else {
      const p = projectStore.getById(id)!
      projectStore.upsertProject({
        ...p,
        mappedFiles: files.length,
        changeCount: files.reduce((sum, f) => sum + changeCountOf(f), 0),
      })
    }

    // 进入页后默认选中第一个文件，并立即查询修改历史
    const first = files[0]
    selectedFileId.value = first?.id ?? null
    status.value = 'ready'
    if (first?.path) {
      await loadFileHistory(first.path)
    }
    skipHistoryWatch = false
  } catch {
    skipHistoryWatch = false
    if (projectStore.getById(id)) {
      fileMapStore.setProjectFiles(id, [])
      status.value = 'ready'
    } else {
      status.value = 'error'
    }
  }
}

watch(
  projectId,
  () => {
    void loadDetail()
  },
  { immediate: true },
)

watch(
  tableRows,
  (rows) => {
    if (!rows.length) {
      selectedFileId.value = null
      return
    }
    if (!selectedFileId.value || !rows.some((r) => r.id === selectedFileId.value)) {
      selectedFileId.value = rows[0]?.id ?? null
    }
  },
  { immediate: true },
)

watch(
  selectedFileId,
  (id) => {
    if (skipHistoryWatch || !id) return
    const file = fileMapStore.getFile(projectId.value, id)
    if (!file?.path) return
    void loadFileHistory(file.path)
  },
)

function backToList() {
  void router.push({ name: 'projects' })
}

function selectFile(fileId: string) {
  selectedFileId.value = fileId
}

function openDocDetail(docId: string) {
  if (!selectedFileId.value) return
  void router.push({
    name: 'project-file',
    params: { id: projectId.value, fileId: encodeFileId(selectedFileId.value) },
    query: { doc: docId },
  })
}
</script>

<template>
  <div class="page">
    <nav class="crumb">
      <button type="button" class="crumb-link" @click="backToList">项目管理</button>
      <span class="sep">/</span>
      <span>{{ project?.name || projectId }}</span>
      <span class="sep">/</span>
      <span>文件映射</span>
    </nav>

    <PageState
      :status="pageStatus"
      error-text="未找到该项目，可能已被删除或链接无效"
      @retry="loadDetail"
    >
      <header class="page-header">
        <div>
          <h1>文件映射</h1>
          <p>左侧选择文件，右侧预览修改历史简略版；点击某次修改进入完整详情。</p>
        </div>
      </header>

      <div class="stats">
        <div class="stat"><i>映射文件</i><b>{{ stats.files }}</b></div>
        <div class="stat"><i>修改次数</i><b>{{ stats.changes }}</b></div>
        <div class="stat"><i>历史修改人</i><b>{{ stats.authors }}</b></div>
        <div class="stat"><i>关联文档</i><b>{{ stats.docs }}</b></div>
      </div>

      <div class="tools">
        <label class="field grow">
          <span>搜索文件路径 / 修改人</span>
          <input v-model="query" class="input" placeholder="例如 List.vue 或 demo-user" />
        </label>
        <label class="field">
          <span>排序</span>
          <select v-model="sort" class="input">
            <option value="count">修改次数 ↓</option>
            <option value="recent">最近修改 ↓</option>
            <option value="path">路径 A-Z</option>
          </select>
        </label>
      </div>

      <div class="map">
        <section class="list">
          <div class="list-hd">
            <div>
              <span class="muted-label">文件列表</span>
              <strong>全部文件</strong>
            </div>
            <span class="tag teal">{{ tableRows.length }} files</span>
          </div>
          <div class="list-bd">
            <table v-if="tableRows.length" class="table">
              <thead>
                <tr>
                  <th>文件</th>
                  <th>修改</th>
                  <th>最近</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="f in tableRows"
                  :key="f.id"
                  class="hit"
                  :class="{ on: selectedFileId === f.id }"
                  @click="selectFile(f.id)"
                >
                  <td>
                    <div class="path">
                      <span class="dir">{{ formatPath(f.path).dir }}</span>
                      <span class="name">{{ formatPath(f.path).name }}</span>
                    </div>
                    <span class="tag">{{ f.module }}</span>
                  </td>
                  <td><strong>{{ changeCountOf(f) }}</strong></td>
                  <td>
                    <div class="mono">{{ f.lastAt }}</div>
                    <div class="sub">@{{ f.lastAuthor }}</div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty">没有匹配的文件</div>
          </div>
        </section>

        <aside class="history">
          <div class="list-hd">
            <div>
              <span class="muted-label">修改历史 · 简略</span>
              <strong v-if="selectedFile">{{ formatPath(selectedFile.path).name }}</strong>
              <strong v-else>未选择文件</strong>
            </div>
            <span v-if="selectedFile" class="tag teal">{{ briefHistory.length }} 次</span>
          </div>

          <div v-if="selectedFile" class="history-bd" v-loading="historyLoading">
            <p v-if="selectedFile.aiBrief" class="file-brief">{{ selectedFile.aiBrief }}</p>

            <button
              v-for="d in briefHistory"
              :key="d.id"
              type="button"
              class="tl-item"
              @click="openDocDetail(d.id)"
            >
              <div class="tl-time">
                {{ d.at }}
                <div class="author">@{{ d.author }}</div>
              </div>
              <div class="tl-main">
                <div class="tl-title">{{ d.title }}</div>
                <div class="tl-desc">{{ d.summary }}</div>
                <div class="tl-foot">
                  <span class="doc-id">{{ d.id }}</span>
                  <span
                    v-if="(d.clientComments || []).length"
                    class="tl-comment-badge"
                  >
                    {{ d.clientComments!.length }} 条注释
                  </span>
                  <span class="tl-hint">查看详情 →</span>
                </div>
              </div>
            </button>

            <div v-if="!historyLoading && !briefHistory.length" class="empty">
              该文件暂无修改记录
            </div>
          </div>
          <div v-else class="empty">请在左侧选择一个文件</div>
        </aside>
      </div>
    </PageState>
  </div>
</template>

<style scoped>
.crumb {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.crumb-link {
  border: none;
  background: none;
  color: #0f766e;
  padding: 0;
  cursor: pointer;
  font-size: 13px;
}
.crumb-link:hover {
  text-decoration: underline;
}
.sep {
  color: #9ca3af;
}
.page-header {
  margin-bottom: 16px;
}
.page-header h1 {
  margin: 0 0 6px;
  font-size: 26px;
  font-weight: 700;
  color: #111827;
}
.page-header p {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}
.stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}
.stat {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 14px 16px;
}
.stat i {
  display: block;
  font-style: normal;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
}
.stat b {
  font-size: 22px;
  color: #111827;
}
.tools {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}
.field.grow {
  flex: 1;
  min-width: 220px;
}
.input {
  padding: 9px 12px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  background: #fff;
}
.input:focus {
  border-color: #0f766e;
}
.map {
  display: grid;
  grid-template-columns: minmax(280px, 42%) 1fr;
  gap: 12px;
  min-height: 520px;
}
@media (max-width: 960px) {
  .map {
    grid-template-columns: 1fr;
  }
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .tools {
    flex-direction: column;
  }

  .field.grow,
  .field {
    width: 100%;
  }

  .stats {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .stat {
    padding: 12px;
  }

  .stat b {
    font-size: 18px;
  }

  .tl-item {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .tl-hint {
    margin-left: 0;
  }

  .list-bd,
  .history-bd {
    max-height: none;
  }

  .table {
    font-size: 13px;
  }

  .table th,
  .table td {
    padding: 8px;
  }
}
.list,
.history {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.list-hd {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}
.muted-label {
  display: block;
  font-size: 11px;
  color: #6b7280;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-weight: 500;
}
.list-hd strong {
  display: block;
  font-size: 14px;
  color: #111827;
  margin-top: 2px;
}
.list-bd,
.history-bd {
  overflow: auto;
  max-height: 620px;
  flex: 1;
}
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.table th {
  text-align: left;
  font-weight: 500;
  color: #6b7280;
  padding: 10px 12px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: #f7faf8;
  position: sticky;
  top: 0;
}
.table td {
  padding: 10px 12px;
  border-bottom: 1px solid #e5e7eb;
  vertical-align: top;
  color: #374151;
}
.table tr.hit {
  cursor: pointer;
}
.table tr.hit:hover td {
  background: #f4faf7;
}
.table tr.hit.on td {
  background: #ecfdf5;
}
.path .dir {
  color: #9ca3af;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
}
.path .name {
  color: #111827;
  font-weight: 600;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12.5px;
}
.tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  background: #eef3f0;
  color: #4b5563;
  margin-top: 6px;
}
.tag.teal {
  background: #ecfdf5;
  color: #0f766e;
  margin-top: 0;
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  color: #6b7280;
}
.sub {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}
.btn-sm {
  padding: 5px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  font-size: 12px;
  color: #4b5563;
  cursor: pointer;
}
.btn-sm:hover {
  border-color: #0f766e;
  color: #0f766e;
}
.empty {
  padding: 48px 16px;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
}
.file-brief {
  margin: 0;
  padding: 12px 14px;
  font-size: 13px;
  line-height: 1.55;
  color: #4b5563;
  background: #f8faf9;
  border-bottom: 1px solid #e5e7eb;
}
.tl-item {
  display: grid;
  grid-template-columns: 112px 1fr;
  gap: 12px;
  padding: 14px;
  border: none;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
  text-align: left;
  width: 100%;
  cursor: pointer;
}
.tl-item:hover {
  background: #f8fbf9;
}
.tl-time {
  font-size: 12px;
  color: #6b7280;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
.tl-time .author {
  margin-top: 4px;
  color: #0f766e;
  font-family: inherit;
}
.tl-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 4px;
}
.tl-desc {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.45;
}
.tl-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.doc-id {
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  color: #0f766e;
  background: #ecfdf5;
  padding: 2px 6px;
  border-radius: 6px;
}
.tl-comment-badge {
  font-size: 11px;
  color: #b45309;
  background: #fff1df;
  padding: 2px 6px;
  border-radius: 6px;
}
.tl-hint {
  margin-left: auto;
  font-size: 12px;
  color: #0f766e;
}
</style>
