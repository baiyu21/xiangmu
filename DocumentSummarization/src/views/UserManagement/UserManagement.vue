<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { PageState } from '@/components'
import type { PageLoadStatus } from '@/utils/useMockPageLoad'
import {
  fetchUsers,
  createUser,
  updateUser,
  toggleUser,
  normalizeUserList,
  roleLabel,
  type UserListItem,
} from '@/api'
import EditUserManagement, { type UserFormData } from './EditUserManagement.vue'

const keyword = ref('')
const dialogOpen = ref(false)
const editing = ref<UserFormData | null>(null)
const submitting = ref(false)
const togglingId = ref<number | null>(null)
const status = ref<PageLoadStatus>('loading')
const data = ref<UserListItem[]>([])

const filtered = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  if (!q) return data.value
  return data.value.filter(
    (u) =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q),
  )
})

const viewStatus = computed(() => {
  if (status.value !== 'ready') return status.value
  return filtered.value.length === 0 ? 'empty' : 'ready'
})

const ROLE_TAG_TYPE: Record<string, 'primary' | 'success' | 'warning' | 'info'> = {
  admin: 'warning',
  管理员: 'warning',
  customer: 'success',
  客户: 'success',
  member: 'primary',
  项目成员: 'primary',
}

async function reload() {
  status.value = 'loading'
  try {
    const raw = await fetchUsers()
    data.value = normalizeUserList(raw)
    status.value = data.value.length ? 'ready' : 'empty'
  } catch {
    status.value = 'error'
  }
}

function openCreate() {
  editing.value = null
  dialogOpen.value = true
}

function openEdit(row: UserListItem) {
  editing.value = {
    id: row.id,
    username: row.username,
    name: row.name,
    email: row.email,
    role: row.role,
  }
  dialogOpen.value = true
}

async function onSubmit(payload: UserFormData) {
  if (submitting.value) return
  submitting.value = true
  try {
    if (payload.id != null) {
      const body: {
        username: string
        name: string
        email: string
        role: string
        password?: string
      } = {
        username: payload.username.trim(),
        name: payload.name.trim(),
        email: payload.email.trim(),
        role: payload.role,
      }
      if (payload.password?.trim()) {
        body.password = payload.password.trim()
      }
      await updateUser(payload.id, body)
      ElMessage.success('用户已更新')
    } else {
      await createUser({
        username: payload.username.trim(),
        name: payload.name.trim(),
        email: payload.email.trim(),
        role: payload.role,
        password: payload.password || '',
      })
      ElMessage.success('用户已创建')
    }
    dialogOpen.value = false
    await reload()
  } catch {
    // 拦截器已 Toast
  } finally {
    submitting.value = false
  }
}

async function toggleStatus(row: UserListItem) {
  if (togglingId.value != null) return
  togglingId.value = row.id
  const nextLabel = row.status === '启用' ? '停用' : '启用'
  try {
    await toggleUser(row.id)
    ElMessage.success(`已${nextLabel} ${row.name}`)
    await reload()
  } catch {
    // 拦截器已 Toast
  } finally {
    togglingId.value = null
  }
}

onMounted(() => {
  void reload()
})
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1>用户管理</h1>
      <p>查看系统用户列表，新建、编辑显示名，或切换启用/停用。</p>
    </header>

    <section class="card">
      <div class="toolbar">
        <el-input
          v-model="keyword"
          class="search"
          placeholder="搜索显示名 / 用户名 / 邮箱"
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
        <div class="table-scroll">
          <el-table :data="filtered" border stripe row-key="id" style="min-width: 720px">
            <el-table-column label="序号" type="index" align="center" width="70" />
            <el-table-column label="显示名" prop="name" min-width="100">
              <template #default="{ row }">
                <span class="name">{{ row.name }}</span>
              </template>
            </el-table-column>
            <el-table-column label="登录名" prop="username" min-width="120" />
            <el-table-column label="角色" prop="role" width="120">
              <template #default="{ row }">
                <el-tag :type="ROLE_TAG_TYPE[row.role] ?? 'primary'" effect="light" size="small">
                  {{ roleLabel(row.role) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="邮箱" prop="email" min-width="200" />
            <el-table-column label="状态" prop="status" width="100" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="row.status === '启用' ? 'success' : 'info'"
                  effect="light"
                  size="small"
                >
                  {{ row.status || '启用' }}
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
                  :loading="togglingId === row.id"
                  @click="toggleStatus(row)"
                >
                  {{ row.status === '启用' ? '停用' : '启用' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </PageState>
    </section>

    <EditUserManagement
      v-model:open="dialogOpen"
      :form-data="editing"
      :submitting="submitting"
      @submit="onSubmit"
    />
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

@media (max-width: 640px) {
  .card {
    padding: 14px;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .search {
    width: 100%;
  }

  .toolbar .el-button {
    width: 100%;
  }
}
</style>
