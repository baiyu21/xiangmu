import type { Ref } from 'vue'
import { onMounted, ref } from 'vue'

export type PageLoadStatus = 'loading' | 'ready' | 'empty' | 'error'

/** 用本地 mock 模拟异步加载，便于演示加载 / 空 / 错误三态（不打后端）。 */
export function useMockPageLoad<T>(options: {
  fetchData: () => Promise<T[]> | T[]
  delayMs?: number
}): {
  status: Ref<PageLoadStatus>
  data: Ref<T[]>
  reload: () => Promise<void>
} {
  const status = ref<PageLoadStatus>('loading')
  const data = ref<T[]>([]) as Ref<T[]>
  const delayMs = options.delayMs ?? 400

  async function reload() {
    status.value = 'loading'
    data.value = []
    await new Promise((resolve) => setTimeout(resolve, delayMs))

    try {
      const result = await options.fetchData()
      data.value = result
      status.value = result.length === 0 ? 'empty' : 'ready'
    } catch {
      status.value = 'error'
    }
  }

  onMounted(() => {
    void reload()
  })

  return { status, data, reload }
}
