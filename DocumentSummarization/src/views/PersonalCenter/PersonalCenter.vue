<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import {
  getUserProfile,
  updateUserProfile,
  sendRegisterCode,
  normalizeUserProfile,
  getGithubToken,
  updateGithubToken,
  normalizeGithubToken,
} from '@/api'

const userStore = useUserStore()

/* ==================== 基本信息 ==================== */

const profileLoading = ref(false)
const profileSaving = ref(false)
const profileFormRef = ref<FormInstance>()
const profile = reactive({
  username: userStore.profile?.username || '',
  displayName: userStore.profile?.displayName || '',
  email: userStore.profile?.email || '',
  gitName: '',
  role: '',
  projects: '',
})

const profileRules: FormRules = {
  displayName: [{ required: true, message: '请输入显示名', trigger: 'blur' }],
}

function applyProfileToForm(p: {
  username: string
  displayName: string
  email?: string
  role?: string
  gitName?: string
}) {
  profile.username = p.username
  profile.displayName = p.displayName
  profile.email = p.email || ''
  if (p.role) profile.role = p.role
  if (p.gitName) profile.gitName = p.gitName
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

async function loadProfile() {
  profileLoading.value = true
  try {
    const raw = await getUserProfile()
    const normalized = normalizeUserProfile(raw, {
      username: userStore.profile?.username,
      displayName: userStore.profile?.displayName,
      email: userStore.profile?.email,
    })
    applyProfileToForm(normalized)
    userStore.patchProfile({
      username: normalized.username,
      displayName: normalized.displayName,
      email: normalized.email,
    })
  } catch {
    // 拦截器已提示；回退本地会话
    if (userStore.profile) applyProfileToForm(userStore.profile)
  } finally {
    profileLoading.value = false
  }
}

async function saveProfile() {
  if (!profileFormRef.value || profileSaving.value) return
  const valid = await profileFormRef.value.validate().catch(() => false)
  if (!valid) return

  profileSaving.value = true
  try {
    const raw = await updateUserProfile({ name: profile.displayName.trim() })
    const normalized = normalizeUserProfile(raw, {
      username: profile.username,
      displayName: profile.displayName.trim(),
      email: profile.email,
    })
    applyProfileToForm({
      ...normalized,
      displayName: normalized.displayName || profile.displayName.trim(),
    })
    userStore.patchProfile({
      username: normalized.username || profile.username,
      displayName: normalized.displayName || profile.displayName.trim(),
      email: normalized.email || profile.email,
    })
    ElMessage.success('资料已保存')
  } catch {
    // 拦截器已 Toast
  } finally {
    profileSaving.value = false
  }
}

/* ==================== 访问令牌（GitHub Token） ==================== */

const tokenLoading = ref(false)
const tokenSaving = ref(false)
const savedToken = ref('')
const tokenInput = ref('')
const tokenConfigured = ref(false)

async function loadGithubToken() {
  tokenLoading.value = true
  try {
    const raw = await getGithubToken()
    const value = normalizeGithubToken(raw)
    savedToken.value = value
    tokenInput.value = value
    tokenConfigured.value = Boolean(value)
    // 清理旧版本地占位
    localStorage.removeItem('ds_access_token')
  } catch {
    // 拦截器已提示；保持空
    savedToken.value = ''
    tokenInput.value = ''
    tokenConfigured.value = false
  } finally {
    tokenLoading.value = false
  }
}

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

async function updateToken() {
  const val = tokenInput.value.trim()
  if (!val) {
    ElMessage.warning('令牌不能为空')
    return
  }
  if (tokenSaving.value) return
  tokenSaving.value = true
  try {
    const raw = await updateGithubToken({ github_token: val })
    const next = normalizeGithubToken(raw) || val
    savedToken.value = next
    tokenInput.value = next
    tokenConfigured.value = true
    ElMessage.success('访问令牌已更新')
  } catch {
    // 拦截器已 Toast
  } finally {
    tokenSaving.value = false
  }
}

async function deleteToken() {
  if (tokenSaving.value) return
  tokenSaving.value = true
  try {
    // 后端未单独提供删除接口时，用空字符串覆盖
    await updateGithubToken({ github_token: '' })
    tokenInput.value = ''
    savedToken.value = ''
    tokenConfigured.value = false
    ElMessage.success('访问令牌已删除')
  } catch {
    // 拦截器已 Toast
  } finally {
    tokenSaving.value = false
  }
}

/* ==================== 修改密码（邮箱验证码） ==================== */

interface PasswordForm {
  newPassword: string
  confirmPassword: string
  captcha: string
}

const pwdFormRef = ref<FormInstance>()
const pwdSaving = ref(false)
const codeLoading = ref(false)
const pwdForm = reactive<PasswordForm>({
  newPassword: '',
  confirmPassword: '',
  captcha: '',
})

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
  if (countdown.value > 0 || codeLoading.value) return
  if (!profile.email) {
    ElMessage.warning('当前账号未绑定邮箱，无法发送验证码')
    return
  }
  if (!validateEmail(profile.email)) {
    ElMessage.warning('邮箱格式不正确')
    return
  }

  codeLoading.value = true
  try {
    await sendRegisterCode({ email: profile.email.trim() })
    ElMessage.success(`验证码已发送至 ${profile.email}`)
    stopCountdown()
    startCountdown()
  } catch {
    // 拦截器已 Toast
  } finally {
    codeLoading.value = false
  }
}

const passwordRules: FormRules<PasswordForm> = {
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
  captcha: [{ required: true, message: '请输入邮箱验证码', trigger: 'blur' }],
}

async function submitPassword() {
  if (!pwdFormRef.value || pwdSaving.value) return
  const valid = await pwdFormRef.value.validate().catch(() => false)
  if (!valid) return

  pwdSaving.value = true
  try {
    await updateUserProfile({
      password: pwdForm.newPassword,
      password_confirmation: pwdForm.confirmPassword,
      code: pwdForm.captcha.trim(),
    })
    ElMessage.success('密码修改成功')
    pwdForm.newPassword = ''
    pwdForm.confirmPassword = ''
    pwdForm.captcha = ''
    stopCountdown()
    pwdFormRef.value.resetFields()
  } catch {
    // 拦截器已 Toast
  } finally {
    pwdSaving.value = false
  }
}

onMounted(() => {
  void loadProfile()
  void loadGithubToken()
})

onUnmounted(() => {
  stopCountdown()
})
</script>

<template>
  <div class="page" v-loading="profileLoading">
    <header class="page-header">
      <h1>个人中心</h1>
      <p>管理你的基本信息、访问令牌和账户安全设置。</p>
    </header>

    <el-card class="card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">基本信息</span>
          <span class="card-sub">显示名可修改并同步到服务器</span>
        </div>
      </template>

      <div class="profile-body">
        <div class="avatar-wrap">
          <el-avatar :size="120" class="avatar">
            {{ userStore.avatarLetter }}
          </el-avatar>
          <span class="avatar-tip">头像首字母</span>
        </div>

        <el-form
          ref="profileFormRef"
          :model="profile"
          :rules="profileRules"
          label-width="90px"
          class="profile-form"
        >
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="用户名">
                <el-input v-model="profile.username" readonly />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="显示名" prop="displayName">
                <el-input v-model="profile.displayName" placeholder="请输入显示名" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="邮箱">
                <el-input v-model="profile.email" readonly />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="角色">
                <el-input v-model="profile.role" readonly placeholder="—" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Git 名">
                <el-input v-model="profile.gitName" readonly placeholder="—" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="可访问项目">
                <el-input v-model="profile.projects" readonly placeholder="—" />
              </el-form-item>
            </el-col>
          </el-row>
          <div class="profile-footer">
            <el-button type="primary" :loading="profileSaving" @click="saveProfile">
              保存资料
            </el-button>
          </div>
        </el-form>
      </div>
    </el-card>

    <div class="lower-row">
      <el-card class="card" shadow="never" v-loading="tokenLoading">
        <template #header>
          <div class="card-header">
            <span class="card-title">访问令牌</span>
            <span class="card-sub">
              GitHub Token（{{ tokenConfigured ? '已配置' : '未配置' }}）
            </span>
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
            令牌由服务端加密保存；当前展示长度 {{ savedToken.length }} 位
            （若后端返回掩码则非完整明文）。
          </p>
          <div class="btn-row">
            <el-button
              type="primary"
              plain
              size="small"
              :loading="tokenSaving"
              @click="updateToken"
            >
              更新 Token
            </el-button>
            <el-button
              type="danger"
              plain
              size="small"
              :loading="tokenSaving"
              @click="deleteToken"
            >
              删除 Token
            </el-button>
          </div>
        </div>
      </el-card>

      <el-card class="card" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="card-title">修改密码</span>
            <span class="card-sub">需邮箱验证码（与注册同一发码接口）</span>
          </div>
        </template>

        <el-form
          ref="pwdFormRef"
          :model="pwdForm"
          :rules="passwordRules"
          label-width="90px"
          class="pwd-form"
        >
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
            <el-input v-model="pwdForm.captcha" placeholder="请输入邮箱收到的验证码" maxlength="8">
              <template #append>
                <el-button :disabled="countdown > 0 || codeLoading" @click="sendEmailCode">
                  {{
                    countdown > 0
                      ? `${countdown}s 后重发`
                      : codeLoading
                        ? '发送中…'
                        : '发送验证码'
                  }}
                </el-button>
              </template>
            </el-input>
          </el-form-item>
          <div class="pwd-footer">
            <el-button type="primary" :loading="pwdSaving" @click="submitPassword">
              提交修改
            </el-button>
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

.avatar {
  background: #0f766e;
  color: #fff;
  font-size: 42px;
  font-weight: 600;
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

.lower-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 20px;
}

@media (max-width: 900px) {
  .lower-row {
    grid-template-columns: 1fr;
  }
  .profile-body {
    flex-direction: column;
    align-items: center;
  }
}

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

.pwd-form :deep(.el-form-item) {
  margin-bottom: 16px;
}

.pwd-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
}

@media (max-width: 640px) {
  .card :deep(.el-card__header),
  .card :deep(.el-card__body) {
    padding: 14px;
  }

  .profile-form :deep(.el-col) {
    max-width: 100%;
    flex: 0 0 100%;
  }

  .profile-form :deep(.el-form-item__label),
  .pwd-form :deep(.el-form-item__label) {
    width: 72px !important;
  }

  .profile-form :deep(.el-form-item__content),
  .pwd-form :deep(.el-form-item__content) {
    margin-left: 72px !important;
  }
}
</style>
