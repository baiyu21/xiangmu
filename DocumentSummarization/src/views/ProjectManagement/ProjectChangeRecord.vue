<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { PageState } from '@/components'
import type { PageLoadStatus } from '@/utils/useMockPageLoad'
import { useProjectStore } from '@/stores/project'
import { useFileMapStore } from '@/stores/fileMap'
import {
  fetchChangeDoc,
  fetchProjectFileDetail,
  normalizeChangeDocDetail,
  normalizeFileDetail,
  type ChangeDocDetail,
  type ChangeDocItem,
} from '@/api'
import {
  resolveChangeTypeCode,
  type ChangeTypeFilter,
} from '@/utils/fileMap'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const fileMapStore = useFileMapStore()

const projectId = computed(() => String(route.params.id || ''))
const fileId = computed(() => {
  const raw = String(route.params.fileId || '')
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
})
const docId = computed(() => String(route.params.docId || ''))

const project = computed(() => projectStore.getById(projectId.value))
const file = computed(() => fileMapStore.getFile(projectId.value, fileId.value))
const historyDoc = computed(() => {
  const list = file.value?.docs || []
  return (
    list.find((d) => d.id === docId.value) ||
    list.find((d) => d.docId === docId.value) ||
    undefined
  )
})

const status = ref<PageLoadStatus>('loading')
const changeDoc = ref<ChangeDocDetail | null>(null)
const typeFilter = ref<ChangeTypeFilter>('all')

const typeFilterOptions: { value: ChangeTypeFilter; label: string }[] = [
  { value: 'all', label: '全部类型' },
  { value: 'add', label: '新增' },
  { value: 'modify', label: '修改' },
  { value: 'delete', label: '删除' },
]

const filteredItems = computed(() => {
  const items = changeDoc.value?.items || []
  if (typeFilter.value === 'all') return items
  return items.filter((item: ChangeDocItem) => {
    const code = resolveChangeTypeCode(item.typeCode) || resolveChangeTypeCode(item.type)
    return code === typeFilter.value
  })
})

const pageStatus = computed(() => {
  if (status.value === 'loading' || status.value === 'error') return status.value
  return changeDoc.value ? 'ready' : 'error'
})

const pageTitle = computed(() => {
  if (!changeDoc.value) return '修改文档正文'
  const title = changeDoc.value.requirementDesc || changeDoc.value.reason || changeDoc.value.id
  return `${changeDoc.value.date} · ${title}`
})

function resolveDate(): string {
  const fromQuery = typeof route.query.date === 'string' ? route.query.date.trim() : ''
  if (fromQuery) return fromQuery
  const fromHistory = historyDoc.value?.at?.trim() || ''
  // at 可能是 "2026-09-02" 或带时间，取日期部分
  if (fromHistory) return fromHistory.slice(0, 10)
  return ''
}

async function ensureFileContext() {
  const pid = projectId.value
  const fid = fileId.value
  if (!pid || !fid || file.value?.docs?.length) return
  try {
    const path = file.value?.path || fid
    const raw = await fetchProjectFileDetail(pid, { file: path })
    const detail = normalizeFileDetail(raw, pid)
    if (detail) {
      fileMapStore.upsertFile(detail)
      if (!projectStore.getById(pid)) {
        projectStore.upsertProject({
          id: pid,
          name: pid,
          url: '',
          branch: 'main',
          mappedFiles: 1,
          changeCount: detail.changeCount || detail.docs.length,
        })
      }
    }
  } catch {
    // 正文接口不依赖文件上下文也能展示
  }
}

async function loadRecord() {
  const pid = projectId.value
  if (!pid) {
    status.value = 'error'
    return
  }

  status.value = 'loading'
  changeDoc.value = null
  typeFilter.value = 'all'

  try {
    await ensureFileContext()
    const date = resolveDate()
    if (!date) {
      ElMessage.warning('缺少变更日期，无法加载修改文档')
      status.value = 'error'
      return
    }

    const raw = await fetchChangeDoc(pid, { date })
    const detail = normalizeChangeDocDetail(raw)
    if (!detail) {
      status.value = 'error'
      return
    }
    changeDoc.value = detail
    if (!projectStore.getById(pid)) {
      projectStore.upsertProject({
        id: pid,
        name: project.value?.name || pid,
        url: project.value?.url || '',
        branch: project.value?.branch || 'main',
        mappedFiles: project.value?.mappedFiles || 0,
        changeCount: project.value?.changeCount || detail.changeCount,
      })
    }
    status.value = 'ready'
  } catch {
    status.value = 'error'
  }
}

watch(
  [projectId, fileId, docId, () => route.query.date],
  () => {
    void loadRecord()
  },
  { immediate: true },
)

function backToFile() {
  void router.push({
    name: 'project-file',
    params: { id: projectId.value, fileId: encodeURIComponent(fileId.value) },
  })
}

function backToMap() {
  void router.push({ name: 'project-overview', params: { id: projectId.value } })
}
</script>

<template>
  <div class="page">
    <nav class="crumb">
      <button type="button" class="crumb-link" @click="backToMap">文件映射</button>
      <span class="sep">/</span>
      <button type="button" class="crumb-link" @click="backToFile">文档详情</button>
      <span class="sep">/</span>
      <span>修改文档正文</span>
    </nav>

    <PageState
      :status="pageStatus"
      error-text="未找到该修改文档"
      @retry="loadRecord"
    >
      <header class="page-header">
        <div>
          <h1>{{ pageTitle }}</h1>
          <p v-if="changeDoc?.sourceFile">来源文件：{{ changeDoc.sourceFile }}</p>
        </div>
        <div class="header-actions">
          <button type="button" class="btn-ghost" @click="backToFile">返回文档详情</button>
        </div>
      </header>

      <section v-if="changeDoc" class="shell">
        <p><span class="tag teal">修改文档正文</span></p>

        <div class="meta-grid">
          <p><strong>修改人</strong><br />@{{ changeDoc.author || '—' }}</p>
          <p><strong>日期</strong><br />{{ changeDoc.date }}</p>
          <p><strong>变更条目</strong><br />{{ changeDoc.changeCount }}</p>
          <p v-if="file?.path">
            <strong>来自文件</strong><br />
            <span class="mono">{{ file.path }}</span>
          </p>
        </div>

        <p v-if="changeDoc.relatedReq"><strong>关联需求</strong><br />{{ changeDoc.relatedReq }}</p>
        <p v-if="changeDoc.requirementDesc">
          <strong>需求描述</strong><br />{{ changeDoc.requirementDesc }}
        </p>
        <p v-if="changeDoc.reason"><strong>变更原因</strong><br />{{ changeDoc.reason }}</p>
        <p v-if="changeDoc.impact"><strong>影响范围</strong><br />{{ changeDoc.impact }}</p>
        <p v-if="changeDoc.notice"><strong>注意事项</strong><br />{{ changeDoc.notice }}</p>

        <hr />

        <div class="section-hd">
          <h2>
            变更条目（{{ filteredItems.length
            }}<template v-if="typeFilter !== 'all'">/{{ changeDoc.items.length }}</template>）
          </h2>
          <label class="type-filter">
            <span>变更类型</span>
            <select v-model="typeFilter" aria-label="按变更类型筛选">
              <option
                v-for="opt in typeFilterOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>
          </label>
        </div>
        <div v-if="filteredItems.length" class="items">
          <article v-for="item in filteredItems" :key="item.id" class="item-card">
            <div class="item-hd">
              <span class="tag" :class="item.typeCode || 'modify'">{{ item.type }}</span>
              <span class="tag soft">{{ item.module }}</span>
              <span class="mono path">{{ item.file }}</span>
            </div>
            <p v-if="item.scope" class="item-scope">范围：{{ item.scope }}</p>
            <p v-if="item.note" class="item-note">{{ item.note }}</p>
            <pre v-if="item.codeSnippet" class="snippet">{{ item.codeSnippet }}</pre>
          </article>
        </div>
        <p v-else class="muted">
          {{ changeDoc.items.length ? '当前类型下暂无变更条目' : '暂无变更条目' }}
        </p>

        <hr />

        <h2>完整正文</h2>
        <pre v-if="changeDoc.rawContent" class="raw">{{ changeDoc.rawContent }}</pre>
        <p v-else class="muted">暂无正文内容</p>
      </section>
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
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}
.page-header h1 {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  line-height: 1.35;
}
.page-header p {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}
.header-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.shell {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px 22px;
}
.shell h2 {
  margin: 0;
  font-size: 16px;
  color: #111827;
}
.section-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.type-filter {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #4b5563;
}
.type-filter select {
  min-width: 108px;
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  color: #111827;
  font-size: 12px;
}
.shell p {
  margin: 0 0 12px;
  font-size: 14px;
  color: #374151;
  line-height: 1.6;
}
.shell hr {
  border: none;
  border-top: 1px solid #f3f4f6;
  margin: 18px 0;
}
.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px 16px;
  margin-bottom: 8px;
}
.tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  background: #f3f4f6;
  color: #4b5563;
}
.tag.teal {
  background: #ecfdf5;
  color: #0f766e;
}
.tag.soft {
  background: #eff6ff;
  color: #1d4ed8;
}
.tag.add {
  background: #ecfdf5;
  color: #047857;
}
.tag.modify {
  background: #fff7ed;
  color: #c2410c;
}
.tag.delete {
  background: #fef2f2;
  color: #b91c1c;
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  color: #6b7280;
  word-break: break-all;
}
.muted {
  color: #9ca3af;
}
.items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.item-card {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px 14px;
  background: #fafafa;
}
.item-hd {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.item-hd .path {
  flex: 1 1 180px;
}
.item-scope,
.item-note {
  margin: 0 0 8px !important;
  font-size: 13px !important;
  color: #4b5563 !important;
}
.snippet,
.raw {
  margin: 0;
  padding: 12px 14px;
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 10px;
  font-size: 12px;
  line-height: 1.55;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 480px;
}
.raw {
  max-height: 640px;
  background: #111827;
}
.btn-primary,
.btn-ghost {
  padding: 9px 14px;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
}
.btn-primary {
  background: #0f766e;
  color: #fff;
  border: none;
  font-weight: 500;
}
.btn-primary:hover {
  background: #0d9488;
}
.btn-ghost {
  background: #fff;
  color: #4b5563;
  border: 1px solid #e5e7eb;
}
.btn-ghost:hover {
  border-color: #0f766e;
  color: #0f766e;
}

@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .header-actions {
    display: flex;
  }

  .header-actions .btn-primary,
  .header-actions .btn-ghost {
    flex: 1;
  }
}
</style>
