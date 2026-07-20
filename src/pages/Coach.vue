<template>
  <div class="coach-page">
    <div class="page-header">
      <div>
        <h2>🤖 AI 学习教练</h2>

        <p>
          集中管理学习分析、连续对话、AI计划和长期记忆。
        </p>
      </div>

      <el-tag
        type="success"
        size="large"
        effect="light"
      >
        DeepSeek
      </el-tag>
    </div>

    <el-alert
      v-if="!authStore.user"
      class="login-alert"
      title="请先登录账号，再使用完整的 AI 学习教练功能"
      type="warning"
      :closable="false"
      show-icon
    />

    <el-card class="navigation-card">
      <el-tabs
        v-model="activeTab"
        class="coach-tabs"
        stretch
      >
        <el-tab-pane
          name="overview"
          label="📊 学习总览"
        />

        <el-tab-pane
          name="chat"
          label="💬 AI 对话"
        />

        <el-tab-pane
          name="plans"
          label="📅 AI 计划"
        />

        <el-tab-pane
          name="memory"
          label="🧠 AI 记忆"
        />
      </el-tabs>
    </el-card>

    <section class="module-content">
      <CoachOverview
        v-if="activeTab === 'overview'"
      />

      <AIChat
        v-else-if="activeTab === 'chat'"
      />

      <AiPlans
        v-else-if="activeTab === 'plans'"
      />

      <div
        v-else-if="activeTab === 'memory'"
        class="memory-section"
      >
        <div class="memory-header">
          <div>
            <h3>🧠 AI 长期记忆</h3>

            <p>
              AI 会在生成学习计划和提供建议时参考这些长期信息。
            </p>
          </div>

          <el-button
            type="primary"
            plain
            @click="refreshMemories"
          >
            刷新记忆
          </el-button>
        </div>

        <el-alert
          v-if="aiMemoryStore.errorMessage"
          class="memory-alert"
          :title="aiMemoryStore.errorMessage"
          type="error"
          :closable="false"
          show-icon
        />

        <div
          v-if="aiMemoryStore.loading"
          class="loading-box"
        >
          <el-icon class="is-loading">
            <Loading />
          </el-icon>

          <span>正在加载 AI 长期记忆……</span>
        </div>

        <el-empty
          v-else-if="
            aiMemoryStore.activeMemories.length === 0
          "
          description="目前还没有长期记忆"
        >
          <p class="empty-description">
            下一阶段会加入手动新增和 AI 自动提取记忆功能。
          </p>
        </el-empty>

        <div
          v-else
          class="memory-list"
        >
          <el-card
            v-for="memory in aiMemoryStore.activeMemories"
            :key="memory.id"
            class="memory-card"
          >
            <template #header>
              <div class="memory-card-header">
                <div class="memory-title">
                  <el-tag
                    :type="getMemoryTagType(memory.memoryType)"
                    effect="light"
                  >
                    {{
                      aiMemoryStore.getMemoryTypeText(
                        memory.memoryType
                      )
                    }}
                  </el-tag>

                  <strong>{{ memory.title }}</strong>
                </div>

                <el-rate
                  :model-value="memory.importance"
                  disabled
                  show-score
                  score-template="{value}"
                />
              </div>
            </template>

            <p class="memory-content">
              {{ memory.content }}
            </p>

            <div class="memory-footer">
              <span>
                来源：
                {{
                  aiMemoryStore.getSourceText(
                    memory.source
                  )
                }}
              </span>

              <span>
                更新时间：
                {{ formatDateTime(memory.updatedAt) }}
              </span>
            </div>
          </el-card>
        </div>

        <el-card class="memory-notice">
          <template #header>
            <strong>📌 AI 记忆说明</strong>
          </template>

          <p>
            当前已经完成 AI 长期记忆的数据读取和展示。
          </p>

          <p>
            下一步会加入新增、编辑、停用、删除，以及从 AI 对话中自动提取记忆。
          </p>
        </el-card>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue"
import { Loading } from "@element-plus/icons-vue"

import CoachOverview from "../components/coach/CoachOverview.vue"
import AIChat from "./AIChat.vue"
import AiPlans from "./AiPlans.vue"

import { useAuthStore } from "../stores/auth"
import {
  useAiMemoryStore,
  type AiMemoryType
} from "../stores/aimemory"

type CoachTab =
  | "overview"
  | "chat"
  | "plans"
  | "memory"

const authStore = useAuthStore()
const aiMemoryStore = useAiMemoryStore()

const activeTab = ref<CoachTab>("overview")

onMounted(async () => {
  if (!authStore.user) {
    await authStore.initializeAuth()
  }

  if (
    authStore.user &&
    !aiMemoryStore.initialized
  ) {
    await aiMemoryStore.loadMemories()
  }
})

async function refreshMemories() {
  await aiMemoryStore.loadMemories()
}

function getMemoryTagType(
  memoryType: AiMemoryType
) {
  if (memoryType === "weak_subject") {
    return "danger"
  }

  if (memoryType === "learning_goal") {
    return "success"
  }

  if (memoryType === "study_schedule") {
    return "warning"
  }

  if (memoryType === "study_preference") {
    return "primary"
  }

  return "info"
}

function formatDateTime(value: string) {
  if (!value) {
    return "未知"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString("zh-CN", {
    hour12: false
  })
}
</script>

<style scoped>
.coach-page {
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
  line-height: 1.7;
}

.login-alert {
  margin-top: 20px;
}

.navigation-card {
  margin-top: 20px;
}

.coach-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}

.module-content {
  margin-top: 20px;
}

.memory-section {
  display: grid;
  gap: 20px;
}

.memory-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.memory-header h3 {
  margin: 0;
}

.memory-header p {
  margin: 8px 0 0;
  color: #777;
  line-height: 1.7;
}

.memory-alert {
  margin-bottom: 0;
}

.loading-box {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  min-height: 180px;
  color: #666;
}

.empty-description {
  color: #999;
}

.memory-list {
  display: grid;
  gap: 16px;
}

.memory-card {
  border: 1px solid #e2eee6;
}

.memory-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.memory-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.memory-content {
  margin: 0;
  color: #333;
  line-height: 1.8;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.memory-footer {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid #eee;
  color: #999;
  font-size: 13px;
}

.memory-notice {
  border: 1px solid #d8efe1;
  background: #f7fcf9;
}

.memory-notice p {
  margin: 8px 0;
  color: #666;
  line-height: 1.7;
}

@media (max-width: 700px) {
  .page-header,
  .memory-header {
    flex-direction: column;
  }

  .memory-header .el-button {
    width: 100%;
  }

  .navigation-card {
    overflow-x: auto;
  }

  .coach-tabs {
    min-width: 560px;
  }

  .memory-card-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .memory-footer {
    flex-direction: column;
  }
}
</style>