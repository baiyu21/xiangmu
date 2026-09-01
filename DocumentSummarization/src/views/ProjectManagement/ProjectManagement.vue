<script setup lang="ts">
const projects = [
  { id: 1, name: 'A 文档库', desc: '产品需求文档、技术设计文档合集', docs: 128, updated: '2026-08-28', color: '#0f766e' },
  { id: 2, name: 'B 合同集', desc: '历史合同与协议扫描件归档', docs: 54, updated: '2026-08-20', color: '#7c3aed' },
  { id: 3, name: 'C 财务报告', desc: '季度财报与审计材料', docs: 32, updated: '2026-08-15', color: '#ea580c' },
  { id: 4, name: 'D 会议纪要', desc: '重要会议记录与决议', docs: 210, updated: '2026-08-30', color: '#0891b2' },
]
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1>项目管理</h1>
      <p>创建、管理文档项目，每个项目独立维护一套摘要与索引。</p>
    </header>

    <div class="toolbar">
      <div class="tabs">
        <button class="tab active">全部</button>
        <button class="tab">我拥有的</button>
        <button class="tab">共享给我</button>
      </div>
      <button class="btn-primary">＋ 新建项目</button>
    </div>

    <div class="grid">
      <div v-for="p in projects" :key="p.id" class="card">
        <div class="card-top">
          <div class="dot" :style="{ background: p.color }"></div>
          <div class="card-name">{{ p.name }}</div>
        </div>
        <p class="card-desc">{{ p.desc }}</p>
        <div class="card-meta">
          <span><strong>{{ p.docs }}</strong> 份文档</span>
          <span class="muted">更新于 {{ p.updated }}</span>
        </div>
        <div class="card-footer">
          <button class="link">进入项目 →</button>
          <button class="link muted">设置</button>
        </div>
      </div>
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
  margin: 0 0 24px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.tabs {
  display: flex;
  gap: 4px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 4px;
}

.tab {
  padding: 6px 14px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s;
}

.tab:hover { color: #111827; }

.tab.active {
  background: #ecfdf5;
  color: #0f766e;
  font-weight: 500;
}

.btn-primary {
  padding: 9px 18px;
  background: #0f766e;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.btn-primary:hover { background: #0d9488; }

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
}

.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 22px;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.card:hover {
  border-color: #a7f3d0;
  box-shadow: 0 4px 20px rgba(15, 118, 110, 0.08);
}

.card-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.card-name {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
}

.card-desc {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 16px;
  line-height: 1.5;
  min-height: 38px;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 16px;
  padding-top: 14px;
  border-top: 1px solid #f3f4f6;
}

.card-meta strong {
  color: #0f766e;
  font-weight: 600;
}

.muted {
  color: #9ca3af;
}

.card-footer {
  display: flex;
  gap: 12px;
}

.link {
  background: none;
  border: none;
  color: #0f766e;
  cursor: pointer;
  font-size: 13px;
  padding: 0;
}

.link:hover { text-decoration: underline; }
.link.muted { color: #9ca3af; }
.link.muted:hover { color: #6b7280; }
</style>
