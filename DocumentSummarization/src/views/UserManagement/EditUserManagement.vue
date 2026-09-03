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

/** 与后端 role 字段对齐 */
const ROLE_OPTIONS = [
  { label: '管理员', value: 'admin' },
  { label: '客户', value: 'customer' },
  { label: '项目成员', value: 'member' },
  { label: '只读成员', value: 'readonly' },
]

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
  username: isEditMode.value
    ? []
    : [{ required: true, message: '请输入登录用户名', trigger: 'blur' }],
  name: [{ required: true, message: '请输入显示名', trigger: 'blur' }],
  email: isEditMode.value
    ? []
    : [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
      ],
  role: isEditMode.value
    ? []
    : [{ required: true, message: '请选择角色', trigger: 'change' }],
  password: isEditMode.value
    ? []
    : [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码至少 6 位', trigger: 'blur' },
      ],
}))

watch(
  () => props.open,
  (val) => {
    if (!val) return
    const d = props.formData
    form.id = d?.id
    form.username = d?.username ?? ''
    form.name = d?.name ?? ''
    form.email = d?.email ?? ''
    form.role = d?.role ?? 'customer'
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
      <el-form-item v-if="!isEditMode" label="登录用户名" prop="username">
        <el-input v-model="form.username" placeholder="登录用 username" maxlength="64" />
      </el-form-item>
      <el-form-item label="显示名" prop="name">
        <el-input v-model="form.name" placeholder="界面展示名称" maxlength="64" />
      </el-form-item>
      <el-form-item v-if="!isEditMode" label="邮箱" prop="email">
        <el-input v-model="form.email" placeholder="请输入邮箱" />
      </el-form-item>
      <el-form-item v-if="isEditMode" label="邮箱">
        <el-input v-model="form.email" readonly />
      </el-form-item>
      <el-form-item v-if="!isEditMode" label="角色" prop="role">
        <el-select v-model="form.role" placeholder="请选择角色" style="width: 100%">
          <el-option
            v-for="r in ROLE_OPTIONS"
            :key="r.value"
            :label="r.label"
            :value="r.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item v-if="isEditMode" label="角色">
        <el-input :model-value="form.role" readonly />
      </el-form-item>
      <el-form-item v-if="!isEditMode" label="密码" prop="password">
        <el-input
          v-model="form.password"
          type="password"
          show-password
          placeholder="至少 6 位"
        />
      </el-form-item>
      <p v-if="isEditMode" class="edit-tip">当前编辑接口仅更新显示名（name）。</p>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleAction">
        {{ isEditMode ? '保存' : '创建' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.edit-tip {
  margin: 0 0 0 100px;
  font-size: 12px;
  color: #9ca3af;
}
</style>
