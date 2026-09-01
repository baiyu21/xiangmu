<script setup lang="ts">
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'

const form = reactive({
  username: 'demo-user',
  displayName: '唐诗雨',
  email: 'demo@example.com',
  role: '管理员',
  projects: '全部项目',
})

const token = 'ghp_************************'

const save = () => ElMessage.success('资料已保存')
const updateToken = () => ElMessage.info('Token 更新功能待接入')
const deleteToken = () => ElMessage.warning('Token 删除功能待接入')
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1>个人中心</h1>
      <p>查看与修改个人资料，管理用于拉取私有仓库的访问凭证。</p>
    </header>

    <div class="page-body">
      <!-- 左侧：资料表单 -->
      <section class="card">
        <div class="card-title">基本信息</div>
        <div class="form-grid">
          <label class="field">
            <span>用户名</span>
            <input v-model="form.username" class="input" />
          </label>
          <label class="field">
            <span>显示名</span>
            <input v-model="form.displayName" class="input" />
          </label>
          <label class="field">
            <span>邮箱</span>
            <input v-model="form.email" class="input" />
          </label>
          <label class="field">
            <span>角色</span>
            <input v-model="form.role" class="input" readonly />
          </label>
          <label class="field full">
            <span>可访问项目</span>
            <input v-model="form.projects" class="input" />
          </label>
        </div>
        <button class="btn-primary" @click="save">保存资料</button>
      </section>

      <!-- 右侧：Token -->
      <section class="card">
        <div class="card-title">访问令牌（脱敏）</div>
        <input :value="token" class="input" readonly />
        <p class="hint">用于同步私有仓库，正式环境仅服务端加密存储。</p>
        <div class="btn-row">
          <button class="btn-primary small" @click="updateToken">更新 Token</button>
          <button class="btn-danger small" @click="deleteToken">删除 Token</button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 1100px;
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
  margin: 0 0 24px;
}

.page-body {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 20px;
}

.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 18px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field.full {
  grid-column: 1 / -1;
}

.field > span {
  font-size: 13px;
  color: #4b5563;
  font-weight: 500;
}

.input {
  padding: 10px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  color: #111827;
  background: #fff;
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}

.input:focus {
  border-color: #0f766e;
}

.input[readonly] {
  background: #f9fafb;
  color: #6b7280;
}

.btn-primary {
  padding: 11px 20px;
  background: #0f766e;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary:hover {
  background: #0d9488;
}

.btn-primary.small {
  padding: 8px 16px;
  font-size: 13px;
}

.btn-danger {
  padding: 8px 16px;
  background: #fff;
  color: #dc2626;
  border: 1px solid #fecaca;
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-danger:hover {
  background: #fef2f2;
  border-color: #ef4444;
}

.btn-row {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.hint {
  font-size: 12px;
  color: #9ca3af;
  margin: 12px 0 0;
  line-height: 1.5;
}
</style>
