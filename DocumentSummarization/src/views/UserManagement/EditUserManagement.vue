<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'

export interface UserFormData {
  id?: number
  username: string
  name: string
  email: string
  role: string
  password?: string
}

const props = defineProps<{
  open: boolean
  formData?: UserFormData | null
  submitting?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [data: UserFormData]
}>()

/** 角色：客户 / 项目成员 / 管理员 */
const ROLE_OPTIONS = [
  { label: '客户', value: 'customer' },
  { label: '项目成员', value: 'member' },
  { label: '管理员', value: 'admin' },
]

const ROLE_ALIASES: Record<string, string> = {
  customer: 'customer',
  客户: 'customer',
  member: 'member',
  项目成员: 'member',
  admin: 'admin',
  管理员: 'admin',
}

const isEditMode = computed(() => props.formData?.id != null)

const formRef = ref<FormInstance>()
const form = reactive<UserFormData>({
  username: '',
  name: '',
  email: '',
  role: 'customer',
  password: '',
})

const rules = computed<FormRules<UserFormData>>(() => ({
  username: [{ required: true, message: '请输入登录用户名', trigger: 'blur' }],
  name: [{ required: true, message: '请输入显示名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  password: isEditMode.value
    ? [
        {
          validator: (_rule, value, callback) => {
            if (!value) {
              callback()
              return
            }
            if (String(value).length < 6) {
              callback(new Error('密码至少 6 位'))
              return
            }
            callback()
          },
          trigger: 'blur',
        },
      ]
    : [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码至少 6 位', trigger: 'blur' },
      ],
}))

function normalizeRole(role?: string) {
  if (!role) return 'customer'
  return ROLE_ALIASES[role] || (ROLE_OPTIONS.some((r) => r.value === role) ? role : 'customer')
}

watch(
  () => props.open,
  (val) => {
    if (!val) return
    const d = props.formData
    form.id = d?.id
    form.username = d?.username ?? ''
    form.name = d?.name ?? ''
    form.email = d?.email ?? ''
    form.role = normalizeRole(d?.role)
    form.password = ''
    formRef.value?.clearValidate()
  },
)

function handleClose() {
  emit('update:open', false)
}

async function handleAction() {
  if (!formRef.value || props.submitting) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  emit('submit', { ...form })
}
</script>

<template>
  <el-dialog
    :model-value="open"
    :title="isEditMode ? '编辑用户' : '新建用户'"
    width="520px"
    :close-on-click-modal="false"
    append-to-body
    @update:model-value="(v: boolean) => emit('update:open', v)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="登录用户名" prop="username">
        <el-input v-model="form.username" placeholder="登录用 username" maxlength="64" />
      </el-form-item>
      <el-form-item label="显示名" prop="name">
        <el-input v-model="form.name" placeholder="界面展示名称" maxlength="64" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="form.email" placeholder="请输入邮箱" />
      </el-form-item>
      <el-form-item label="角色" prop="role">
        <el-select v-model="form.role" placeholder="请选择角色" style="width: 100%">
          <el-option
            v-for="r in ROLE_OPTIONS"
            :key="r.value"
            :label="r.label"
            :value="r.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input
          v-model="form.password"
          type="password"
          show-password
          :placeholder="isEditMode ? '不修改请留空' : '至少 6 位'"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleAction">
        {{ isEditMode ? '保存' : '创建' }}
      </el-button>
    </template>
  </el-dialog>
</template>
