import { createRouter, createWebHashHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import { useUserStore } from '@/stores/user'

/**
 * 使用 Hash 路由：刷新 / 直链不会 404（不依赖 Nginx try_files）。
 * 地址形如：http://host/#/app/projects
 * 若已配置 SPA 回退且希望去掉 #，可改回 createWebHistory。
 */
const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/app',
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/app',
      component: MainLayout,
      meta: { requiresAuth: true },
      redirect: '/app/personal',
      children: [
        {
          path: 'personal',
          name: 'personal',
          component: () => import('../views/PersonalCenter/PersonalCenter.vue'),
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('../views/UserManagement/UserManagement.vue'),
        },
        {
          path: 'projects',
          name: 'projects',
          component: () => import('../views/ProjectManagement/ProjectManagement.vue'),
        },
        {
          path: 'projects/:id',
          name: 'project-overview',
          component: () => import('../views/ProjectManagement/ProjectOverview.vue'),
        },
        {
          path: 'projects/:id/files/:fileId',
          name: 'project-file',
          component: () => import('../views/ProjectManagement/ProjectFileDetail.vue'),
        },
        {
          path: 'projects/:id/files/:fileId/records/:docId',
          name: 'project-record',
          component: () => import('../views/ProjectManagement/ProjectChangeRecord.vue'),
        },
        {
          path: 'ai-qa',
          name: 'ai-qa',
          // 二期开放：一期隐藏入口，直链访问时重定向到项目管理
          redirect: { name: 'projects' },
        },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const userStore = useUserStore()
  const needsAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (needsAuth && !userStore.isAuthenticated) {
    return {
      name: 'login',
      query: to.fullPath !== '/' ? { redirect: to.fullPath } : undefined,
    }
  }

  if (to.meta.public && userStore.isAuthenticated) {
    return { name: 'personal' }
  }

  return true
})

export default router
