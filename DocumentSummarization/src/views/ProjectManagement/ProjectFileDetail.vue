<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { PageState } from '@/components'
import type { PageLoadStatus } from '@/utils/useMockPageLoad'
import { useProjectStore } from '@/stores/project'
import { useFileMapStore } from '@/stores/fileMap'
import { fetchProjectFileDetail, normalizeFileDetail, fetchRecordComments, createRecordComment, normalizeRecordComments } from '@/api'
import {
  changeCountOf,
  changeTypeLabel,
  resolveChangeTypeCode,
  type ChangeDoc,
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
const project = computed(() => projectStore.getById(projectId.value))
const file = computed(() => fileMapStore.getFile(projectId.value, fileId.value))

const selectedDocId = ref<string | null>(null)
const typeFilter = ref<ChangeTypeFilter>('all')
const commentInput = ref('')
const detailLoading = ref(false)
const commentsLoading = ref(false)
const commentSubmitting = ref(false)
const pageStatus = ref<PageLoadStatus>('loading')

const typeFilterOptions: { value: ChangeTypeFilter; label: string }[] = [
  { value: 'all', label: '全部类型' },
  { value: 'add', label: '新增' },
  { value: 'modify', label: '修改' },
  { value: 'delete', label: '删除' },
]

const history = computed(() => {
  if (!file.value) return [] as ChangeDoc[]
  const sorted = [...file.value.docs].sort((a, b) => (a.at < b.at ? 1 : -1))
  if (typeFilter.value === 'all') return sorted
  return sorted.filter((d) => {
    const code = d.typeCode || resolveChangeTypeCode(d.type)
    return code === typeFilter.value
  })
})

const selectedDoc = computed(() =>
  history.value.find((d) => d.id === selectedDocId.value) || null,
)

/** 注释接口传 changeItemId（file-detail 的 records[].id，即 change_items 主键） */
const commentItemId = computed(() => selectedDoc.value?.id || '')

const fileName = computed(() => file.value?.path.split('/').pop() || fileId.value)

function resolveInitialDocId(docs: ChangeDoc[]): string | null {
  if (!docs.length) return null
  const sorted = [...docs].sort((a, b) => (a.at < b.at ? 1 : -1))
  const fromQuery = typeof route.query.doc === 'string' ? route.query.doc : ''
  if (fromQuery && sorted.some((d) => d.id === fromQuery)) return fromQuery
  return sorted[0]?.id || null
}

async function loadComments() {
  const itemId = commentItemId.value
  if (!itemId || !projectId.value || !fileId.value) return
  commentsLoading.value = true
  try {
    const raw = await fetchRecordComments(itemId)
    const list = normalizeRecordComments(raw)
    fileMapStore.setDocComments(projectId.value, fileId.value, itemId, list)
  } catch {
    // 拦截器已 Toast
  } finally {
    commentsLoading.value = false
  }
}

async function loadFileDetail() {
  const pid = projectId.value
  const fid = fileId.value
  if (!pid || !fid) {
    pageStatus.value = 'error'
    return
  }

  detailLoading.value = true
  pageStatus.value = 'loading'
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
          changeCount: changeCountOf(detail),
        })
      }
      pageStatus.value = 'ready'
      selectedDocId.value = resolveInitialDocId(detail.docs)
    } else {
      pageStatus.value = file.value ? 'ready' : 'error'
    }
  } catch {
    pageStatus.value = project.value && file.value ? 'ready' : 'error'
  } finally {
    detailLoading.value = false
  }
}

watch(
  () => route.query.doc,
  (doc) => {
    if (typeof doc !== 'string' || !file.value) return
    if (file.value.docs.some((d) => d.id === doc)) {
      selectedDocId.value = doc
    }
  },
)

watch(
  [projectId, fileId],
  () => {
    void loadFileDetail()
  },
  { immediate: true },
)

watch(selectedDocId, () => {
  commentInput.value = ''
  void loadComments()
})

watch(typeFilter, () => {
  const list = history.value
  if (!list.length) {
    selectedDocId.value = null
    return
  }
  if (!selectedDocId.value || !list.some((d) => d.id === selectedDocId.value)) {
    selectedDocId.value = list[0]?.id || null
  }
})

watch(
  [projectId, fileId],
  () => {
    typeFilter.value = 'all'
  },
)

function docTypeLabel(doc: ChangeDoc): string {
  return doc.type || changeTypeLabel(doc.typeCode) || ''
}

function docTypeCode(doc: ChangeDoc): string {
  return doc.typeCode || resolveChangeTypeCode(doc.type) || ''
}

function backToMap() {
  void router.push({ name: 'project-overview', params: { id: projectId.value } })
}

function backToList() {
  void router.push({ name: 'projects' })
}

function openRecord(docId: string) {
  const doc = file.value?.docs.find((d) => d.id === docId)
  const date = (doc?.at || '').slice(0, 10)
  void router.push({
    name: 'project-record',
    params: {
      id: projectId.value,
      fileId: encodeURIComponent(fileId.value),
      docId: doc?.docId || docId,
    },
    query: date ? { date } : undefined,
  })
}

async function submitComment() {
  if (!commentItemId.value) {
    ElMessage.warning('请先选择左侧某次修改')
    return
  }
  const content = commentInput.value.trim()
  if (!content) {
    ElMessage.warning('请输入注释内容')
    return
  }
  if (commentSubmitting.value) return

  commentSubmitting.value = true
  try {
    await createRecordComment(commentItemId.value, { content })
    commentInput.value = ''
    ElMessage.success('注释已发表')
    await loadComments()
  } catch {
    // 拦截器已 Toast
  } finally {
    commentSubmitting.value = false
  }
}
</script>

<template>
  <div class="page">
    <nav class="crumb">
      <button type="button" class="crumb-link" @click="backToList">项目管理</button>
      <span class="sep">/</span>
      <button type="button" class="crumb-link" @click="backToMap">文件映射</button>
      <span class="sep">/</span>
      <span>{{ fileName }}</span>
    </nav>

    <PageState
      :status="pageStatus"
      error-text="未找到该文件或项目"
      @retry="loadFileDetail"
    >
      <header class="page-header">
        <div>
          <h1>{{ fileName }}</h1>
          <p class="mono">{{ file?.path }}</p>
        </div>
        <button type="button" class="btn-ghost" @click="backToMap">返回映射</button>
      </header>

      <div class="stats">
        <div class="stat"><i>修改次数</i><b>{{ file ? changeCountOf(file) : 0 }}</b></div>
        <div class="stat">
          <i>修改人数</i>
          <b>{{ file?.authors.length || file?.authorCount || 0 }}</b>
        </div>
        <div class="stat">
          <i>关联文档</i>
          <b>{{ file?.documentCount || file?.docs.length || 0 }}</b>
        </div>
        <div class="stat">
          <i>所属模块</i><b class="mod">{{ file?.module }}</b>
        </div>
      </div>

      <section class="shell">
        <div class="shell-hd">
          <strong>修改历史与对应文档</strong>
          <div class="shell-hd-right">
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
            <span class="tag">修改人：{{ file?.authors.map((a) => '@' + a).join(' ') }}</span>
          </div>
        </div>

        <div class="history-wrap">
          <div class="history-list">
            <div v-if="!history.length" class="history-empty">当前类型下暂无修改记录</div>
            <button
              v-for="d in history"
              :key="d.id"
              type="button"
              class="tl-item"
              :class="{ on: selectedDocId === d.id }"
              @click="selectedDocId = d.id"
            >
              <div class="tl-time">
                {{ d.at }}
                <div class="author">@{{ d.author }}</div>
              </div>
              <div class="tl-main">
                <div class="tl-title">
                  <span
                    v-if="docTypeLabel(d)"
                    class="type-chip"
                    :class="docTypeCode(d) || 'modify'"
                  >
                    {{ docTypeLabel(d) }}
                  </span>
                  {{ d.title }}
                </div>
                <div class="tl-desc">{{ d.summary }}</div>
                <span
                  v-if="(d.clientComments || []).length"
                  class="tl-comment-badge"
                >
                  {{ d.clientComments!.length }} 条客户注释
                </span>
                <span
                  class="doc-link"
                  @click.stop="openRecord(d.id)"
                >
                  <b>{{ d.id }}</b>
                  <span>对应修改文档 · 点击打开</span>
                </span>
              </div>
            </button>
          </div>

          <aside class="history-brief">
            <div class="brief-hd">
              <strong>修改简介</strong>
              <span class="brief-tag">AI · 预留</span>
            </div>

            <template v-if="selectedDoc">
              <div class="brief-meta">
                {{ selectedDoc.id }} · {{ selectedDoc.at }} · @{{ selectedDoc.author }}
              </div>
              <div class="brief-body">
                <p v-if="selectedDoc.aiBrief">{{ selectedDoc.aiBrief }}</p>
                <div v-else class="brief-placeholder">
                  AI 总结尚未就绪。当前技术摘要：{{ selectedDoc.summary || '—' }}
                </div>
              </div>

              <div class="brief-comments" v-loading="commentsLoading">
                <div class="brief-comments-hd">
                  <div>
                    <strong>客户注释</strong>
                    <span class="hint"> · 供开发查看客户想法</span>
                  </div>
                  <span class="tag amber">
                    {{ (selectedDoc.clientComments || []).length }} 条
                  </span>
                </div>
                <div class="comment-list">
                  <div
                    v-for="n in selectedDoc.clientComments || []"
                    :key="n.id"
                    class="client-note"
                  >
                    <div class="note-hd">
                      <span class="note-author">{{ n.author }} · {{ n.role === 'customer' ? '客户' : n.role }}</span>
                      <span class="mono">{{ n.at }}</span>
                    </div>
                    <div class="note-body">{{ n.content }}</div>
                  </div>
                  <div
                    v-if="!commentsLoading && !(selectedDoc.clientComments || []).length"
                    class="comment-empty"
                  >
                    暂无客户注释，客户可在此留下对本次修改的想法。
                  </div>
                </div>
                <div class="brief-comment-form">
                  <textarea
                    v-model="commentInput"
                    placeholder="客户可在此写下对本次修改的想法、疑问或改动建议…"
                    rows="3"
                    :disabled="commentSubmitting"
                  ></textarea>
                  <div class="form-foot">
                    <small>以当前登录身份发表。</small>
                    <button
                      type="button"
                      class="btn-primary sm"
                      :disabled="commentSubmitting"
                      @click="submitComment"
                    >
                      {{ commentSubmitting ? '发表中…' : '发表注释' }}
                    </button>
                  </div>
                </div>
              </div>
            </template>

            <template v-else>
              <div class="brief-meta">点击左侧某次修改查看简介</div>
              <div class="brief-body">
                <div class="brief-placeholder">
                  此处用于展示 AI 用通俗语言总结的修改内容。
                </div>
              </div>
            </template>
          </aside>
        </div>
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
  font-size: 26px;
  font-weight: 700;
  color: #111827;
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}
.btn-ghost {
  padding: 9px 14px;
  background: #fff;
  color: #4b5563;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
}
.btn-ghost:hover {
  border-color: #0f766e;
  color: #0f766e;
}
.stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}
@media (max-width: 900px) {
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .history-wrap {
    grid-template-columns: 1fr !important;
  }
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
.stat b.mod {
  font-size: 16px;
}
.shell {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
}
.shell-hd {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}
.shell-hd-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
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
.tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  background: #eef3f0;
  color: #4b5563;
}
.history-empty {
  padding: 28px 16px;
  font-size: 13px;
  color: #9ca3af;
  text-align: center;
}
.type-chip {
  display: inline-flex;
  align-items: center;
  margin-right: 6px;
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  vertical-align: middle;
}
.type-chip.add {
  background: #ecfdf5;
  color: #047857;
}
.type-chip.modify {
  background: #eff6ff;
  color: #1d4ed8;
}
.type-chip.delete {
  background: #fef2f2;
  color: #b91c1c;
}
.tag.amber {
  background: #fff1df;
  color: #b45309;
}
.history-wrap {
  display: grid;
  grid-template-columns: minmax(260px, 34%) 1fr;
  min-height: 360px;
}
.history-list {
  border-right: 1px solid #e5e7eb;
  min-width: 0;
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
.tl-item.on {
  background: #ecfdf5;
  border-left: 3px solid #0f766e;
  padding-left: 13px;
}
.tl-time {
  font-size: 12px;
  color: #6b7280;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
.tl-time .author {
  margin-top: 8px;
}
.tl-title {
  font-weight: 600;
  margin-bottom: 4px;
  color: #111827;
}
.tl-desc {
  font-size: 13px;
  color: #4b5563;
  margin-bottom: 10px;
}
.tl-comment-badge {
  display: inline-block;
  margin-bottom: 8px;
  font-size: 11px;
  color: #b45309;
  background: #fff1df;
  padding: 2px 8px;
  border-radius: 999px;
}
.doc-link {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px dashed #c9d5cf;
  background: #fafcfb;
  color: #0f766e;
  font-size: 12px;
}
.doc-link:hover {
  border-color: #0f766e;
  background: #ecfdf5;
}
.history-brief {
  padding: 16px 18px;
  background: #fafcfb;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  max-height: 640px;
}
.brief-hd {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.brief-tag {
  font-size: 11px;
  color: #0f766e;
  background: #ecfdf5;
  padding: 2px 8px;
  border-radius: 999px;
}
.brief-meta {
  font-size: 12px;
  color: #6b7280;
}
.brief-body p {
  margin: 0;
  font-size: 14px;
  color: #1f2937;
  line-height: 1.65;
}
.brief-placeholder {
  font-size: 13px;
  color: #9ca3af;
  line-height: 1.6;
  padding: 12px;
  background: #fff;
  border-radius: 10px;
  border: 1px dashed #d5ddd8;
}
.brief-comments-hd {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.hint {
  font-size: 12px;
  color: #9ca3af;
  font-weight: 400;
}
.client-note {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 8px;
}
.note-hd {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 12px;
}
.note-author {
  color: #0f766e;
  font-weight: 500;
}
.note-body {
  font-size: 13px;
  color: #374151;
  line-height: 1.55;
}
.comment-empty {
  font-size: 13px;
  color: #9ca3af;
  padding: 12px 0;
}
.brief-comment-form textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px 12px;
  font: inherit;
  resize: vertical;
  outline: none;
}
.brief-comment-form textarea:focus {
  border-color: #0f766e;
}
.form-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}
.form-foot small {
  color: #9ca3af;
  font-size: 12px;
}
.btn-primary {
  padding: 9px 14px;
  background: #0f766e;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
}
.btn-primary.sm {
  padding: 7px 12px;
  font-size: 12px;
}
.btn-primary:hover {
  background: #0d9488;
}

@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .stats {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .stat b.mod {
    font-size: 14px;
  }

  .history-wrap {
    grid-template-columns: 1fr !important;
  }

  .tl-item {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .form-foot {
    flex-direction: column;
    align-items: stretch;
  }

  .form-foot .btn-primary {
    width: 100%;
  }
}
</style>
