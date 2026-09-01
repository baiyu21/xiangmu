<script setup lang="ts">
import { computed, ref } from 'vue'
import { PageState } from '@/components'
import { useMockPageLoad } from '@/utils/useMockPageLoad'

interface UserRow {
  id: number
  name: string
  role: string
  email: string
  projects: string
  status: string
}

const MOCK_USERS: UserRow[] = [
  { id: 1, name: '唐诗雨', role: '管理员', email: 'demo@example.com', projects: '全部项目', status: '活跃' },
  { id: 2, name: '李明', role: '项目成员', email: 'liming@example.com', projects: 'A 文档库、B 合同集', status: '活跃' },
  { id: 3, name: '王芳', role: '只读成员', email: 'wangfang@example.com', projects: 'B 合同集', status: '活跃' },
]

const keyword = ref('')
const forceError = ref(false)

const { status, data, reload } = useMockPageLoad<UserRow>({
  delayMs: 350,
  fetchData: async () => {
    if (forceError.value) {
      forceError.value = false
      throw new Error('mock load failed')
    }
    return MOCK_USERS
  },
})

const filtered = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  if (!q) return data.value
  return data.value.filter(
    (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
  )
})

const viewStatus = computed(() => {
  if (status.value !== 'ready') return status.value
  return filtered.value.length === 0 ? 'empty' : 'ready'
})

function simulateError() {
  forceError.value = true
  void reload()
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1>用户管理</h1>
      <p>查看系统用户列表，分配角色与项目访问权限。</p>
    </header>

    <section class="card">
      <div class="toolbar">
        <input
          v-model="keyword"
          class="input search"
          placeholder="搜索用户名 / 邮箱"
        />
        <div class="toolbar-actions">
          <button type="button" class="btn-ghost" @click="simulateError">模拟失败</button>
          <button type="button" class="btn-primary">＋ 新建用户</button>
        </div>
      </div>

      <PageState
        :status="viewStatus"
        empty-text="没有匹配的用户"
        error-text="用户列表加载失败"
        @retry="reload"
      >
        <table class="table">
          <thead>
            <tr>
              <th>用户名</th>
              <th>邮箱</th>
              <th>角色</th>
              <th>可访问项目</th>
              <th>状态</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in filtered" :key="u.id">
              <td class="name">{{ u.name }}</td>
              <td>{{ u.email }}</td>
              <td><span class="tag">{{ u.role }}</span></td>
              <td class="muted">{{ u.projects }}</td>
              <td><span class="status-dot"></span> {{ u.status }}</td>
              <td class="actions">
                <button type="button" class="link">编辑</button>
                <button type="button" class="link danger">删除</button>
              </td>
            </tr>
          </tbody>
        </table>
      </PageState>
    </section>
  </div>
</template>

<style scoped>
.page-header h1 {
  font-size: 26px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 6px;
}

.page-header p {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 24px;
}

.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 12px;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.input {
  padding: 9px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}

.input.search {
  width: 280px;
}

.input:focus {
  border-color: #0f766e;
}

.btn-primary {
  padding: 9px 18px;
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
  color: #6b7280;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
}

.btn-ghost:hover {
  border-color: #fca5a5;
  color: #dc2626;
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
  font-size: 13px;
}

.table td {
  padding: 14px 12px;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
}

.table tr:last-child td {
  border-bottom: none;
}

.table tr:hover td {
  background: #f9fafb;
}

.name {
  font-weight: 500;
  color: #111827;
}

.muted {
  color: #6b7280;
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

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  margin-right: 6px;
}

.actions {
  text-align: right;
}

.link {
  background: none;
  border: none;
  color: #0f766e;
  cursor: pointer;
  font-size: 13px;
  margin-left: 12px;
  padding: 0;
}

.link:hover {
  text-decoration: underline;
}
.link.danger {
  color: #dc2626;
}
.link.danger:hover {
  color: #b91c1c;
}
</style>
