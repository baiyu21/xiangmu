import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import router from '@/router'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
})

request.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const userStore = useUserStore()
  if (userStore.token) {
    config.headers.Authorization = `Bearer ${userStore.token}`
  }
  return config
})

request.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError<{ msg?: string; message?: string }>) => {
    const status = error.response?.status
    const message =
      error.response?.data?.msg ||
      error.response?.data?.message ||
      error.message ||
      '请求失败'

    if (status === 401) {
      const userStore = useUserStore()
      userStore.clearAuth()
      ElMessage.error('请重新登录')
      if (router.currentRoute.value.name !== 'login') {
        void router.push({ name: 'login' })
      }
    } else {
      ElMessage.error(message)
    }

    return Promise.reject(error)
  },
)

export default request
