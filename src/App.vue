<template>
  <div class="app">
    <header class="header">
      <h1>🎓 Med703 Pro</h1>
      <p>703考研智能学习助手</p>

      <div
        v-if="authStore.loading"
        class="account-status"
      >
        正在检查登录状态……
      </div>

      <div
        v-else-if="authStore.user"
        class="account-status logged-in"
      >
        <span>👤 {{ authStore.user.email }}</span>

        <el-button
          type="danger"
          plain
          size="small"
          @click="handleSignOut"
        >
          退出登录
        </el-button>
      </div>

      <div
        v-else
        class="account-status"
      >
        <span>当前未登录，学习记录暂时保存在本机。</span>
      </div>
    </header>

    <div
      v-if="
        studyTimerStore.running ||
        studyTimerStore.elapsedSeconds > 0
      "
      class="global-study-bar"
      :class="{
        paused: !studyTimerStore.running
      }"
    >
      <div class="study-status-main">
        <div class="study-status-icon">
          {{ studyTimerStore.running ? "🟢" : "⏸" }}
        </div>

        <div class="study-status-info">
          <div class="study-status-title">
            <strong>
              {{
                studyTimerStore.running
                  ? "正在学习"
                  : "学习已暂停"
              }}
            </strong>

            <el-tag
              :type="
                studyTimerStore.running
                  ? 'success'
                  : 'warning'
              "
              size="small"
              effect="light"
            >
              {{
                studyTimerStore.subject ||
                "未选择科目"
              }}
            </el-tag>
          </div>

          <div class="study-task-text">
            <span v-if="studyTimerStore.chapter">
              章节：{{ studyTimerStore.chapter }}
            </span>

            <span v-if="studyTimerStore.content">
              内容：{{ studyTimerStore.content }}
            </span>

            <span
              v-if="
                !studyTimerStore.chapter &&
                !studyTimerStore.content
              "
            >
              尚未填写章节和学习内容
            </span>
          </div>
        </div>
      </div>

      <div class="study-time-box">
        <span>本次时长</span>
        <strong>{{ studyTimerStore.timeText }}</strong>
      </div>

      <div class="study-status-actions">
        <el-button
          size="small"
          plain
          @click="goToStudyPage"
        >
          📚 返回学习
        </el-button>

        <el-button
          v-if="studyTimerStore.running"
          size="small"
          type="warning"
          plain
          @click="pauseGlobalStudy"
        >
          ⏸ 暂停
        </el-button>

        <el-button
          v-else
          size="small"
          type="success"
          plain
          @click="resumeGlobalStudy"
        >
          ▶ 继续
        </el-button>

        <el-button
          size="small"
          type="danger"
          :loading="finishingStudy"
          :disabled="finishingStudy"
          @click="finishGlobalStudy"
        >
          ■ 结束并保存
        </el-button>
      </div>
    </div>

    <nav class="nav">
      <RouterLink to="/">
        🏠 首页
      </RouterLink>

      <RouterLink to="/study">
        📚 学习
      </RouterLink>

      <RouterLink to="/review">
        🔁 复习
      </RouterLink>

      <RouterLink to="/report">
        📈 报告
      </RouterLink>

      <RouterLink to="/coach">
        🤖 AI 教练
      </RouterLink>

      <RouterLink to="/auth">
        {{ authStore.user ? "👤 账号" : "🔐 登录" }}
      </RouterLink>

      <RouterLink to="/settings">
        ⚙ 设置
      </RouterLink>
    </nav>

    <main class="page">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue"
import {
  RouterLink,
  RouterView,
  useRouter
} from "vue-router"
import {
  ElMessage,
  ElMessageBox
} from "element-plus"

import { useAuthStore } from "./stores/auth"
import { useStudyStore } from "./stores/study"
import { useReviewStore } from "./stores/review"
import { useAiPlanStore } from "./stores/aiplan"
import { useAiChatStore } from "./stores/aichat"
import { useAiMemoryStore } from "./stores/aimemory"
import { useStudyTimerStore } from "./stores/studyTimer"

const router = useRouter()

const authStore = useAuthStore()
const studyStore = useStudyStore()
const reviewStore = useReviewStore()
const aiPlanStore = useAiPlanStore()
const aiChatStore = useAiChatStore()
const aiMemoryStore = useAiMemoryStore()
const studyTimerStore = useStudyTimerStore()

const finishingStudy = ref(false)

onMounted(async () => {
  await authStore.initializeAuth()
})

watch(
  () => authStore.user?.id,
  async (userId, previousUserId) => {
    if (userId) {
      await Promise.all([
        studyStore.loadCloudRecords(),
        reviewStore.loadCloudTasks(),
        aiPlanStore.loadPlans(),
        aiChatStore.loadMessages(),
        aiMemoryStore.loadMemories()
      ])

      return
    }

    if (previousUserId) {
      clearUserData()
    }
  },
  {
    immediate: true
  }
)

function clearUserData() {
  studyStore.clearRecords()
  reviewStore.clearTasks()
  aiPlanStore.clearPlans()
  aiChatStore.clearChatState()
  aiMemoryStore.clearMemoryState()
}

async function goToStudyPage() {
  await router.push("/study")
}

function pauseGlobalStudy() {
  studyTimerStore.pauseStudy()
  ElMessage.success("学习计时已暂停")
}

function resumeGlobalStudy() {
  studyTimerStore.resumeStudy()
  ElMessage.success("学习计时已继续")
}

async function finishGlobalStudy() {
  if (finishingStudy.value) {
    return
  }

  if (studyTimerStore.elapsedSeconds <= 0) {
    ElMessage.warning("当前没有可保存的学习时长")
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定结束本次学习吗？当前时长为 ${studyTimerStore.timeText}。`,
      "结束学习",
      {
        type: "warning",
        confirmButtonText: "结束并保存",
        cancelButtonText: "继续学习"
      }
    )
  } catch {
    return
  }

  finishingStudy.value = true

  try {
    const record = studyTimerStore.finishStudy()

    if (!record) {
      ElMessage.warning("当前没有可保存的学习记录")
      return
    }

    await studyStore.addRecord(record)

    ElMessage.success(
      `学习记录已保存，本次学习 ${record.durationText}`
    )
  } catch (error) {
    console.error("保存学习记录失败：", error)

    ElMessage.error(
      error instanceof Error
        ? error.message
        : "保存学习记录失败"
    )
  } finally {
    finishingStudy.value = false
  }
}

async function handleSignOut() {
  const success = await authStore.signOut()

  if (!success) {
    ElMessage.error("退出登录失败，请稍后重试")
    return
  }

  clearUserData()

  ElMessage.success("已退出登录")

  await router.push("/auth")
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.app {
  max-width: 960px;
  margin: auto;
  padding: 24px;
}

.header {
  margin-bottom: 24px;
  text-align: center;
}

.header h1 {
  margin: 0;
  font-size: 52px;
}

.header p {
  margin-top: 10px;
  color: #666;
  font-size: 22px;
}

.account-status {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  color: #666;
  font-size: 14px;
}

.logged-in {
  color: #2e8b57;
}

.global-study-bar {
  position: sticky;
  top: 12px;
  z-index: 100;
  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    auto
    auto;
  align-items: center;
  gap: 18px;
  margin-bottom: 24px;
  padding: 16px 18px;
  border: 1px solid #9fd8b4;
  border-radius: 14px;
  background: rgba(243, 253, 247, 0.96);
  box-shadow:
    0 6px 22px rgba(46, 139, 87, 0.13);
  backdrop-filter: blur(10px);
}

.global-study-bar.paused {
  border-color: #e8c98f;
  background: rgba(255, 249, 238, 0.96);
  box-shadow:
    0 6px 22px rgba(184, 130, 48, 0.13);
}

.study-status-main {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 12px;
}

.study-status-icon {
  flex: none;
  font-size: 24px;
}

.study-status-info {
  min-width: 0;
}

.study-status-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.study-status-title strong {
  color: #2e8b57;
  font-size: 16px;
}

.paused .study-status-title strong {
  color: #b88230;
}

.study-task-text {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin-top: 7px;
  color: #666;
  font-size: 13px;
}

.study-task-text span {
  overflow-wrap: anywhere;
}

.study-time-box {
  min-width: 110px;
  text-align: center;
}

.study-time-box span,
.study-time-box strong {
  display: block;
}

.study-time-box span {
  color: #777;
  font-size: 12px;
}

.study-time-box strong {
  margin-top: 4px;
  color: #2e8b57;
  font-size: 23px;
  font-variant-numeric: tabular-nums;
}

.paused .study-time-box strong {
  color: #b88230;
}

.study-status-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}

.study-status-actions .el-button {
  margin-left: 0;
}

.nav {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 35px;
}

.nav a {
  padding: 12px 22px;
  border-radius: 12px;
  background: white;
  color: #2e8b57;
  text-decoration: none;
  font-weight: bold;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.08);
  transition:
    transform 0.2s,
    background-color 0.2s,
    color 0.2s;
}

.nav a:hover {
  transform: translateY(-2px);
}

.nav a.router-link-active {
  background: #2e8b57;
  color: white;
}

.page {
  margin-top: 20px;
}

@media (max-width: 800px) {
  .global-study-bar {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .study-status-actions {
    grid-column: 1 / -1;
    justify-content: stretch;
  }

  .study-status-actions .el-button {
    flex: 1;
  }
}

@media (max-width: 600px) {
  .app {
    padding: 14px;
  }

  .header h1 {
    font-size: 34px;
  }

  .header p {
    font-size: 17px;
  }

  .account-status {
    flex-direction: column;
  }

  .global-study-bar {
    top: 6px;
    grid-template-columns: 1fr;
    gap: 14px;
    padding: 14px;
  }

  .study-time-box {
    text-align: left;
  }

  .study-time-box strong {
    font-size: 26px;
  }

  .study-status-actions {
    grid-column: auto;
    flex-direction: column;
  }

  .study-status-actions .el-button {
    width: 100%;
  }

  .nav {
    gap: 8px;
  }

  .nav a {
    padding: 10px 13px;
    font-size: 14px;
  }
}
</style>