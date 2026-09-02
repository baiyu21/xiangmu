<script setup lang="ts">
import { reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const form = reactive({
  username: userStore.profile?.username || 'demo-user',
  displayName: userStore.profile?.displayName || '演示用户',
  gitName: 'demo',
  role: '管理员',
  projects: '全部项目',
})

watch(
  () => userStore.profile,
  (profile) => {
    if (!profile) return
    form.username = profile.username
    form.displayName = profile.displayName
  },
)

const maskedToken = 'ghp_************************'

const save = () => {
  if (userStore.token) {
    userStore.setSession({
      token: userStore.token,
      username: form.username.trim() || form.username,
      displayName: form.displayName.trim() || form.username,
    })
  }
  ElMessage.success('资料已保存（本地会话）')
}
const updateToken = () => ElMessage.info('Token 更新功能待接入后端')
const deleteToken = () => ElMessage.warning('Token 删除功能待接入后端')
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1>基本信息</h1>
    </header>

    <div class="page-body">
      <section class="card">
        <div class="card-title">基本信息</div>
        <div class="card-body">
          <!-- 左侧头像 -->
          <div class="avatar-wrap">
            <div class="avatar">
              <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="40" r="22" fill="#e0e7ff" />
                <ellipse cx="50" cy="85" rx="30" ry="18" fill="#2a3454ff" />
                <circle cx="42" cy="38" r="3" fill="#4b5563" />
                <circle cx="58" cy="38" r="3" fill="#4b5563" />
                <path d="M42 48 Q50 54 58 48" stroke="#4b5563" stroke-width="2" fill="none" stroke-linecap="round" />
              </svg>
            </div>
            <span class="avatar-tip">默认头像</span>
          </div>
          <!-- 右侧信息 -->
          <div class="info-area">
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
                <span>git名字</span>
                <input v-model="form.gitName" class="input" />
              </label>
              <label class="field">
                <span>角色</span>
                <input v-model="form.role" class="input" readonly />
              </label>
              <label class="field">
                <span>可访问项目</span>
                <input v-model="form.projects" class="input" />
              </label>
            </div>
            <button class="btn-primary" @click="save" type="button">保存资料</button>
          </div>
        </div>
      </section>
      <section class="card">
        <div class="card-title">访问令牌（脱敏占位）</div>
        <input :value="maskedToken" class="input"  />
        <p class="hint">用于同步私有仓库，正式环境仅服务端加密存储；当前为占位展示。</p>
        <div class="btn-row">
          <button type="button" class="btn-primary small" @click="updateToken">更新 Token</button>
          <button type="button" class="btn-danger small" @click="deleteToken">删除 Token</button>
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
  grid-template-columns: 1.5fr 1fr;
  gap: 20px;
}

.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px 28px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 24px;
  text-align: center;
}

.card-body {
  display: flex;
  gap: 48px;
  align-items: flex-start;
}

.avatar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 16px;
  overflow: hidden;
  background: #f5f3ff;
  border: 2px solid #e0e7ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar svg {
  width: 100%;
  height: 100%;
}

.avatar-tip {
  font-size: 12px;
  color: #9ca3af;
}

.info-area {
  flex: 1;
  min-width: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px 28px;
  margin-bottom: 24px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
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

.input-token {
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
