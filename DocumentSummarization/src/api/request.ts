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

function isBizPayload(payload: unknown): payload is {
  code: number | string
  msg?: string
  message?: string
  data?: unknown
} {
  return Boolean(payload && typeof payload === 'object' && 'code' in payload)
}

function isBizSuccess(code: number | string) {
  return code === 0 || code === 200 || code === '0' || code === '200'
}

request.interceptors.response.use(
  (response) => {
    const payload = response.data

    // 统一包装：{ code, message|msg, data }
    if (isBizPayload(payload)) {
      if (isBizSuccess(payload.code)) {
        return payload.data !== undefined ? payload.data : payload
      }
      const message = payload.msg || payload.message || '请求失败'
      ElMessage.error(message)
      return Promise.reject(payload)
    }

    return payload
  },
  (error: AxiosError<{ msg?: string; message?: string; code?: number | string }>) => {
    const status = error.response?.status
    const message =
      error.response?.data?.msg ||
      error.response?.data?.message ||
      error.message ||
      '请求失败'

    if (status === 401) {
      const userStore = useUserStore()
      userStore.clearAuth()
      if (router.currentRoute.value.name !== 'login') {
        ElMessage.error('请重新登录')
        void router.push({ name: 'login' })
      } else {
        ElMessage.error(message)
      }
    } else {
      ElMessage.error(message)
    }

    return Promise.reject(error)
  },
)

export default request
