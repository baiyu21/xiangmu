<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { PageState, ProjectFormModal } from '@/components'
import type { PageLoadStatus } from '@/utils/useMockPageLoad'
import { useProjectStore, type Project } from '@/stores/project'
import { useFileMapStore } from '@/stores/fileMap'
import { fetchProjects, createProject, syncProject, normalizeProjectList, normalizeProjectItem, getGithubToken, normalizeGithubToken } from '@/api'

const router = useRouter()
const projectStore = useProjectStore()
const fileMapStore = useFileMapStore()

const status = ref<PageLoadStatus>('loading')
const modalOpen = ref(false)
const creating = ref(false)
const syncingId = ref<string | null>(null)
const syncingAll = ref(false)

const ACCENT_COLORS = ['#0f766e', '#7c3aed', '#ea580c', '#0891b2', '#be185d', '#4f46e5']

const rows = computed(() => projectStore.projects)
const isBusy = computed(() => creating.value || syncingId.value != null || syncingAll.value)

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
  try {
    const raw = await fetchProjects()
    projectStore.setProjects(normalizeProjectList(raw))
    status.value = projectStore.projects.length ? 'ready' : 'empty'
  } catch {
    status.value = 'error'
  }
}

function openCreate() {
  modalOpen.value = true
}

async function onCreate(payload: { url: string; branch: string }) {
  if (creating.value) return
  creating.value = true
  try {
    const raw = await createProject({
      repoUrl: payload.url.trim(),
      defaultBranch: (payload.branch || 'main').trim() || 'main',
    })
    const created = normalizeProjectItem(raw) || normalizeProjectList(raw)[0] || null
    if (created) {
      projectStore.upsertProject(created)
    } else {
      await loadList()
    }
    status.value = 'ready'
    modalOpen.value = false
    ElMessage.success(`项目已添加：${created?.name || payload.url}`)
  } catch {
    // 拦截器已 Toast
  } finally {
    creating.value = false
  }
}

function goOverview(id: string) {
  void router.push({ name: 'project-overview', params: { id } })
}

async function resolveGithubToken(): Promise<string | null> {
  try {
    const raw = await getGithubToken()
    const token = normalizeGithubToken(raw)
    if (!token) {
      ElMessage.warning('请先在个人中心配置 GitHub Token')
      return null
    }
    // 若后端返回掩码（含 *），无法用于同步
    if (token.includes('*')) {
      ElMessage.warning('当前 Token 为掩码，请在个人中心重新保存完整 GitHub Token 后再同步')
      return null
    }
    return token
  } catch {
    return null
  }
}

async function syncOne(project: Project) {
  if (isBusy.value) return
  syncingId.value = project.id
  try {
    const token = await resolveGithubToken()
    if (!token) return
    await syncProject(project.id, { github_token: token })
    ElMessage.success(`已同步：${project.name}`)
    await loadList()
  } catch {
    // 拦截器已 Toast
  } finally {
    syncingId.value = null
  }
}

async function syncAll() {
  if (isBusy.value || rows.value.length === 0) return
  syncingAll.value = true
  try {
    const token = await resolveGithubToken()
    if (!token) return

    let ok = 0
    let fail = 0
    for (const project of rows.value) {
      syncingId.value = project.id
      try {
        await syncProject(project.id, { github_token: token })
        ok += 1
      } catch {
        fail += 1
      }
    }
    if (fail === 0) {
      ElMessage.success(`全部项目同步完成（${ok}）`)
    } else {
      ElMessage.warning(`同步结束：成功 ${ok}，失败 ${fail}`)
    }
    await loadList()
  } finally {
    syncingId.value = null
    syncingAll.value = false
  }
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
        <button type="button" class="btn-ghost" :disabled="isBusy" @click="syncAll">
          {{ syncingAll ? '同步中…' : '全部同步' }}
        </button>
        <button type="button" class="btn-primary" :disabled="isBusy" @click="openCreate">
          添加项目
        </button>
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
            <button
              type="button"
              class="link muted"
              :disabled="isBusy"
              @click="syncOne(p)"
            >
              {{ syncingId === p.id ? '同步中…' : '同步' }}
            </button>
          </div>
        </article>
      </div>
    </PageState>

    <ProjectFormModal v-model:open="modalOpen" :submitting="creating" @submit="onCreate" />
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

.link:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary:disabled,
.btn-ghost:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions .btn-primary,
  .header-actions .btn-ghost {
    flex: 1;
  }

  .grid {
    grid-template-columns: 1fr;
  }

  .card-url {
    word-break: break-all;
  }
}
</style>
