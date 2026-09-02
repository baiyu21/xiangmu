<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import type { PageLoadStatus } from '@/utils/useMockPageLoad'

interface Msg {
  role: 'user' | 'assistant'
  content: string
}

const project = ref('A 文档库')
const input = ref('')
const status = ref<PageLoadStatus>('loading')
const messages = ref<Msg[]>([])
const bottomRef = ref<HTMLElement>()
const sending = ref(false)

const suggestions = [
  '帮我总结一下这个项目的核心内容',
  '最近更新的文档有哪些？',
  '查找提到"性能"的段落',
]

const projects = ['rd-xmz', 'school-portal']

async function bootstrapChat(forceError = false) {
  status.value = 'loading'
  messages.value = []
  await new Promise((r) => setTimeout(r, 350))
  if (forceError) {
    status.value = 'error'
    return
  }
  messages.value = [
    {
      role: 'assistant',
      content: `你好！我已加载 **${project.value}** 中的文档。\n你可以问我：\n• 这份需求文档的核心目标是什么？\n• 帮我总结最近一次版本更新\n• 文档中提到的性能指标有哪些？`,
    },
  ]
  status.value = 'ready'
}

function selectProject(name: string) {
  project.value = name
  void bootstrapChat()
}

const send = () => {
  const text = input.value.trim()
  if (!text || sending.value || status.value !== 'ready') return
  messages.value.push({ role: 'user', content: text })
  input.value = ''
  sending.value = true
  setTimeout(() => {
    messages.value.push({
      role: 'assistant',
      content:
        '（示例回复）我在文档库中找到了 3 处相关内容，核心要点如下：\n1. ...\n2. ...\n3. ...\n\n可以继续追问，或点击引用查看原文。',
    })
    sending.value = false
    nextTick(() => bottomRef.value?.scrollIntoView({ behavior: 'smooth' }))
  }, 500)
}

const applySuggestion = (text: string) => {
  input.value = text
  send()
}

const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
}

onMounted(() => {
  void bootstrapChat()
})
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1>AI 问答</h1>
      <p>基于选定项目的文档库进行智能问答，所有回答均附带原文引用。</p>
    </header>

    <div class="qa-layout">
      <aside class="sidebar-panel">
        <div class="panel-title">选择项目</div>
        <button
          v-for="name in projects"
          :key="name"
          type="button"
          class="proj-btn"
          :class="{ active: project === name }"
          @click="selectProject(name)"
        >
          {{ name }}
        </button>
      </aside>
      <section class="chat">
          <div class="messages">
            <div v-for="(m, i) in messages" :key="i" class="msg" :class="m.role">
              <div class="avatar">{{ m.role === 'user' ? '你' : 'AI' }}</div>
              <div class="bubble">
                <pre>{{ m.content }}</pre>
              </div>
            </div>
            <div v-if="sending" class="msg assistant">
              <div class="avatar">AI</div>
              <div class="bubble"><pre>正在思考…</pre></div>
            </div>
            <div ref="bottomRef"></div>
          </div>
        <div class="composer">
          <textarea
            v-model="input"
            placeholder="向 AI 提问…（Enter 发送，Shift+Enter 换行）"
            rows="2"
            :disabled="status !== 'ready'"
            @keydown="onKey"
          ></textarea>
          <div class="composer-actions">
            <div class="suggestions">
              <button
                v-for="s in suggestions"
                :key="s"
                type="button"
                class="chip"
                :disabled="status !== 'ready'"
                @click="applySuggestion(s)"
              >
                {{ s }}
              </button>
            </div>
            <button
              type="button"
              class="btn-primary"
              :disabled="status !== 'ready' || sending"
              @click="send"
            >
              发送
            </button>
          </div>
        </div>
      </section>
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
  margin: 0 0 20px;
}

.qa-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 20px;
  height: calc(100vh - 180px);
}

.sidebar-panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.panel-title {
  font-size: 12px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.proj-btn {
  text-align: left;
  padding: 9px 12px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 13px;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.15s;
}

.proj-btn:hover {
  background: #f3f4f6;
}

.proj-btn.active {
  background: #ecfdf5;
  color: #0f766e;
  font-weight: 500;
}

.btn-ghost {
  margin-top: 12px;
  padding: 8px 12px;
  background: #fff;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
}

.btn-ghost:hover {
  border-color: #fca5a5;
  color: #dc2626;
}

/* 对话区 */
.chat {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat :deep(.state) {
  flex: 1;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.msg {
  display: flex;
  gap: 12px;
  max-width: 85%;
}

.msg.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
  background: #f3f4f6;
  color: #6b7280;
}

.msg.assistant .avatar {
  background: #0f766e;
  color: #fff;
}

.bubble {
  background: #f9fafb;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
  color: #1f2937;
}

.msg.user .bubble {
  background: #0f766e;
  color: #fff;
}

.bubble pre {
  margin: 0;
  font-family: inherit;
  white-space: pre-wrap;
}

/* 输入区 */
.composer {
  border-top: 1px solid #e5e7eb;
  padding: 14px 18px;
  background: #fafafa;
}

.composer textarea {
  width: 100%;
  padding: 11px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  resize: none;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
}

.composer textarea:focus {
  border-color: #0f766e;
}

.composer-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  gap: 12px;
}

.suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  padding: 5px 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s;
}

.chip:hover {
  border-color: #0f766e;
  color: #0f766e;
  background: #ecfdf5;
}

.btn-primary {
  padding: 8px 20px;
  background: #0f766e;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  flex-shrink: 0;
}

.btn-primary:hover { background: #0d9488; }
</style>
