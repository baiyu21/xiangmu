<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'

interface UserFormData {
  id?: number
  name: string
  email: string
  gitName: string
  role: string
  projects: string
  status: string
}

const props = defineProps<{
  open: boolean
  formData?: UserFormData | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [data: UserFormData]
}>()

const ROLE_OPTIONS = ['管理员', '项目成员', '只读成员']
const PROJECT_OPTIONS = ['rd-xmz', 'school-portal']

const isEditMode = computed(() => props.formData?.id != null)

const formRef = ref<FormInstance>()
const form = reactive<UserFormData>({
  name: '',
  email: '',
  gitName: '',
  role: '项目成员',
  projects: '',
  status: '启用',
})

// 表单内用数组做多选，提交时与列表行 projects(string) 字段保持契约一致
const projectList = computed<string[]>({
  get: () => form.projects.split(',').map((s) => s.trim()).filter(Boolean),
  set: (val) => {
    form.projects = val.join(', ')
  },
})

const rules: FormRules<UserFormData> = {
  name: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  gitName: [{ required: true, message: '请输入 Git 用户名', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
}

// 打开时回填，关闭时清空校验态
watch(
  () => props.open,
  (val) => {
    if (!val) return
    const d = props.formData
    form.id = d?.id
    form.name = d?.name ?? ''
    form.email = d?.email ?? ''
    form.gitName = d?.gitName ?? ''
    form.role = d?.role ?? '项目成员'
    form.projects = d?.projects ?? ''
    form.status = d?.status ?? '启用'
    formRef.value?.clearValidate()
  },
)

function handleClose() {
  emit('update:open', false)
}

async function handleAction() {
  if (!formRef.value) return
  await formRef.value.validate((valid) => {
    if (!valid) return
    emit('submit', { ...form })
    ElMessage.success(isEditMode.value ? '用户已更新' : '用户已创建')
    emit('update:open', false)
  })
}
</script>

<template>
  <el-dialog
    :model-value="open"
    :title="isEditMode ? '编辑用户' : '新建用户'"
    width="560px"
    :close-on-click-modal="false"
    append-to-body
    @update:model-value="(v: boolean) => emit('update:open', v)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="用户名" prop="name">
        <el-input v-model="form.name" placeholder="请输入用户名" maxlength="32" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="form.email" placeholder="请输入邮箱" />
      </el-form-item>
      <el-form-item label="Git 用户名" prop="gitName">
        <el-input v-model="form.gitName" placeholder="请输入 Git 用户名" />
      </el-form-item>
      <el-form-item label="角色" prop="role">
        <el-select v-model="form.role" placeholder="请选择角色" style="width: 100%">
          <el-option v-for="r in ROLE_OPTIONS" :key="r" :label="r" :value="r" />
        </el-select>
      </el-form-item>
      <el-form-item label="所属项目" prop="projects">
        <el-select
          v-model="projectList"
          multiple
          placeholder="请选择项目"
          style="width: 100%"
        >
          <el-option v-for="p in PROJECT_OPTIONS" :key="p" :label="p" :value="p" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio value="启用">启用</el-radio>
          <el-radio value="停用">停用</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleAction">
        {{ isEditMode ? '保存' : '创建' }}
      </el-button>
    </template>
  </el-dialog>
</template>
