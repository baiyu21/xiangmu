import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
          component: () => import('../views/AIQuestionAnswer/AIQuestionAnswer.vue'),
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
