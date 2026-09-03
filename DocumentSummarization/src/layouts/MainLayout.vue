<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter, useRoute, RouterView } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

interface NavItem {
  path: string
  name: string
  label: string
  subtitle?: string
}

const navItems: NavItem[] = [
  { path: '/app/users', name: 'users', label: '用户管理', subtitle: '账号' },
  { path: '/app/projects', name: 'projects', label: '项目管理', subtitle: '入口' },
  // AI 问答：二期开放，一期先从侧栏隐藏
  // { path: '/app/ai-qa', name: 'ai-qa', label: 'AI 问答', subtitle: '按项目' },
  { path: '/app/personal', name: 'personal', label: '个人中心', subtitle: '资料' },
]

const sidebarOpen = ref(false)

const activeName = computed(() => {
  if (
    route.name === 'project-overview' ||
    route.name === 'project-file' ||
    route.name === 'project-record'
  ) {
    return 'projects'
  }
  return route.name
})
const displayName = computed(() => userStore.profile?.displayName || '未登录')
const username = computed(() => userStore.profile?.username || '-')
const pageTitle = computed(() => {
  const item = navItems.find((n) => n.name === activeName.value)
  return item?.label || '工作台'
})

watch(
  () => route.fullPath,
  () => {
    sidebarOpen.value = false
  },
)

function navigate(name: string) {
  sidebarOpen.value = false
  void router.push({ name })
}

const handleLogout = () => {
  userStore.clearAuth()
  sidebarOpen.value = false
  void router.push({ name: 'login' })
}
</script>

<template>
  <div class="layout" :class="{ 'sidebar-open': sidebarOpen }">
    <div
      class="sidebar-mask"
      :class="{ show: sidebarOpen }"
      @click="sidebarOpen = false"
    ></div>

    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="brand">
        <div class="logo">DS</div>
        <div class="brand-text">
          <span class="brand-name">doc-sum</span>
          <span class="brand-sub">document summarization</span>
        </div>
        <button
          type="button"
          class="sidebar-close"
          aria-label="关闭菜单"
          @click="sidebarOpen = false"
        >
          ×
        </button>
      </div>

      <nav class="nav">
        <div class="nav-group">
          <span class="nav-group-title">工作台</span>
          <button
            v-for="item in navItems"
            :key="item.name"
            class="nav-item"
            :class="{ active: activeName === item.name }"
            @click="navigate(item.name)"
          >
            <span class="nav-label">{{ item.label }}</span>
            <span v-if="item.subtitle" class="nav-sub">{{ item.subtitle }}</span>
          </button>
        </div>
      </nav>

      <div class="user-card">
        <div class="user-avatar">{{ userStore.avatarLetter }}</div>
        <div class="user-info">
          <div class="user-name">{{ displayName }}</div>
          <div class="user-handle">@{{ username }}</div>
        </div>
        <button class="logout-btn" @click="handleLogout" title="退出">退出</button>
      </div>
    </aside>

    <div class="content">
      <header class="mobile-bar">
        <button
          type="button"
          class="menu-btn"
          aria-label="打开菜单"
          @click="sidebarOpen = true"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div class="mobile-title">{{ pageTitle }}</div>
        <div class="mobile-avatar">{{ userStore.avatarLetter }}</div>
      </header>

      <main class="main">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
  background: #f4f6f8;
}

.sidebar-mask {
  display: none;
}

.sidebar {
  width: 220px;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  z-index: 40;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 20px 24px;
}

.logo {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #0f766e;
  color: #fff;
  font-weight: 700;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  min-width: 0;
}

.brand-name {
  font-weight: 600;
  font-size: 15px;
  color: #111827;
}

.brand-sub {
  font-size: 11px;
  color: #9ca3af;
}

.sidebar-close {
  display: none;
  margin-left: auto;
  border: none;
  background: #f3f4f6;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 22px;
  line-height: 1;
  color: #6b7280;
  cursor: pointer;
}

.nav {
  flex: 1;
  padding: 8px 12px;
}

.nav-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-group-title {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 500;
  padding: 16px 12px 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.nav-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 9px 12px;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  color: #4b5563;
  transition: all 0.15s;
  text-align: left;
  width: 100%;
}

.nav-item:hover {
  background: #f3f4f6;
  color: #111827;
}

.nav-item.active {
  background: #ecfdf5;
  color: #0f766e;
  font-weight: 500;
}

.nav-sub {
  font-size: 12px;
  color: #9ca3af;
}

.nav-item.active .nav-sub {
  color: #0d9488;
  opacity: 0.8;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  margin: 12px;
  background: #f9fafb;
  border-radius: 10px;
  border: 1px solid #f3f4f6;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #0f766e;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-handle {
  font-size: 11px;
  color: #9ca3af;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logout-btn {
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #6b7280;
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}

.logout-btn:hover {
  border-color: #ef4444;
  color: #ef4444;
}

.content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.mobile-bar {
  display: none;
}

.main {
  flex: 1;
  padding: 32px 40px;
  overflow-y: auto;
  overflow-x: hidden;
}

@media (max-width: 900px) {
  .sidebar-mask {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(17, 24, 39, 0.45);
    z-index: 35;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
  }

  .sidebar-mask.show {
    opacity: 1;
    pointer-events: auto;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    width: min(280px, 86vw);
    transform: translateX(-105%);
    transition: transform 0.22s ease;
    box-shadow: 8px 0 24px rgba(15, 23, 42, 0.08);
    border-right: none;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .sidebar-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .mobile-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    position: sticky;
    top: 0;
    z-index: 20;
    height: 56px;
    padding: 0 14px;
    background: #fff;
    border-bottom: 1px solid #e5e7eb;
  }

  .menu-btn {
    width: 40px;
    height: 40px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #fff;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    padding: 0;
  }

  .menu-btn span {
    display: block;
    width: 16px;
    height: 2px;
    background: #374151;
    border-radius: 1px;
  }

  .mobile-title {
    flex: 1;
    font-size: 16px;
    font-weight: 600;
    color: #111827;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mobile-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #0f766e;
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .main {
    padding: 16px 14px 28px;
  }
}

@media (max-width: 480px) {
  .main {
    padding: 12px 10px 24px;
  }
}
</style>
