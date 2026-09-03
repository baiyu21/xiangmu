<script setup lang="ts">
import { ref, reactive, watch, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { login, register, sendRegisterCode, normalizeAuthSession } from '@/api'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const activeTab = ref<'login' | 'register'>('login')
const loginLoading = ref(false)
const registerLoading = ref(false)
const codeLoading = ref(false)
const codeCountdown = ref(0)
let codeTimer: ReturnType<typeof setInterval> | null = null

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
  void router.push({ name: tab })
}

function clearCodeTimer() {
  if (codeTimer) {
    clearInterval(codeTimer)
    codeTimer = null
  }
}

function startCodeCountdown(seconds = 60) {
  clearCodeTimer()
  codeCountdown.value = seconds
  codeTimer = setInterval(() => {
    codeCountdown.value -= 1
    if (codeCountdown.value <= 0) clearCodeTimer()
  }, 1000)
}

onUnmounted(() => clearCodeTimer())

// ===== 登录 =====
const loginForm = reactive({ username: '', password: '' })
const loginErrors = reactive({ username: '', password: '' })

const validateLogin = () => {
  loginErrors.username = loginForm.username.trim() ? '' : '请输入用户名'
  loginErrors.password = loginForm.password ? '' : '请输入密码'
  return !loginErrors.username && !loginErrors.password
}

const handleLogin = async () => {
  if (!validateLogin() || loginLoading.value) return
  loginLoading.value = true
  try {
    const raw = await login({
      username: loginForm.username.trim(),
      password: loginForm.password,
    })
    const session = normalizeAuthSession(raw, loginForm.username.trim())
    userStore.setSession(session)
    ElMessage.success('登录成功')
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
    void router.push(redirect || { name: 'personal' })
  } catch {
    // 错误提示已由 request 拦截器处理
  } finally {
    loginLoading.value = false
  }
}

// ===== 注册 =====
const registerForm = reactive({
  username: '',
  name: '',
  email: '',
  code: '',
  password: '',
  confirmPassword: '',
})
const registerErrors = reactive({
  username: '',
  name: '',
  email: '',
  code: '',
  password: '',
  confirmPassword: '',
})

const validateRegister = () => {
  registerErrors.username = registerForm.username.trim() ? '' : '请输入用户名'
  registerErrors.name = registerForm.name.trim() ? '' : '请输入显示名'
  registerErrors.email = registerForm.email.trim()
    ? /\S+@\S+\.\S+/.test(registerForm.email)
      ? ''
      : '邮箱格式不正确'
    : '请输入邮箱'
  registerErrors.code = registerForm.code.trim() ? '' : '请输入验证码'
  registerErrors.password = registerForm.password.length >= 6 ? '' : '密码至少 6 位'
  registerErrors.confirmPassword =
    registerForm.confirmPassword === registerForm.password ? '' : '两次密码不一致'
  return Object.values(registerErrors).every((v) => !v)
}

const handleSendCode = async () => {
  registerErrors.email = registerForm.email.trim()
    ? /\S+@\S+\.\S+/.test(registerForm.email)
      ? ''
      : '邮箱格式不正确'
    : '请输入邮箱'
  if (registerErrors.email || codeLoading.value || codeCountdown.value > 0) return

  codeLoading.value = true
  try {
    await sendRegisterCode({ email: registerForm.email.trim() })
    ElMessage.success('验证码已发送，请查收邮箱')
    startCodeCountdown(60)
  } catch {
    // 拦截器已 Toast
  } finally {
    codeLoading.value = false
  }
}

const handleRegister = async () => {
  if (!validateRegister() || registerLoading.value) return
  registerLoading.value = true
  try {
    await register({
      username: registerForm.username.trim(),
      name: registerForm.name.trim(),
      email: registerForm.email.trim(),
      code: registerForm.code.trim(),
      password: registerForm.password,
    })
    ElMessage.success('注册成功，请登录')
    loginForm.username = registerForm.username.trim()
    loginForm.password = ''
    switchTab('login')
  } catch {
    // 拦截器已 Toast
  } finally {
    registerLoading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="bg-glow"></div>

    <div class="card">
      <div class="card-header">
        <div class="logo">DS</div>
        <div class="brand">
          <span class="brand-name">doc-sum</span>
          <span class="brand-sub">document summarization</span>
        </div>
        <h1 class="title">欢迎使用文档智能摘要系统</h1>
        <p class="desc">登录后进入工作台，管理项目文档与修改记录。</p>
      </div>

      <div class="tabs">
        <button
          type="button"
          class="tab"
          :class="{ active: activeTab === 'login' }"
          @click="switchTab('login')"
        >
          登录
        </button>
        <button
          type="button"
          class="tab"
          :class="{ active: activeTab === 'register' }"
          @click="switchTab('register')"
        >
          注册
        </button>
      </div>

      <form v-if="activeTab === 'login'" class="form" @submit.prevent="handleLogin">
        <label class="field">
          <span class="label">用户名</span>
          <input
            v-model="loginForm.username"
            type="text"
            class="input"
            autocomplete="username"
            placeholder="请输入用户名"
          />
          <span v-if="loginErrors.username" class="err">{{ loginErrors.username }}</span>
        </label>
        <label class="field">
          <span class="label">密码</span>
          <input
            v-model="loginForm.password"
            type="password"
            class="input"
            autocomplete="current-password"
            placeholder="请输入密码"
          />
          <span v-if="loginErrors.password" class="err">{{ loginErrors.password }}</span>
        </label>
        <button type="submit" class="btn-primary" :disabled="loginLoading">
          {{ loginLoading ? '登录中…' : '登录' }}
        </button>
      </form>

      <form v-else class="form" @submit.prevent="handleRegister">
        <label class="field">
          <span class="label">用户名</span>
          <input
            v-model="registerForm.username"
            type="text"
            class="input"
            autocomplete="username"
            placeholder="登录用用户名"
          />
          <span v-if="registerErrors.username" class="err">{{ registerErrors.username }}</span>
        </label>
        <label class="field">
          <span class="label">显示名</span>
          <input
            v-model="registerForm.name"
            type="text"
            class="input"
            autocomplete="nickname"
            placeholder="界面展示名称"
          />
          <span v-if="registerErrors.name" class="err">{{ registerErrors.name }}</span>
        </label>
        <label class="field">
          <span class="label">邮箱</span>
          <input
            v-model="registerForm.email"
            type="email"
            class="input"
            autocomplete="email"
            placeholder="you@example.com"
          />
          <span v-if="registerErrors.email" class="err">{{ registerErrors.email }}</span>
        </label>
        <label class="field">
          <span class="label">邮箱验证码</span>
          <div class="code-row">
            <input
              v-model="registerForm.code"
              type="text"
              class="input"
              autocomplete="one-time-code"
              placeholder="请输入验证码"
            />
            <button
              type="button"
              class="btn-code"
              :disabled="codeLoading || codeCountdown > 0"
              @click="handleSendCode"
            >
              {{
                codeCountdown > 0
                  ? `${codeCountdown}s`
                  : codeLoading
                    ? '发送中…'
                    : '发送验证码'
              }}
            </button>
          </div>
          <span v-if="registerErrors.code" class="err">{{ registerErrors.code }}</span>
        </label>
        <label class="field">
          <span class="label">密码</span>
          <input
            v-model="registerForm.password"
            type="password"
            class="input"
            autocomplete="new-password"
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
            autocomplete="new-password"
            placeholder="再次输入密码"
          />
          <span v-if="registerErrors.confirmPassword" class="err">
            {{ registerErrors.confirmPassword }}
          </span>
        </label>
        <button type="submit" class="btn-primary" :disabled="registerLoading">
          {{ registerLoading ? '提交中…' : '创建账户' }}
        </button>
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

.card {
  width: min(420px, 100%);
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
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
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

.code-row {
  display: flex;
  gap: 8px;
}

.code-row .input {
  flex: 1;
  min-width: 0;
}

.btn-code {
  flex-shrink: 0;
  padding: 0 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  color: #0f766e;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}

.btn-code:hover:not(:disabled) {
  border-color: #0f766e;
  background: #ecfdf5;
}

.btn-code:disabled {
  color: #9ca3af;
  cursor: not-allowed;
}

.err {
  font-size: 12px;
  color: #dc2626;
}

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

.btn-primary:hover:not(:disabled) {
  background: #0d9488;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .auth-page {
    padding: 20px 12px;
    align-items: flex-start;
  }

  .card {
    padding: 24px 18px 22px;
    border-radius: 14px;
  }

  .title {
    font-size: 20px;
  }

  .code-row {
    flex-direction: column;
  }

  .btn-code {
    height: 42px;
  }
}
</style>
