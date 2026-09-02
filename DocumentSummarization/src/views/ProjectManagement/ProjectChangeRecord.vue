<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { PageState } from '@/components'
import { useProjectStore } from '@/stores/project'
import { useFileMapStore } from '@/stores/fileMap'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const fileMapStore = useFileMapStore()

const projectId = computed(() => String(route.params.id || ''))
const fileId = computed(() => String(route.params.fileId || ''))
const docId = computed(() => String(route.params.docId || ''))

const project = computed(() => projectStore.getById(projectId.value))
const file = computed(() => fileMapStore.getFile(projectId.value, fileId.value))
const doc = computed(() => file.value?.docs.find((d) => d.id === docId.value))

const pageStatus = computed(() => {
  if (!project.value || !file.value || !doc.value) return 'error' as const
  return 'ready' as const
})

function backToFile() {
  void router.push({
    name: 'project-file',
    params: { id: projectId.value, fileId: fileId.value },
  })
}

function backToMap() {
  void router.push({ name: 'project-overview', params: { id: projectId.value } })
}

function downloadMarkdown() {
  if (!doc.value || !file.value) return
  const md = [
    `# ${doc.value.id} · ${doc.value.title}`,
    '',
    `- **关联文件**: \`${file.value.path}\``,
    `- **修改人**: @${doc.value.author}`,
    `- **时间**: ${doc.value.at}`,
    `- **摘要**: ${doc.value.summary}`,
    '',
    '## AI 通俗说明',
    '',
    doc.value.aiBrief || '_（尚未生成）_',
    '',
    '## 客户注释',
    '',
    ...(doc.value.clientComments || []).map(
      (c) => `- **${c.author}**（${c.at}）：${c.content}`,
    ),
    (doc.value.clientComments || []).length ? '' : '_暂无客户注释_',
    '',
    '---',
    '',
    '_正式版可在此渲染完整 Markdown / diff。_',
    '',
  ].join('\n')

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${doc.value.id}.md`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('已开始下载')
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
      @retry="backToFile"
    >
      <header class="page-header">
        <div>
          <h1>{{ doc?.id }} · {{ doc?.title }}</h1>
          <p>从文档详情中某次修改进入的附属正文页。</p>
        </div>
        <div class="header-actions">
          <button type="button" class="btn-ghost" @click="backToFile">返回文档详情</button>
          <button type="button" class="btn-primary" @click="downloadMarkdown">
            下载 .md
          </button>
        </div>
      </header>

      <section class="shell">
        <p><span class="tag teal">修改文档正文</span></p>
        <p>
          <strong>关联文件</strong><br />
          <span class="mono">{{ file?.path }}</span>
        </p>
        <p><strong>修改人</strong> @{{ doc?.author }}</p>
        <p><strong>时间</strong> {{ doc?.at }}</p>
        <p><strong>摘要</strong> {{ doc?.summary }}</p>

        <hr />

        <h2>AI 通俗说明</h2>
        <p v-if="doc?.aiBrief" class="body">{{ doc.aiBrief }}</p>
        <p v-else class="muted">（AI 总结尚未就绪）</p>

        <h2>客户注释</h2>
        <ul v-if="(doc?.clientComments || []).length" class="comments">
          <li v-for="c in doc?.clientComments" :key="c.id">
            <strong>{{ c.author }}</strong>
            <span class="mono">{{ c.at }}</span>
            <div>{{ c.content }}</div>
          </li>
        </ul>
        <p v-else class="muted">暂无客户注释</p>

        <hr />
        <p class="muted tip">正式版可在此渲染完整 Markdown / diff。</p>
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
  flex-wrap: wrap;
}
.page-header h1 {
  margin: 0 0 6px;
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}
.page-header p {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}
.header-actions {
  display: flex;
  gap: 8px;
}
.btn-ghost,
.btn-primary {
  padding: 9px 14px;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
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
.btn-primary {
  background: #0f766e;
  color: #fff;
  border: none;
}
.btn-primary:hover {
  background: #0d9488;
}
.shell {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 22px;
  line-height: 1.6;
  color: #374151;
  font-size: 14px;
}
.shell p {
  margin: 0 0 12px;
}
.shell h2 {
  margin: 8px 0 10px;
  font-size: 16px;
  color: #111827;
}
.shell hr {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 18px 0;
}
.tag {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  background: #eef3f0;
  color: #4b5563;
}
.tag.teal {
  background: #ecfdf5;
  color: #0f766e;
}
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  color: #6b7280;
}
.body {
  color: #1f2937;
}
.muted {
  color: #9ca3af;
}
.tip {
  font-size: 13px;
  margin-bottom: 0 !important;
}
.comments {
  margin: 0;
  padding-left: 18px;
}
.comments li {
  margin-bottom: 10px;
}
.comments .mono {
  margin-left: 8px;
}
</style>
