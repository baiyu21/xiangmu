<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PageState, FileMapTree } from '@/components'
import { useProjectStore } from '@/stores/project'
import { useFileMapStore } from '@/stores/fileMap'
import {
  buildModuleNodes,
  buildRepoNodes,
  changeCountOf,
  filterFiles,
  formatPath,
  scopeLabel,
  sortFiles,
  type MapMode,
  type SortKey,
  type TreeNode,
} from '@/utils/fileMap'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const fileMapStore = useFileMapStore()

const projectId = computed(() => String(route.params.id || ''))
const project = computed(() => projectStore.getById(projectId.value))

const mode = ref<MapMode>('module')
const scope = ref('all')
const query = ref('')
const sort = ref<SortKey>('count')
const collapsed = ref(new Set<string>())

const projectFiles = computed(() => fileMapStore.filesOf(projectId.value))
const stats = computed(() => fileMapStore.projectStats(projectId.value))

const treeNodes = computed(() => {
  const list = projectFiles.value
  const all: TreeNode = {
    key: 'all',
    label: mode.value === 'module' ? '全部模块' : '全部路径',
    count: stats.value.changes,
    kids: [],
  }
  const rest =
    mode.value === 'module' ? buildModuleNodes(list) : buildRepoNodes(list)
  return [all, ...rest]
})

const tableRows = computed(() =>
  sortFiles(
    filterFiles(projectFiles.value, query.value, scope.value, mode.value),
    sort.value,
  ),
)

const pageStatus = computed(() => (project.value ? 'ready' : 'error'))

watch(mode, () => {
  scope.value = 'all'
  collapsed.value = new Set()
})

function backToList() {
  void router.push({ name: 'projects' })
}

function toggleCollapse(key: string) {
  const next = new Set(collapsed.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  collapsed.value = next
}

function onSelectNode(node: TreeNode) {
  if (node.fileId) {
    goFile(node.fileId)
    return
  }
  scope.value = node.key
}

function goFile(fileId: string) {
  void router.push({
    name: 'project-file',
    params: { id: projectId.value, fileId },
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
      @retry="backToList"
    >
      <header class="page-header">
        <div>
          <h1>文件映射</h1>
          <p>按文件查看修改次数、历史修改人与关联文档。</p>
        </div>
        <div class="seg">
          <button
            type="button"
            :class="{ on: mode === 'module' }"
            @click="mode = 'module'"
          >
            模块模式
          </button>
          <button type="button" :class="{ on: mode === 'repo' }" @click="mode = 'repo'">
            代码仓库模式
          </button>
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
        <aside class="tree">
          <h3>{{ mode === 'module' ? '模块层级' : '代码仓库层级' }}</h3>
          <div class="mode-tip">
            {{
              mode === 'module'
                ? '按业务模块归组文件，适合按功能域浏览。'
                : '按仓库目录树展开，适合按路径定位文件。'
            }}
          </div>
          <FileMapTree
            :nodes="treeNodes"
            :scope="scope"
            :collapsed="collapsed"
            @select="onSelectNode"
            @toggle="toggleCollapse"
          />
        </aside>

        <section class="list">
          <div class="list-hd">
            <div>
              <span class="muted-label">当前范围</span>
              <strong>{{ scopeLabel(scope, mode) }}</strong>
            </div>
            <span class="tag teal">{{ tableRows.length }} files</span>
          </div>
          <div class="list-bd">
            <table v-if="tableRows.length" class="table">
              <thead>
                <tr>
                  <th>文件</th>
                  <th>修改次数</th>
                  <th>历史修改人</th>
                  <th>最近修改</th>
                  <th>关联文档</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="f in tableRows"
                  :key="f.id"
                  class="hit"
                  @click="goFile(f.id)"
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
                    <div class="people">
                      <span v-for="a in f.authors" :key="a" class="tag">@{{ a }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="mono">{{ f.lastAt }}</div>
                    <div class="sub">@{{ f.lastAuthor }}</div>
                  </td>
                  <td><span class="tag teal">{{ f.docs.length }} 篇</span></td>
                  <td>
                    <button type="button" class="btn-sm" @click.stop="goFile(f.id)">
                      详情
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty">当前范围没有匹配的文件</div>
          </div>
        </section>
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
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
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
.seg {
  display: flex;
  gap: 4px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 4px;
}
.seg button {
  border: none;
  background: transparent;
  padding: 7px 12px;
  border-radius: 8px;
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
}
.seg button.on {
  background: #ecfdf5;
  color: #0f766e;
  font-weight: 500;
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
  grid-template-columns: 270px 1fr;
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
.tree,
.list {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}
.tree {
  padding: 12px;
}
.tree h3,
.muted-label {
  margin: 0 0 10px;
  font-size: 11px;
  color: #6b7280;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-weight: 500;
}
.mode-tip {
  margin-bottom: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #f5f8f6;
  font-size: 12px;
  color: #4b5563;
}
.list-hd {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid #e5e7eb;
}
.list-hd strong {
  display: block;
  font-size: 14px;
  color: #111827;
  margin-top: 2px;
}
.list-bd {
  overflow: auto;
  max-height: 620px;
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
  padding: 12px 14px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: #f7faf8;
}
.table td {
  padding: 12px 14px;
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
.people {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.people .tag {
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
</style>
