import { defineStore } from 'pinia'
import { ref } from 'vue'
import { clearToken, getToken, setToken as persistToken } from '@/utils/storage'

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(getToken())

  function setToken(value: string) {
    token.value = value
    persistToken(value)
  }

  function clearAuth() {
    token.value = null
    clearToken()
  }

  return {
    token,
    setToken,
    clearAuth,
  }
})
