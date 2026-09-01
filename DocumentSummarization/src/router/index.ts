import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/app',
      component: MainLayout,
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
          path: 'ai-qa',
          name: 'ai-qa',
          component: () => import('../views/AIQuestionAnswer/AIQuestionAnswer.vue'),
        },
      ],
    },
  ],
})

export default router
