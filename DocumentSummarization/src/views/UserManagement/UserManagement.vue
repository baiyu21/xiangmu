<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { PageState } from '@/components'
import { useMockPageLoad } from '@/utils/useMockPageLoad'
import EditUserManagement from './EditUserManagement.vue'

interface UserRow {
  id: number
  name: string
  role: string
  gitName: string
  email: string
  projects: string
  status: string
}

const MOCK_USERS: UserRow[] = [
  { id: 1, name: '李明', role: '项目成员', gitName: 'liming', email: 'liming@example.com', projects: 'rd-xmz', status: '启用' },
  { id: 2, name: '王芳', role: '只读成员', gitName: 'wangfang', email: 'wangfang@example.com', projects: 'school-portal', status: '启用' },
]

const keyword = ref('')
const dialogOpen = ref(false)
const editing = ref<UserRow | null>(null)

const { status, data, reload } = useMockPageLoad<UserRow>({
  delayMs: 350,
  fetchData: async () => MOCK_USERS,
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

const ROLE_TAG_TYPE: Record<string, 'primary' | 'success' | 'warning' | 'info'> = {
  管理员: 'warning',
  项目成员: 'success',
  只读成员: 'info',
}

function openCreate() {
  editing.value = null
  dialogOpen.value = true
}

function openEdit(row: UserRow) {
  editing.value = { ...row }
  dialogOpen.value = true
}

function onSubmit(payload: {
  id?: number
  name: string
  email: string
  gitName: string
  role: string
  projects: string
  status: string
}) {
  if (payload.id != null) {
    const idx = data.value.findIndex((u) => u.id === payload.id)
    if (idx !== -1) {
      data.value[idx] = { ...data.value[idx], ...payload, id: payload.id }
    }
    ElMessage.success('用户已更新')
  } else {
    const newId = data.value.length ? Math.max(...data.value.map((u) => u.id)) + 1 : 1
    data.value.push({ ...payload, id: newId })
    ElMessage.success('用户已创建')
  }
}

async function toggleStatus(row: UserRow) {
  row.status = row.status === '启用' ? '停用' : '启用'
  ElMessage.success(`已${row.status} ${row.name}`)
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
        <el-input
          v-model="keyword"
          class="search"
          placeholder="搜索用户名 / 邮箱"
          clearable
        />
        <el-button type="primary" @click="openCreate">＋ 新建用户</el-button>
      </div>

      <PageState
        :status="viewStatus"
        empty-text="暂无匹配的用户数据"
        error-text="用户列表加载失败"
        @retry="reload"
      >
        <el-table :data="filtered" border stripe row-key="id">
          <el-table-column label="序号" type="index" align="center" width="70" />
          <el-table-column label="姓名" prop="name" min-width="100">
            <template #default="{ row }">
              <span class="name">{{ row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column label="角色" prop="role" width="120">
            <template #default="{ row }">
              <el-tag :type="ROLE_TAG_TYPE[row.role] ?? 'primary'" effect="light" size="small">
                {{ row.role }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Git 用户名" prop="gitName" min-width="120" />
          <el-table-column label="邮箱" prop="email" min-width="200" />
          <el-table-column label="所属项目" prop="projects" min-width="140" />
          <el-table-column label="状态" prop="status" width="100" align="center">
            <template #default="{ row }">
              <el-tag
                :type="row.status === '启用' ? 'success' : 'info'"
                effect="light"
                size="small"
              >
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right" align="center">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
              <el-button
                link
                :type="row.status === '启用' ? 'warning' : 'success'"
                size="small"
                @click="toggleStatus(row)"
              >
                {{ row.status === '启用' ? '停用' : '启用' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </PageState>
    </section>

    <EditUserManagement v-model:open="dialogOpen" :form-data="editing" @submit="onSubmit" />
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
  margin: 0 0 20px;
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

.search {
  width: 280px;
}

.name {
  font-weight: 500;
  color: #111827;
}
</style>
