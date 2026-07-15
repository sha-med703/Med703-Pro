<template>
  <div class="plans-page">
    <div class="page-header">
      <div>
        <h2>📅 AI 学习计划</h2>
        <p>查看、编辑和管理已保存的 DeepSeek 学习计划。</p>
      </div>

      <el-button
        type="primary"
        @click="router.push('/coach')"
      >
        🤖 生成新计划
      </el-button>
    </div>

    <el-card class="filter-card">
      <el-radio-group v-model="statusFilter">
        <el-radio-button value="all">
          全部
        </el-radio-button>

        <el-radio-button value="active">
          进行中
        </el-radio-button>

        <el-radio-button value="completed">
          已完成
        </el-radio-button>

        <el-radio-button value="archived">
          已归档
        </el-radio-button>
      </el-radio-group>
    </el-card>

    <div
      v-if="aiPlanStore.loading"
      class="status-box"
    >
      <el-icon class="is-loading">
        <Loading />
      </el-icon>

      <span>正在加载 AI 学习计划……</span>
    </div>

    <el-empty
      v-else-if="filteredPlans.length === 0"
      description="暂时没有符合条件的 AI 学习计划"
    >
      <el-button
        type="primary"
        @click="router.push('/coach')"
      >
        去生成第一份计划
      </el-button>
    </el-empty>

    <div v-else class="plan-list">
      <el-card
        v-for="plan in filteredPlans"
        :key="plan.id"
        class="plan-card"
      >
        <template #header>
          <div class="plan-header">
            <div>
              <strong>{{ plan.title }}</strong>

              <p class="plan-date">
                📅 {{ plan.planDate }}
              </p>
            </div>

            <el-tag :type="getStatusType(plan.status)">
              {{ getStatusText(plan.status) }}
            </el-tag>
          </div>
        </template>

        <div
          v-if="plan.userRequest"
          class="request-box"
        >
          <strong>你的要求</strong>
          <p>{{ plan.userRequest }}</p>
        </div>

        <div class="plan-content">
          {{ plan.aiContent }}
        </div>

        <p class="updated-time">
          最后更新：{{ formatDateTime(plan.updatedAt) }}
        </p>

        <div class="actions">
          <el-button
            v-if="plan.status !== 'completed'"
            type="success"
            plain
            @click="handleComplete(plan.id)"
          >
            ✅ 标记完成
          </el-button>

          <el-button
            v-if="plan.status === 'completed'"
            type="primary"
            plain
            @click="handleActivate(plan.id)"
          >
            恢复进行中
          </el-button>

          <el-button
            type="primary"
            plain
            @click="openEditor(plan)"
          >
            ✏ 编辑
          </el-button>

          <el-button
            v-if="plan.status !== 'archived'"
            type="warning"
            plain
            @click="handleArchive(plan.id)"
          >
            📦 归档
          </el-button>

          <el-button
            type="danger"
            plain
            @click="handleDelete(plan.id)"
          >
            🗑 删除
          </el-button>
        </div>
      </el-card>
    </div>

    <el-dialog
      v-model="editorVisible"
      title="编辑 AI 学习计划"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-input
        v-model="editingContent"
        type="textarea"
        :rows="16"
        maxlength="6000"
        show-word-limit
      />

      <template #footer>
        <el-button @click="closeEditor">
          取消
        </el-button>

        <el-button
          type="primary"
          :loading="saving"
          @click="saveEditedPlan"
        >
          保存修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import {
  ElMessage,
  ElMessageBox
} from "element-plus"
import { Loading } from "@element-plus/icons-vue"
import {
  useAiPlanStore,
  type AiPlan,
  type AiPlanStatus
} from "../stores/aiPlan"

type StatusFilter = AiPlanStatus | "all"

const router = useRouter()
const aiPlanStore = useAiPlanStore()

const statusFilter = ref<StatusFilter>("all")
const editorVisible = ref(false)
const editingPlanId = ref("")
const editingContent = ref("")
const saving = ref(false)

const filteredPlans = computed(() => {
  if (statusFilter.value === "all") {
    return aiPlanStore.plans
  }

  return aiPlanStore.plans.filter(plan => {
    return plan.status === statusFilter.value
  })
})

onMounted(async () => {
  await aiPlanStore.loadPlans()
})

function getStatusText(status: AiPlanStatus) {
  if (status === "completed") return "已完成"
  if (status === "archived") return "已归档"
  return "进行中"
}

function getStatusType(status: AiPlanStatus) {
  if (status === "completed") return "success"
  if (status === "archived") return "info"
  return "warning"
}

function formatDateTime(value: string) {
  if (!value) return "未知"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString("zh-CN", {
    hour12: false
  })
}

function openEditor(plan: AiPlan) {
  editingPlanId.value = plan.id
  editingContent.value = plan.aiContent
  editorVisible.value = true
}

function closeEditor() {
  editorVisible.value = false
  editingPlanId.value = ""
  editingContent.value = ""
}

async function saveEditedPlan() {
  const content = editingContent.value.trim()

  if (!content) {
    ElMessage.warning("计划内容不能为空")
    return
  }

  saving.value = true

  const result = await aiPlanStore.updatePlanContent(
    editingPlanId.value,
    content
  )

  saving.value = false

  if (!result.success) {
    ElMessage.error(
      result.message || "修改计划失败"
    )
    return
  }

  ElMessage.success("AI 学习计划已更新")
  closeEditor()
}

async function handleComplete(id: string) {
  const result = await aiPlanStore.completePlan(id)

  if (!result.success) {
    ElMessage.error(
      result.message || "更新状态失败"
    )
    return
  }

  ElMessage.success("计划已标记为完成")
}

async function handleActivate(id: string) {
  const result = await aiPlanStore.activatePlan(id)

  if (!result.success) {
    ElMessage.error(
      result.message || "恢复计划失败"
    )
    return
  }

  ElMessage.success("计划已恢复为进行中")
}

async function handleArchive(id: string) {
  const result = await aiPlanStore.archivePlan(id)

  if (!result.success) {
    ElMessage.error(
      result.message || "归档计划失败"
    )
    return
  }

  ElMessage.success("计划已归档")
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm(
      "确定删除这份 AI 学习计划吗？删除后无法恢复。",
      "删除确认",
      {
        confirmButtonText: "确定删除",
        cancelButtonText: "取消",
        type: "warning"
      }
    )
  } catch {
    return
  }

  const result = await aiPlanStore.deletePlan(id)

  if (!result.success) {
    ElMessage.error(
      result.message || "删除计划失败"
    )
    return
  }

  ElMessage.success("AI 学习计划已删除")
}
</script>

<style scoped>
.plans-page {
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
}

.filter-card {
  margin-top: 20px;
}

.status-box {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  min-height: 180px;
  color: #666;
}

.plan-list {
  display: grid;
  gap: 20px;
  margin-top: 20px;
}

.plan-card {
  border: 1px solid #e2eee6;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.plan-date {
  margin: 8px 0 0;
  color: #777;
  font-size: 14px;
}

.request-box {
  margin-bottom: 16px;
  padding: 14px;
  border-radius: 10px;
  background: #f6f7f8;
}

.request-box p {
  margin: 8px 0 0;
  line-height: 1.7;
  white-space: pre-wrap;
}

.plan-content {
  padding: 16px;
  border: 1px solid #d8efe1;
  border-radius: 10px;
  background: #f7fcf9;
  line-height: 1.8;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.updated-time {
  margin: 14px 0 0;
  color: #999;
  font-size: 13px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

@media (max-width: 600px) {
  .page-header {
    flex-direction: column;
  }

  .page-header .el-button {
    width: 100%;
  }

  .filter-card {
    overflow-x: auto;
  }

  .plan-header {
    flex-direction: column;
  }

  .actions {
    flex-direction: column;
  }

  .actions .el-button {
    width: 100%;
    margin-left: 0;
  }
}
</style>