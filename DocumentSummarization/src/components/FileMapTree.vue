<script setup lang="ts">
import type { TreeNode } from '@/utils/fileMap'

defineProps<{
  nodes: TreeNode[]
  scope: string
  collapsed: Set<string>
}>()

const emit = defineEmits<{
  select: [node: TreeNode]
  toggle: [key: string]
}>()
</script>

<template>
  <div v-for="node in nodes" :key="node.key" class="node">
    <button
      type="button"
      class="t-row"
      :class="{ on: scope === node.key }"
      @click="emit('select', node)"
    >
      <span
        class="caret"
        @click.stop="
          node.kids?.length && !node.fileId && node.key !== 'all'
            ? emit('toggle', node.key)
            : undefined
        "
      >
        {{
          node.kids?.length && !node.fileId && node.key !== 'all'
            ? collapsed.has(node.key)
              ? '▸'
              : '▾'
            : '·'
        }}
      </span>
      <span class="t-label">{{ node.label }}</span>
      <span class="c">{{ node.count }}</span>
    </button>
    <div
      v-if="node.kids?.length && !node.fileId && !collapsed.has(node.key) && node.key !== 'all'"
      class="t-kids"
    >
      <FileMapTree
        :nodes="node.kids"
        :scope="scope"
        :collapsed="collapsed"
        @select="emit('select', $event)"
        @toggle="emit('toggle', $event)"
      />
    </div>
  </div>
</template>

<script lang="ts">
export default { name: 'FileMapTree' }
</script>

<style scoped>
.t-row {
  width: 100%;
  border: 0;
  background: transparent;
  text-align: left;
  padding: 7px 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #4b5563;
  font-size: 13px;
  cursor: pointer;
}
.t-row:hover,
.t-row.on {
  background: #ecfdf5;
  color: #0f766e;
}
.t-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.c {
  margin-left: auto;
  font-size: 11px;
  color: #6b7280;
  background: #eef3f0;
  border-radius: 999px;
  padding: 2px 7px;
}
.t-kids {
  margin-left: 12px;
  padding-left: 8px;
  border-left: 1px dashed #c9d5cf;
}
.caret {
  width: 14px;
  color: #9ca3af;
  font-size: 11px;
  flex-shrink: 0;
}
</style>
