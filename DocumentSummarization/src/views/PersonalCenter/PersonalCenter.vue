<script setup lang="ts">
import { onUnmounted, reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

/* ==================== 基本信息 ==================== */

const profileFormRef = ref<FormInstance>()
const profile = reactive({
  username: userStore.profile?.username || 'demo-user',
  displayName: userStore.profile?.displayName || '演示用户',
  email: userStore.profile?.email || 'demo@example.com',
  gitName: 'demo',
  role: '管理员',
  projects: '全部项目',
})

const profileRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  displayName: [{ required: true, message: '请输入显示名', trigger: 'blur' }],
}

watch(
  () => userStore.profile,
  (p) => {
    if (!p) return
    profile.username = p.username
    profile.displayName = p.displayName
    profile.email = p.email ?? profile.email
  },
)

async function saveProfile() {
  if (!profileFormRef.value) return
  await profileFormRef.value.validate((valid) => {
    if (!valid) return
    if (userStore.token) {
      userStore.setSession({
        token: userStore.token,
        username: profile.username.trim(),
        displayName: profile.displayName.trim(),
        email: profile.email,
      })
    }
    ElMessage.success('资料已保存（本地会话）')
  })
}

/* ==================== 访问令牌 ==================== */

const TOKEN_STORAGE_KEY = 'ds_access_token'

const savedToken = ref('')
const tokenInput = ref('')

function loadToken() {
  let stored = localStorage.getItem(TOKEN_STORAGE_KEY) || ''
  if (!stored) {
    stored = 'ghp_demoTokenPlaceholder1234567890'
    localStorage.setItem(TOKEN_STORAGE_KEY, stored)
  }
  savedToken.value = stored
  tokenInput.value = stored
}
loadToken()

async function pasteToken() {
  try {
    if (!navigator.clipboard?.readText) {
      ElMessage.warning('当前浏览器不支持自动粘贴,请手动 Ctrl+V')
      return
    }
    const text = await navigator.clipboard.readText()
    if (!text || !text.trim()) {
      ElMessage.warning('剪贴板为空,请先复制令牌')
      return
    }
    tokenInput.value = text.trim()
    ElMessage.success('已从剪贴板粘贴')
  } catch {
    ElMessage.warning('粘贴失败,请手动 Ctrl+V(或授权剪贴板读取权限)')
  }
}

function updateToken() {
  const val = tokenInput.value.trim()
  if (!val) {
    ElMessage.warning('令牌不能为空')
    return
  }
  localStorage.setItem(TOKEN_STORAGE_KEY, val)
  savedToken.value = val
  ElMessage.success('访问令牌已保存')
}

function deleteToken() {
  tokenInput.value = ''
  savedToken.value = ''
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  ElMessage.success('访问令牌已删除')
}

/* ==================== 修改密码（邮箱验证码） ==================== */

interface PasswordForm {
  oldPassword: string
  newPassword: string
  confirmPassword: string
  captcha: string
}

const pwdFormRef = ref<FormInstance>()
const pwdForm = reactive<PasswordForm>({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
  captcha: '',
})

const emailCode = ref('')
const countdown = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null

function startCountdown() {
  countdown.value = 60
  countdownTimer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      if (countdownTimer) clearInterval(countdownTimer)
      countdownTimer = null
      countdown.value = 0
    }
  }, 1000)
}

function stopCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  countdown.value = 0
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function sendEmailCode() {
  if (countdown.value > 0) return
  if (!profile.email) {
    ElMessage.warning('请先在基本信息中填写邮箱')
    return
  }
  if (!validateEmail(profile.email)) {
    ElMessage.warning('邮箱格式不正确')
    return
  }
  // 生成 6 位数字验证码（后端接入后改为真实请求）
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  emailCode.value = code
  pwdForm.captcha = ''
  stopCountdown()
  startCountdown()
  ElMessage.info(`验证码已发送至 ${profile.email}（演示模式：${code}）`)
}

const passwordRules: FormRules<PasswordForm> = {
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度 6-32 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== pwdForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
  captcha: [
    { required: true, message: '请输入邮箱验证码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (!emailCode.value) {
          callback(new Error('请先获取验证码'))
          return
        }
        if (value.trim() !== emailCode.value) {
          callback(new Error('验证码不正确'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

async function submitPassword() {
  if (!pwdFormRef.value) return
  await pwdFormRef.value.validate((valid) => {
    if (!valid) return
    ElMessage.success('密码修改成功（模拟）')
    pwdForm.oldPassword = ''
    pwdForm.newPassword = ''
    pwdForm.confirmPassword = ''
    pwdForm.captcha = ''
    emailCode.value = ''
    stopCountdown()
  })
}

onUnmounted(() => {
  stopCountdown()
})
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1>个人中心</h1>
      <p>管理你的基本信息、访问令牌和账户安全设置。</p>
    </header>

    <!-- 上：基本信息 -->
    <el-card class="card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">基本信息</span>
          <span class="card-sub">查看并编辑你的账户资料</span>
        </div>
      </template>

      <div class="profile-body">
        <!-- 头像 -->
        <div class="avatar-wrap">
          <el-avatar :size="120" class="avatar">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="40" r="22" fill="#e0e7ff" />
              <ellipse cx="50" cy="85" rx="30" ry="18" fill="#2a3454" />
              <circle cx="42" cy="38" r="3" fill="#4b5563" />
              <circle cx="58" cy="38" r="3" fill="#4b5563" />
              <path d="M42 48 Q50 54 58 48" stroke="#4b5563" stroke-width="2" fill="none" stroke-linecap="round" />
            </svg>
          </el-avatar>
          <span class="avatar-tip">默认头像</span>
        </div>

        <!-- 双列字段网格 -->
        <el-form
          ref="profileFormRef"
          :model="profile"
          :rules="profileRules"
          label-width="90px"
          class="profile-form"
        >
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="用户名" prop="username">
                <el-input v-model="profile.username" placeholder="请输入用户名" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="显示名" prop="displayName">
                <el-input v-model="profile.displayName" placeholder="请输入显示名" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Git 名">
                <el-input v-model="profile.gitName" placeholder="请输入 Git 用户名" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="角色">
                <el-input v-model="profile.role" readonly />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="邮箱">
                <el-input v-model="profile.email" readonly />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="可访问项目">
                <el-input v-model="profile.projects" placeholder="请输入可访问项目" />
              </el-form-item>
            </el-col>
          </el-row>
          <div class="profile-footer">
            <el-button type="primary" @click="saveProfile">保存资料</el-button>
          </div>
        </el-form>
      </div>
    </el-card>

    <!-- 下：两个并排卡片 -->
    <div class="lower-row">
      <!-- 访问令牌 -->
      <el-card class="card" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="card-title">访问令牌</span>
            <span class="card-sub">用于同步私有仓库（当前为占位）</span>
          </div>
        </template>

        <div class="token-body">
          <el-input
            v-model="tokenInput"
            type="password"
            show-password
            placeholder="请输入 GitHub Personal Access Token"
          >
            <template #append>
              <el-button @click="pasteToken">粘贴</el-button>
            </template>
          </el-input>
          <p class="hint">
            令牌存储在浏览器本地(localStorage),当前值长度 {{ savedToken.length }} 位。
          </p>
          <div class="btn-row">
            <el-button type="primary" plain size="small" @click="updateToken">更新 Token</el-button>
            <el-button type="danger" plain size="small" @click="deleteToken">删除 Token</el-button>
          </div>
        </div>
      </el-card>

      <!-- 修改密码 -->
      <el-card class="card" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="card-title">修改密码</span>
            <span class="card-sub">通过邮箱验证码验证</span>
          </div>
        </template>

        <el-form
          ref="pwdFormRef"
          :model="pwdForm"
          :rules="passwordRules"
          label-width="90px"
          class="pwd-form"
        >
          <el-form-item label="旧密码" prop="oldPassword">
            <el-input
              v-model="pwdForm.oldPassword"
              type="password"
              show-password
              placeholder="请输入当前密码"
            />
          </el-form-item>
          <el-form-item label="新密码" prop="newPassword">
            <el-input
              v-model="pwdForm.newPassword"
              type="password"
              show-password
              placeholder="6-32 位"
            />
          </el-form-item>
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="pwdForm.confirmPassword"
              type="password"
              show-password
              placeholder="再次输入新密码"
            />
          </el-form-item>
          <el-form-item label="验证码" prop="captcha">
            <el-input v-model="pwdForm.captcha" placeholder="请输入邮箱收到的验证码" maxlength="6">
              <template #append>
                <el-button
                  :disabled="countdown > 0"
                  @click="sendEmailCode"
                >
                  {{ countdown > 0 ? `${countdown}s 后重发` : '发送验证码' }}
                </el-button>
              </template>
            </el-input>
          </el-form-item>
          <div class="pwd-footer">
            <el-button type="primary" @click="submitPassword">提交修改</el-button>
          </div>
        </el-form>
      </el-card>
    </div>
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
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.card :deep(.el-card__header) {
  padding: 18px 24px 14px;
  border-bottom: 1px solid #f3f4f6;
}

.card :deep(.el-card__body) {
  padding: 22px 24px;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.card-sub {
  font-size: 12px;
  color: #9ca3af;
}

/* 基本信息 */
.profile-body {
  display: flex;
  gap: 40px;
  align-items: flex-start;
}

.avatar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  padding-top: 4px;
}

.avatar :deep(.el-avatar) {
  background: #f5f3ff;
  border: 2px solid #e0e7ff;
  border-radius: 16px;
}

.avatar-tip {
  font-size: 12px;
  color: #9ca3af;
}

.profile-form {
  flex: 1;
  min-width: 0;
}

.profile-form :deep(.el-form-item) {
  margin-bottom: 18px;
}

.profile-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
}

/* 下方并排 */
.lower-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
}

/* 令牌 */
.token-body .hint {
  font-size: 12px;
  color: #9ca3af;
  margin: 10px 0 0;
  line-height: 1.5;
}

.token-body .btn-row {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

/* 修改密码 */
.pwd-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.pwd-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
}
</style>
