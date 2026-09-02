import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { clearToken, getToken, setToken as persistToken } from '@/utils/storage'

const PROFILE_KEY = 'ds_profile'

export interface UserProfile {
  username: string
  displayName: string
  email?: string
}

function readProfile(): UserProfile | null {
  const raw = localStorage.getItem(PROFILE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as UserProfile
  } catch {
    return null
  }
}

function writeProfile(profile: UserProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

function clearProfile() {
  localStorage.removeItem(PROFILE_KEY)
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(getToken())
  const profile = ref<UserProfile | null>(readProfile())

  const isAuthenticated = computed(() => Boolean(token.value))
  const avatarLetter = computed(() => {
    const name = profile.value?.displayName || profile.value?.username || '?'
    return name.slice(0, 1).toUpperCase()
  })

  function setSession(payload: { token: string } & UserProfile) {
    token.value = payload.token
    persistToken(payload.token)
    profile.value = {
      username: payload.username,
      displayName: payload.displayName,
    }
    writeProfile(profile.value)
  }

  function clearAuth() {
    token.value = null
    profile.value = null
    clearToken()
    clearProfile()
  }

  return {
    token,
    profile,
    isAuthenticated,
    avatarLetter,
    setSession,
    clearAuth,
  }
})
