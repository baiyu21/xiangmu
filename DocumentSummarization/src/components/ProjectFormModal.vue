<script setup lang="ts">
import { reactive, watch } from 'vue'

const open = defineModel<boolean>('open', { default: false })

const emit = defineEmits<{
  submit: [payload: { url: string; branch: string }]
}>()

const form = reactive({ url: '', branch: 'main' })
const errors = reactive({ url: '' })

watch(open, (value) => {
  if (value) {
    form.url = ''
    form.branch = 'main'
    errors.url = ''
  }
})

function close() {
  open.value = false
}

function submit() {
  errors.url = form.url.trim() ? '' : '请输入仓库地址'
  if (errors.url) return
  emit('submit', { url: form.url.trim(), branch: form.branch.trim() || 'main' })
  open.value = false
}
</script>

<template>
  <div v-if="open" class="mask" @click.self="close">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="project-modal-title">
      <h3 id="project-modal-title">添加项目</h3>
      <div class="stack">
        <label class="field">
          <span>仓库地址</span>
          <input
            v-model="form.url"
            type="url"
            class="input"
            placeholder="https://github.com/org/repo.git"
          />
          <span v-if="errors.url" class="err">{{ errors.url }}</span>
        </label>
        <label class="field">
          <span>默认分支</span>
          <input v-model="form.branch" type="text" class="input" placeholder="main" />
        </label>
        <div class="actions">
          <button type="button" class="btn-ghost" @click="close">取消</button>
          <button type="button" class="btn-primary" @click="submit">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mask {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(18, 26, 23, 0.35);
}

.modal {
  width: min(440px, 100%);
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 22px 22px 18px;
  box-shadow: 0 12px 32px rgba(18, 26, 23, 0.08);
}

.modal h3 {
  margin: 0 0 16px;
  font-size: 18px;
  color: #111827;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #4b5563;
  font-weight: 500;
}

.input {
  padding: 10px 12px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  color: #111827;
  outline: none;
}

.input:focus {
  border-color: #0f766e;
}

.err {
  color: #dc2626;
  font-size: 12px;
  font-weight: 400;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

.btn-primary {
  padding: 9px 16px;
  background: #0f766e;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary:hover {
  background: #0d9488;
}

.btn-ghost {
  padding: 9px 16px;
  background: #fff;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
}

.btn-ghost:hover {
  border-color: #0f766e;
  color: #0f766e;
}
</style>
