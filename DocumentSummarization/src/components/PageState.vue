<script setup lang="ts">
defineProps<{
  status: 'loading' | 'ready' | 'empty' | 'error'
  emptyText?: string
  errorText?: string
}>()

defineEmits<{
  retry: []
}>()
</script>

<template>
  <div v-if="status === 'loading'" class="state">
    <div class="spinner" aria-hidden="true"></div>
    <p>加载中…</p>
  </div>
  <div v-else-if="status === 'empty'" class="state">
    <p>{{ emptyText || '暂无数据' }}</p>
  </div>
  <div v-else-if="status === 'error'" class="state">
    <p class="error">{{ errorText || '加载失败，请稍后重试' }}</p>
    <button type="button" class="retry" @click="$emit('retry')">重试</button>
  </div>
  <slot v-else />
</template>

<style scoped>
.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 180px;
  color: var(--color-text-muted, #6b7280);
  font-size: 14px;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #e5e7eb;
  border-top-color: var(--color-brand, #0f766e);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error {
  color: #dc2626;
  margin: 0;
}

.retry {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  color: var(--color-brand, #0f766e);
  cursor: pointer;
  font-size: 13px;
}

.retry:hover {
  border-color: var(--color-brand, #0f766e);
  background: #ecfdf5;
}
</style>
