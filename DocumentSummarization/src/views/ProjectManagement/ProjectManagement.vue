<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { PageState, ProjectFormModal } from '@/components'
import type { PageLoadStatus } from '@/utils/useMockPageLoad'
import { useProjectStore, type Project } from '@/stores/project'
import { useFileMapStore } from '@/stores/fileMap'

const router = useRouter()
const projectStore = useProjectStore()
const fileMapStore = useFileMapStore()

const status = ref<PageLoadStatus>('loading')
const modalOpen = ref(false)

const ACCENT_COLORS = ['#0f766e', '#7c3aed', '#ea580c', '#0891b2', '#be185d', '#4f46e5']

const rows = computed(() => projectStore.projects)

function accentOf(project: Project, index: number) {
  let hash = 0
  for (const ch of project.id) hash = (hash + ch.charCodeAt(0)) % ACCENT_COLORS.length
  return ACCENT_COLORS[(hash + index) % ACCENT_COLORS.length] || ACCENT_COLORS[0]
}

function liveStats(projectId: string) {
  const s = fileMapStore.projectStats(projectId)
  if (s.files === 0) {
    const p = projectStore.getById(projectId)
    return { mappedFiles: p?.mappedFiles ?? 0, changeCount: p?.changeCount ?? 0 }
  }
  return { mappedFiles: s.files, changeCount: s.changes }
}

async function loadList() {
  status.value = 'loading'
  await new Promise((r) => setTimeout(r, 280))
  status.value = rows.value.length ? 'ready' : 'empty'
}

function openCreate() {
  modalOpen.value = true
}

function onCreate(payload: { url: string; branch: string }) {
  try {
    const created = projectStore.addProject(payload)
    status.value = 'ready'
    ElMessage.success(`项目已添加：${created.name}`)
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '添加失败')
  }
}

function goOverview(id: string) {
  void router.push({ name: 'project-overview', params: { id } })
}

function syncOne(name: string) {
  ElMessage.success(`已同步（模拟）：${name}`)
}

function syncAll() {
  ElMessage.success('全部项目同步完成（模拟）')
}

onMounted(() => {
  void loadList()
})
</script>

<template>
  <div class="page">
    <header class="page-header">
      <div>
        <h1>项目管理</h1>
        <p>登记与同步仓库，点击「进入概览」查看文件列表与修改历史简略版。</p>
      </div>
      <div class="header-actions">
        <button type="button" class="btn-ghost" @click="syncAll">全部同步</button>
        <button type="button" class="btn-primary" @click="openCreate">添加项目</button>
      </div>
    </header>

    <div class="note">
      <b>主路径：</b>项目管理 → 进入概览（文件列表 + 修改历史简略）→ 文档详情 → 对应修改文档。
    </div>

    <PageState
      :status="status"
      empty-text="暂无项目，请先添加"
      error-text="项目列表加载失败"
      @retry="loadList"
    >
      <div class="grid">
        <article v-for="(p, index) in rows" :key="p.id" class="project-card">
          <div class="card-top">
            <div class="dot" :style="{ background: accentOf(p, index) }"></div>
            <div class="card-title-wrap">
              <h2 class="card-name">{{ p.name }}</h2>
              <span class="tag">{{ p.branch }}</span>
            </div>
          </div>

          <p class="card-url mono" :title="p.url">{{ p.url }}</p>

          <div class="card-meta">
            <span><strong>{{ liveStats(p.id).mappedFiles }}</strong> 映射文件</span>
            <span><strong>{{ liveStats(p.id).changeCount }}</strong> 次修改</span>
          </div>

          <div class="card-footer">
            <button type="button" class="link primary" @click="goOverview(p.id)">
              进入概览 →
            </button>
            <button type="button" class="link muted" @click="syncOne(p.name)">同步</button>
          </div>
        </article>
      </div>
    </PageState>

    <ProjectFormModal v-model:open="modalOpen" @submit="onCreate" />
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.page-header h1 {
  font-size: 26px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 6px;
}

.page-header p {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.note {
  margin-bottom: 20px;
  padding: 12px 14px;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 10px;
  font-size: 13px;
  color: #374151;
  line-height: 1.5;
}

.note b {
  color: #0f766e;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
}

.project-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 22px;
  transition: border-color 0.15s, box-shadow 0.15s;
  display: flex;
  flex-direction: column;
  min-height: 190px;
}

.project-card:hover {
  border-color: #a7f3d0;
  box-shadow: 0 4px 20px rgba(15, 118, 110, 0.08);
}

.card-top {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 12px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: 6px;
  flex-shrink: 0;
}

.card-title-wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.card-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  word-break: break-word;
}

.tag {
  display: inline-block;
  padding: 2px 10px;
  background: #ecfdf5;
  color: #0f766e;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.card-url {
  margin: 0 0 16px;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 16px;
  padding-top: 14px;
  border-top: 1px solid #f3f4f6;
}

.card-meta strong {
  color: #0f766e;
  font-weight: 600;
}

.card-footer {
  display: flex;
  gap: 14px;
  align-items: center;
}

.link {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  padding: 0;
}

.link.primary {
  color: #0f766e;
  font-weight: 500;
}

.link.primary:hover {
  text-decoration: underline;
}

.link.muted {
  color: #9ca3af;
}

.link.muted:hover {
  color: #6b7280;
}

.btn-primary {
  padding: 9px 16px;
  background: #0f766e;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary:hover {
  background: #0d9488;
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
</style>
