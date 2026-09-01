<script setup lang="ts">
import { ref, nextTick } from 'vue'

interface Msg {
  role: 'user' | 'assistant'
  content: string
}

const project = ref('A 文档库')
const input = ref('')
const messages = ref<Msg[]>([
  {
    role: 'assistant',
    content:
      `你好！我已加载 **${project.value}** 中的 128 份文档。\n你可以问我：\n• 这份需求文档的核心目标是什么？\n• 帮我总结最近一次版本更新\n• 文档中提到的性能指标有哪些？`,
  },
])
const bottomRef = ref<HTMLElement>()

const suggestions = [
  '帮我总结一下这个项目的核心内容',
  '最近更新的文档有哪些？',
  '查找提到"性能"的段落',
]

const send = () => {
  const text = input.value.trim()
  if (!text) return
  messages.value.push({ role: 'user', content: text })
  input.value = ''
  // 模拟回复
  setTimeout(() => {
    messages.value.push({
      role: 'assistant',
      content:
        '（示例回复）我在文档库中找到了 3 处相关内容，核心要点如下：\n1. ...\n2. ...\n3. ...\n\n可以继续追问，或点击引用查看原文。',
    })
    nextTick(() => bottomRef.value?.scrollIntoView({ behavior: 'smooth' }))
  }, 500)
}

const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1>AI 问答</h1>
      <p>基于选定项目的文档库进行智能问答，所有回答均附带原文引用。</p>
    </header>

    <div class="qa-layout">
      <!-- 左侧：项目选择 -->
      <aside class="sidebar-panel">
        <div class="panel-title">选择项目</div>
        <button class="proj-btn active">A 文档库</button>
        <button class="proj-btn">B 合同集</button>
        <button class="proj-btn">C 财务报告</button>
        <button class="proj-btn">D 会议纪要</button>
      </aside>

      <!-- 右侧：对话区 -->
      <section class="chat">
        <div class="messages">
          <div v-for="(m, i) in messages" :key="i" class="msg" :class="m.role">
            <div class="avatar">{{ m.role === 'user' ? '你' : 'AI' }}</div>
            <div class="bubble">
              <pre>{{ m.content }}</pre>
            </div>
          </div>
          <div ref="bottomRef"></div>
        </div>

        <!-- 输入区 -->
        <div class="composer">
          <textarea
            v-model="input"
            placeholder="向 AI 提问…（Enter 发送，Shift+Enter 换行）"
            rows="2"
            @keydown="onKey"
          ></textarea>
          <div class="composer-actions">
            <div class="suggestions">
              <button
                v-for="s in suggestions"
                :key="s"
                class="chip"
                @click="input = s; send()"
              >
                {{ s }}
              </button>
            </div>
            <button class="btn-primary" @click="send">发送</button>
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

/* 对话区 */
.chat {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
