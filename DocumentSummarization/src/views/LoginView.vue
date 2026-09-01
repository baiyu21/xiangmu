<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()

const activeTab = ref<'login' | 'register'>('login')

// 根据路由同步 tab
watch(
  () => route.name,
  (name) => {
    if (name === 'register') activeTab.value = 'register'
    else activeTab.value = 'login'
  },
  { immediate: true },
)

const switchTab = (tab: 'login' | 'register') => {
  activeTab.value = tab
  router.push({ name: tab })
}

// ===== 登录表单 =====
const loginForm = reactive({ username: 'demo-user', password: '' })
const loginErrors = reactive({ username: '', password: '' })

const validateLogin = () => {
  loginErrors.username = loginForm.username.trim() ? '' : '请输入用户名'
  loginErrors.password = loginForm.password ? '' : '请输入密码'
  return !loginErrors.username && !loginErrors.password
}

const handleLogin = () => {
  if (!validateLogin()) return
  ElMessage.success('登录成功')
  router.push({ name: 'personal' })
}

// ===== 注册表单 =====
const registerForm = reactive({ username: '', email: '', password: '', confirmPassword: '' })
const registerErrors = reactive({ username: '', email: '', password: '', confirmPassword: '' })

const validateRegister = () => {
  registerErrors.username = registerForm.username.trim() ? '' : '请输入用户名'
  registerErrors.email = registerForm.email.trim()
    ? /\S+@\S+\.\S+/.test(registerForm.email)
      ? ''
      : '邮箱格式不正确'
    : '请输入邮箱'
  registerErrors.password = registerForm.password.length >= 6 ? '' : '密码至少 6 位'
  registerErrors.confirmPassword =
    registerForm.confirmPassword === registerForm.password ? '' : '两次密码不一致'
  return Object.values(registerErrors).every((v) => !v)
}

const handleRegister = () => {
  if (!validateRegister()) return
  ElMessage.success('注册成功，请登录')
  switchTab('login')
}

</script>

<template>
  <div class="auth-page">
    <!-- 顶部淡色装饰 -->
    <div class="bg-glow"></div>

    <div class="card">
      <!-- Logo + 标题 -->
      <div class="card-header">
        <div class="logo">DS</div>
        <div class="brand">
          <span class="brand-name">doc-sum</span>
          <span class="brand-sub">document summarization</span>
        </div>
        <h1 class="title">欢迎使用文档智能摘要系统</h1>
        <p class="desc">
          登录后进入工作台，上传文档即可自动生成结构化摘要与问答助手。
        </p>
      </div>

      <!-- Tab 切换 -->
      <div class="tabs">
        <button
          class="tab"
          :class="{ active: activeTab === 'login' }"
          @click="switchTab('login')"
        >
          登录
        </button>
        <button
          class="tab"
          :class="{ active: activeTab === 'register' }"
          @click="switchTab('register')"
        >
          注册
        </button>
      </div>

      <!-- 登录表单 -->
      <form v-if="activeTab === 'login'" @submit.prevent="handleLogin" class="form">
        <label class="field">
          <span class="label">用户名 / 邮箱</span>
          <input
            v-model="loginForm.username"
            type="text"
            class="input"
            placeholder="请输入用户名或邮箱"
          />
          <span v-if="loginErrors.username" class="err">{{ loginErrors.username }}</span>
        </label>
        <label class="field">
          <span class="label">密码</span>
          <input
            v-model="loginForm.password"
            type="password"
            class="input"
            placeholder="请输入密码"
          />
          <span v-if="loginErrors.password" class="err">{{ loginErrors.password }}</span>
        </label>
        <button type="submit" class="btn-primary">登录</button>
        <div class="demo-hint">
          Demo 账号：<code>demo-user</code> / 任意密码
        </div>
      </form>

      <!-- 注册表单 -->
      <form v-else @submit.prevent="handleRegister" class="form">
        <label class="field">
          <span class="label">用户名</span>
          <input
            v-model="registerForm.username"
            type="text"
            class="input"
            placeholder="3-20 个字符"
          />
          <span v-if="registerErrors.username" class="err">{{ registerErrors.username }}</span>
        </label>
        <label class="field">
          <span class="label">邮箱</span>
          <input
            v-model="registerForm.email"
            type="email"
            class="input"
            placeholder="you@example.com"
          />
          <span v-if="registerErrors.email" class="err">{{ registerErrors.email }}</span>
        </label>
        <label class="field">
          <span class="label">密码</span>
          <input
            v-model="registerForm.password"
            type="password"
            class="input"
            placeholder="至少 6 位"
          />
          <span v-if="registerErrors.password" class="err">{{ registerErrors.password }}</span>
        </label>
        <label class="field">
          <span class="label">确认密码</span>
          <input
            v-model="registerForm.confirmPassword"
            type="password"
            class="input"
            placeholder="再次输入密码"
          />
          <span
            v-if="registerErrors.confirmPassword"
            class="err"
          >{{ registerErrors.confirmPassword }}</span>
        </label>
        <button type="submit" class="btn-primary">创建账户</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8faf9;
  padding: 40px 20px;
  position: relative;
}

.bg-glow {
  position: absolute;
  top: -80px;
  left: -80px;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, #a7f3d0 0%, transparent 70%);
  pointer-events: none;
}

/* 卡片 */
.card {
  width: 420px;
  background: #ffffff;
  border-radius: 16px;
  padding: 36px 36px 32px;
  box-shadow: 0 10px 40px rgba(15, 118, 110, 0.08);
  border: 1px solid #ecfdf5;
  position: relative;
  z-index: 1;
}

.card-header {
  margin-bottom: 28px;
}

.logo {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #0f766e;
  color: #fff;
  font-weight: 700;
  font-size: 17px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.brand {
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
}

.brand-name {
  font-weight: 600;
  font-size: 15px;
  color: #111827;
}

.brand-sub {
  font-size: 12px;
  color: #9ca3af;
}

.title {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px;
  letter-spacing: -0.2px;
}

.desc {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

/* Tab */
.tabs {
  display: flex;
  background: #f3f4f6;
  border-radius: 10px;
  padding: 4px;
  margin-bottom: 24px;
}

.tab {
  flex: 1;
  padding: 9px 0;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s;
}

.tab.active {
  background: #ffffff;
  color: #0f766e;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

/* 表单 */
.form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label {
  font-size: 13px;
  color: #4b5563;
  font-weight: 500;
}

.input {
  width: 100%;
  padding: 11px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  color: #111827;
  background: #fff;
  transition: border-color 0.15s, box-shadow 0.15s;
  outline: none;
  box-sizing: border-box;
}

.input::placeholder {
  color: #9ca3af;
}

.input:focus {
  border-color: #0f766e;
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.12);
}

.err {
  font-size: 12px;
  color: #dc2626;
}

/* 主按钮 */
.btn-primary {
  margin-top: 8px;
  padding: 12px;
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

.btn-primary:active {
  background: #115e59;
}

.demo-hint {
  text-align: center;
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

.demo-hint code {
  background: #f3f4f6;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: #0f766e;
}
</style>
