<template>
  <div class="chat-page">
    <div class="page-header">
      <div>
        <h2>💬 AI 连续对话</h2>
        <p>
          DeepSeek 会结合历史消息、学习记录和长期记忆，
          持续调整学习计划并回答问题。
        </p>
      </div>

      <el-button
        type="primary"
        :disabled="!authStore.user"
        @click="startNewChat"
      >
        ＋ 新建对话
      </el-button>
    </div>

    <el-alert
      v-if="!authStore.user"
      class="login-alert"
      title="请先登录账号，再使用 AI 连续对话"
      type="warning"
      :closable="false"
      show-icon
    />

    <div v-else class="chat-layout">
      <aside class="conversation-panel">
        <div class="panel-header">
          <strong>历史对话</strong>

          <el-button
            v-if="aiChatStore.conversations.length > 0"
            text
            type="danger"
            size="small"
            @click="clearAllChats"
          >
            清空
          </el-button>
        </div>

        <div v-if="aiChatStore.loading" class="loading-box">
          正在加载对话……
        </div>

        <el-empty
          v-else-if="aiChatStore.conversations.length === 0"
          description="暂无历史对话"
          :image-size="70"
        />

        <div v-else class="conversation-list">
          <div
            v-for="conversation in aiChatStore.conversations"
            :key="conversation.id"
            class="conversation-item"
            :class="{
              active:
                conversation.id ===
                aiChatStore.currentConversationId
            }"
            @click="aiChatStore.selectConversation(conversation.id)"
          >
            <div class="conversation-main">
              <strong>{{ conversation.title }}</strong>
              <span>
                {{ getModeText(conversation.mode) }}
                ·
                {{ conversation.messageCount }} 条
              </span>
              <small>
                {{ formatDateTime(conversation.updatedAt) }}
              </small>
            </div>

            <el-button
              text
              type="danger"
              class="delete-chat-button"
              @click.stop="deleteChat(conversation.id)"
            >
              ×
            </el-button>
          </div>
        </div>
      </aside>

      <section class="chat-main">
        <el-card class="chat-card">
          <template #header>
            <div class="chat-card-header">
              <div>
                <strong>🤖 Med703 AI 教练</strong>
                <p>{{ currentConversationTitle }}</p>
              </div>

              <div class="header-tags">
                <el-tag type="success">DeepSeek</el-tag>

                <el-tag
                  v-if="aiChatStore.lastMemorySavedCount > 0"
                  type="warning"
                  effect="light"
                >
                  🧠 已记住
                  {{ aiChatStore.lastMemorySavedCount }}
                  条
                </el-tag>
              </div>
            </div>
          </template>

          <div class="mode-row">
            <el-radio-group
              :model-value="aiChatStore.currentMode"
              @update:model-value="changeMode"
            >
              <el-radio-button value="plan">
                📅 学习计划
              </el-radio-button>

              <el-radio-button value="analysis">
                📊 学习分析
              </el-radio-button>

              <el-radio-button value="question">
                📚 知识问答
              </el-radio-button>
            </el-radio-group>
          </div>

          <div ref="messageContainer" class="message-container">
            <div
              v-if="aiChatStore.currentMessages.length === 0"
              class="welcome-box"
            >
              <div class="welcome-icon">🤖</div>

              <h3>开始与 AI 学习教练对话</h3>

              <p>
                你可以告诉它今天可用的学习时间、
                重点科目、学习习惯和当前状态。
              </p>

              <div class="example-list">
                <el-button
                  plain
                  @click="useExample('我今天只有2小时，请结合学习记录安排计划。')"
                >
                  今天只有2小时
                </el-button>

                <el-button
                  plain
                  @click="useExample('请分析我最近30天各科目的学习情况。')"
                >
                  分析近期学习
                </el-button>

                <el-button
                  plain
                  @click="useExample('我通常每天晚上8点学习，病生是我长期最薄弱的科目。')"
                >
                  测试长期记忆
                </el-button>

                <el-button
                  plain
                  @click="useExample('请解释动作电位的形成过程，并给我一个记忆方法。')"
                >
                  提问医学知识
                </el-button>
              </div>
            </div>

            <div
              v-for="message in aiChatStore.currentMessages"
              :key="message.id"
              class="message-row"
              :class="message.role"
            >
              <div class="avatar">
                {{ message.role === "user" ? "👤" : "🤖" }}
              </div>

              <div class="message-body">
                <div class="message-meta">
                  <strong>
                    {{ message.role === "user" ? "我" : "AI 教练" }}
                  </strong>

                  <span>
                    {{ formatMessageTime(message.createdAt) }}
                  </span>
                </div>

                <div class="message-bubble">
                  {{ message.content }}
                </div>
              </div>
            </div>

            <div
              v-if="aiChatStore.sending"
              class="message-row assistant"
            >
              <div class="avatar">🤖</div>

              <div class="message-body">
                <div class="message-meta">
                  <strong>AI 教练</strong>
                </div>

                <div class="message-bubble thinking">
                  <span></span>
                  <span></span>
                  <span></span>
                  AI 正在思考
                </div>
              </div>
            </div>
          </div>

          <el-alert
            v-if="aiChatStore.lastMemorySavedCount > 0"
            class="memory-alert"
            :title="`AI 已自动保存 ${aiChatStore.lastMemorySavedCount} 条长期记忆`"
            type="success"
            :closable="false"
            show-icon
          >
            <template #default>
              这些信息会在后续学习计划、
              学习分析和连续对话中自动使用。
            </template>
          </el-alert>

          <el-alert
            v-if="aiChatStore.errorMessage"
            class="error-alert"
            :title="aiChatStore.errorMessage"
            type="error"
            :closable="false"
            show-icon
          />

          <div class="preferences-box">
            <el-collapse>
              <el-collapse-item title="学习偏好（可选）">
                <el-input
                  v-model="preferences"
                  type="textarea"
                  :rows="3"
                  maxlength="600"
                  show-word-limit
                  placeholder="例如：每天最多3小时；重点学生理；晚上状态较好；不安排生化。"
                />
              </el-collapse-item>
            </el-collapse>
          </div>

          <div class="input-area">
            <el-input
              v-model="inputMessage"
              type="textarea"
              :rows="4"
              maxlength="1500"
              show-word-limit
              resize="none"
              :placeholder="inputPlaceholder"
              :disabled="aiChatStore.sending"
              @keydown.ctrl.enter.prevent="sendCurrentMessage"
            />

            <div class="input-actions">
              <span class="send-tip">Ctrl + Enter 发送</span>

              <div class="action-buttons">
                <el-button
                  v-if="aiChatStore.currentMessages.length > 0"
                  :disabled="aiChatStore.sending"
                  @click="regenerateAnswer"
                >
                  重新生成
                </el-button>

                <el-button
                  type="primary"
                  :loading="aiChatStore.sending"
                  :disabled="aiChatStore.sending || !inputMessage.trim()"
                  @click="sendCurrentMessage"
                >
                  发送
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  ref,
  watch
} from "vue"

import {
  ElMessage,
  ElMessageBox
} from "element-plus"

import { useAuthStore } from "../stores/auth"
import { useStudyStore } from "../stores/study"
import { useReviewStore } from "../stores/review"
import { useSettingsStore } from "../stores/settings"
import { useAiMemoryStore } from "../stores/aimemory"

import {
  useAiChatStore,
  type AiChatMode
} from "../stores/aichat"

const authStore = useAuthStore()
const studyStore = useStudyStore()
const reviewStore = useReviewStore()
const settingsStore = useSettingsStore()
const aiChatStore = useAiChatStore()
const aiMemoryStore = useAiMemoryStore()

const inputMessage = ref("")
const preferences = ref("")
const messageContainer = ref<HTMLElement | null>(null)

const currentConversationTitle = computed(() => {
  const conversation = aiChatStore.conversations.find(
    item => item.id === aiChatStore.currentConversationId
  )

  return conversation?.title ?? "新对话"
})

const inputPlaceholder = computed(() => {
  if (aiChatStore.currentMode === "analysis") {
    return "例如：结合我的记录，分析最近30天学习不足，并给出改进方案。"
  }

  if (aiChatStore.currentMode === "question") {
    return "例如：请解释心肌动作电位各期的离子变化。"
  }

  return "例如：我今天只有2小时，重点学生理，不安排生化。"
})

onMounted(async () => {
  if (!authStore.user) {
    await authStore.initializeAuth()
  }

  if (authStore.user) {
    await Promise.all([
      aiChatStore.loadMessages(),
      aiMemoryStore.initialized
        ? Promise.resolve()
        : aiMemoryStore.loadMemories()
    ])

    if (!aiChatStore.currentConversationId) {
      aiChatStore.startNewConversation("plan")
    }
  }

  await scrollToBottom()
})

watch(
  () => aiChatStore.currentMessages.length,
  async () => {
    await scrollToBottom()
  }
)

watch(
  () => aiChatStore.sending,
  async () => {
    await scrollToBottom()
  }
)

function getDateText(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatDuration(total: number) {
  const safeTotal = Math.max(0, Math.floor(total || 0))
  const hours = Math.floor(safeTotal / 3600)
  const minutes = Math.floor((safeTotal % 3600) / 60)
  return `${hours}小时${minutes}分`
}

function formatDateTime(value: string) {
  if (!value) {
    return ""
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  })
}

function formatMessageTime(value: string) {
  if (!value) {
    return ""
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  })
}

function getModeText(mode: AiChatMode) {
  if (mode === "analysis") {
    return "学习分析"
  }

  if (mode === "question") {
    return "知识问答"
  }

  return "学习计划"
}

function changeMode(value: string | number | boolean) {
  if (
    value !== "plan" &&
    value !== "analysis" &&
    value !== "question"
  ) {
    return
  }

  aiChatStore.setCurrentMode(value)
}

function startNewChat() {
  aiChatStore.startNewConversation(aiChatStore.currentMode)
  inputMessage.value = ""
  preferences.value = ""
}

function useExample(message: string) {
  inputMessage.value = message
}

function buildStudySummary() {
  const today = getDateText(new Date())
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 29)
  const startDateText = getDateText(startDate)

  const recentRecords = studyStore.records.filter(record => {
    return record.date >= startDateText && record.date <= today
  })

  const subjectMap = new Map<string, number>()

  for (const record of recentRecords) {
    const current = subjectMap.get(record.subject) ?? 0
    subjectMap.set(
      record.subject,
      current + (record.duration || 0)
    )
  }

  const totalDuration = recentRecords.reduce(
    (sum, record) => sum + (record.duration || 0),
    0
  )

  const todayRecords = studyStore.records.filter(
    record => record.date === today
  )

  const todayDuration = todayRecords.reduce(
    (sum, record) => sum + (record.duration || 0),
    0
  )

  const subjectLines = Array.from(subjectMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([subject, duration]) => {
      return `- ${subject}：${formatDuration(duration)}`
    })

  const goalLines = settingsStore.goals.map(goal => {
    return `- ${goal.subject}：每日目标${goal.targetHours}小时`
  })

  const pendingReviews = reviewStore.tasks
    .filter(task => !task.done && task.reviewDate <= today)
    .slice(0, 15)

  const reviewLines = pendingReviews.map(task => {
    return (
      `- ${task.subject}｜` +
      `${task.chapter || "未填写章节"}｜` +
      `第${task.round}轮｜` +
      `${task.reviewDate}`
    )
  })

  return [
    `今天日期：${today}`,
    `最近30天学习总时长：${formatDuration(totalDuration)}`,
    `最近30天学习次数：${recentRecords.length}次`,
    `今日学习时长：${formatDuration(todayDuration)}`,
    `今日学习次数：${todayRecords.length}次`,
    `连续学习天数：${studyStore.streakDays}天`,
    `最长连续学习天数：${studyStore.longestStreak}天`,
    `当前到期未完成复习任务：${pendingReviews.length}项`,
    "",
    "最近30天各科目学习情况：",
    subjectLines.length > 0
      ? subjectLines.join("\n")
      : "- 暂无学习记录",
    "",
    "每日学习目标：",
    goalLines.length > 0
      ? goalLines.join("\n")
      : "- 暂未设置",
    "",
    "部分到期复习任务：",
    reviewLines.length > 0
      ? reviewLines.join("\n")
      : "- 暂无到期复习任务"
  ].join("\n")
}

async function sendCurrentMessage() {
  const content = inputMessage.value.trim()

  if (!content) {
    ElMessage.warning("请输入对话内容")
    return
  }

  const result = await aiChatStore.sendMessage({
    content,
    mode: aiChatStore.currentMode,
    studySummary: buildStudySummary(),
    preferences: preferences.value.trim()
  })

  if (!result.success) {
    ElMessage.error(result.message || "发送消息失败")
    return
  }

  inputMessage.value = ""

  if (result.memorySavedCount && result.memorySavedCount > 0) {
    await aiMemoryStore.loadMemories()

    ElMessage.success(
      `AI 已回复，并自动记住 ${result.memorySavedCount} 条长期信息`
    )
  } else if (
    result.memoryFailedCount &&
    result.memoryFailedCount > 0
  ) {
    ElMessage.warning(
      `AI 已正常回复，但有 ${result.memoryFailedCount} 条长期记忆保存失败`
    )
  }

  await scrollToBottom()
}

async function regenerateAnswer() {
  const result = await aiChatStore.regenerateLastAnswer(
    buildStudySummary(),
    preferences.value.trim()
  )

  if (!result.success) {
    ElMessage.error(result.message || "重新生成失败")
    return
  }

  ElMessage.success("AI 回复已重新生成")
}

async function deleteChat(conversationId: string) {
  try {
    await ElMessageBox.confirm(
      "确定删除这段 AI 对话吗？删除后无法恢复。",
      "删除对话",
      {
        type: "warning",
        confirmButtonText: "确定删除",
        cancelButtonText: "取消"
      }
    )
  } catch {
    return
  }

  const result = await aiChatStore.deleteConversation(
    conversationId
  )

  if (!result.success) {
    ElMessage.error(result.message || "删除对话失败")
    return
  }

  ElMessage.success("AI 对话已删除")
}

async function clearAllChats() {
  try {
    await ElMessageBox.confirm(
      "确定清空全部 AI 对话吗？该操作无法恢复。",
      "清空对话",
      {
        type: "warning",
        confirmButtonText: "全部清空",
        cancelButtonText: "取消"
      }
    )
  } catch {
    return
  }

  const result = await aiChatStore.clearAllConversations()

  if (!result.success) {
    ElMessage.error(result.message || "清空对话失败")
    return
  }

  aiChatStore.startNewConversation("plan")
  ElMessage.success("全部 AI 对话已清空")
}

async function scrollToBottom() {
  await nextTick()

  if (!messageContainer.value) {
    return
  }

  messageContainer.value.scrollTop =
    messageContainer.value.scrollHeight
}
</script>

<style scoped>
.chat-page {
  margin-top: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.page-header h2 {
  margin: 0;
}

.page-header p {
  margin: 8px 0 0;
  color: #777;
  line-height: 1.6;
}

.login-alert {
  margin-top: 20px;
}

.chat-layout {
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr);
  gap: 20px;
  margin-top: 20px;
}

.conversation-panel {
  min-height: 680px;
  padding: 14px;
  border: 1px solid #e4ebe6;
  border-radius: 14px;
  background: #fff;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 34px;
  margin-bottom: 12px;
}

.loading-box {
  padding: 40px 10px;
  color: #777;
  text-align: center;
}

.conversation-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.conversation-item {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  padding: 12px 8px 12px 12px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: #f7f8f8;
  cursor: pointer;
  transition: 0.2s;
}

.conversation-item:hover {
  border-color: #bddfc9;
  background: #f2faf5;
}

.conversation-item.active {
  border-color: #2e8b57;
  background: #eaf7ef;
}

.conversation-main {
  min-width: 0;
  flex: 1;
}

.conversation-main strong,
.conversation-main span,
.conversation-main small {
  display: block;
}

.conversation-main strong {
  overflow: hidden;
  color: #333;
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation-main span {
  margin-top: 6px;
  color: #777;
  font-size: 12px;
}

.conversation-main small {
  margin-top: 5px;
  color: #aaa;
  font-size: 11px;
}

.delete-chat-button {
  flex: none;
  margin-top: -5px;
  font-size: 20px;
}

.chat-main {
  min-width: 0;
}

.chat-card {
  min-height: 680px;
  border: 1px solid #dcece2;
}

.chat-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 14px;
}

.chat-card-header p {
  margin: 6px 0 0;
  color: #888;
  font-size: 13px;
}

.header-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.mode-row {
  margin-bottom: 16px;
  overflow-x: auto;
}

.message-container {
  height: 410px;
  padding: 18px;
  overflow-y: auto;
  border: 1px solid #e5ebe7;
  border-radius: 12px;
  background: #fafcfb;
  scroll-behavior: smooth;
}

.welcome-box {
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  min-height: 370px;
  padding: 20px;
  color: #666;
  text-align: center;
}

.welcome-icon {
  font-size: 54px;
}

.welcome-box h3 {
  margin: 12px 0 8px;
  color: #333;
}

.welcome-box p {
  margin: 0;
  line-height: 1.7;
}

.example-list {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;
}

.message-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 20px;
}

.message-row.user {
  flex-direction: row-reverse;
}

.avatar {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 38px;
  height: 38px;
  flex: none;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.message-body {
  max-width: 78%;
}

.message-row.user .message-body {
  display: flex;
  align-items: flex-end;
  flex-direction: column;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
  color: #777;
  font-size: 12px;
}

.message-meta strong {
  color: #444;
}

.message-bubble {
  padding: 12px 15px;
  border-radius: 12px;
  background: #fff;
  color: #333;
  line-height: 1.75;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.message-row.user .message-bubble {
  background: #2e8b57;
  color: #fff;
}

.thinking {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #777;
}

.thinking span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #2e8b57;
  animation: thinking 1.2s infinite ease-in-out;
}

.thinking span:nth-child(2) {
  animation-delay: 0.15s;
}

.thinking span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes thinking {
  0%,
  80%,
  100% {
    opacity: 0.3;
    transform: translateY(0);
  }

  40% {
    opacity: 1;
    transform: translateY(-4px);
  }
}

.memory-alert,
.error-alert {
  margin-top: 14px;
}

.preferences-box {
  margin-top: 14px;
}

.input-area {
  margin-top: 14px;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  margin-top: 10px;
}

.send-tip {
  color: #999;
  font-size: 12px;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.action-buttons :deep(.el-button + .el-button) {
  margin-left: 0;
}

@media (max-width: 760px) {
  .chat-page {
    margin-top: 12px;
  }

  .page-header {
    flex-direction: column;
  }

  .page-header .el-button {
    width: 100%;
  }

  .chat-layout {
    grid-template-columns: 1fr;
  }

  .conversation-panel {
    min-height: auto;
    max-height: 270px;
    overflow-y: auto;
  }

  .chat-card {
    min-height: auto;
  }

  .chat-card-header {
    flex-direction: column;
  }

  .header-tags {
    justify-content: flex-start;
  }

  .message-container {
    height: 440px;
    padding: 12px;
  }

  .message-body {
    max-width: 88%;
  }

  .input-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .send-tip {
    text-align: right;
  }

  .action-buttons {
    width: 100%;
  }

  .action-buttons .el-button {
    flex: 1;
    margin-left: 0;
  }
}
</style>
