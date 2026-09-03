<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { PageState } from '@/components'
import { useProjectStore } from '@/stores/project'
import { useFileMapStore } from '@/stores/fileMap'
import { changeCountOf, type ChangeDoc } from '@/utils/fileMap'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const fileMapStore = useFileMapStore()

const projectId = computed(() => String(route.params.id || ''))
const fileId = computed(() => String(route.params.fileId || ''))
const project = computed(() => projectStore.getById(projectId.value))
const file = computed(() => fileMapStore.getFile(projectId.value, fileId.value))

const selectedDocId = ref<string | null>(null)
const commentInput = ref('')

const history = computed(() => {
  if (!file.value) return [] as ChangeDoc[]
  return [...file.value.docs].sort((a, b) => (a.at < b.at ? 1 : -1))
})

const selectedDoc = computed(() =>
  history.value.find((d) => d.id === selectedDocId.value) || null,
)

const pageStatus = computed(() => {
  if (!project.value) return 'error' as const
  if (!file.value) return 'error' as const
  return 'ready' as const
})

const fileName = computed(() => file.value?.path.split('/').pop() || fileId.value)

function resolveInitialDocId(docs: ChangeDoc[]): string | null {
  if (!docs.length) return null
  const sorted = [...docs].sort((a, b) => (a.at < b.at ? 1 : -1))
  const fromQuery = typeof route.query.doc === 'string' ? route.query.doc : ''
  if (fromQuery && sorted.some((d) => d.id === fromQuery)) return fromQuery
  return sorted[0]?.id || null
}

watch(
  file,
  (f) => {
    selectedDocId.value = f ? resolveInitialDocId(f.docs) : null
    commentInput.value = ''
  },
  { immediate: true },
)

watch(
  () => route.query.doc,
  (doc) => {
    if (typeof doc !== 'string' || !file.value) return
    if (file.value.docs.some((d) => d.id === doc)) {
      selectedDocId.value = doc
    }
  },
)

function backToMap() {
  void router.push({ name: 'project-overview', params: { id: projectId.value } })
}

function backToList() {
  void router.push({ name: 'projects' })
}

function openRecord(docId: string) {
  void router.push({
    name: 'project-record',
    params: {
      id: projectId.value,
      fileId: fileId.value,
      docId,
    },
  })
}

function submitComment() {
  if (!selectedDocId.value) {
    ElMessage.warning('请先选择左侧某次修改')
    return
  }
  try {
    fileMapStore.addComment(
      projectId.value,
      fileId.value,
      selectedDocId.value,
      commentInput.value,
    )
    commentInput.value = ''
    ElMessage.success('注释已发表')
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '发表失败')
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
      @retry="backToMap"
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
        <div class="stat"><i>修改人数</i><b>{{ file?.authors.length || 0 }}</b></div>
        <div class="stat"><i>关联文档</i><b>{{ file?.docs.length || 0 }}</b></div>
        <div class="stat">
          <i>所属模块</i><b class="mod">{{ file?.module }}</b>
        </div>
      </div>

      <section class="shell">
        <div class="shell-hd">
          <strong>修改历史与对应文档</strong>
          <span class="tag">修改人：{{ file?.authors.map((a) => '@' + a).join(' ') }}</span>
        </div>

        <div class="history-wrap">
          <div class="history-list">
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
                <div class="tl-title">{{ d.title }}</div>
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

              <div class="brief-comments">
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
                      <span class="note-author">{{ n.author }} · 客户</span>
                      <span class="mono">{{ n.at }}</span>
                    </div>
                    <div class="note-body">{{ n.content }}</div>
                  </div>
                  <div
                    v-if="!(selectedDoc.clientComments || []).length"
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
                  ></textarea>
                  <div class="form-foot">
                    <small>以当前登录身份发表。</small>
                    <button type="button" class="btn-primary sm" @click="submitComment">
                      发表注释
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
.tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  background: #eef3f0;
  color: #4b5563;
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
