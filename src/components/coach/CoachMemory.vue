<template>
  <div class="memory-section">
    <div class="memory-header">
      <div>
        <h3>🧠 AI 长期记忆</h3>

        <p>
          管理 AI 已记住的学习偏好、薄弱科目、时间安排和长期目标。
        </p>
      </div>

      <div class="header-actions">
        <el-button
          plain
          :loading="aiMemoryStore.loading"
          @click="refreshMemories"
        >
          刷新
        </el-button>

        <el-button
          type="primary"
          :disabled="!authStore.user"
          @click="openCreateDialog"
        >
          ＋ 新增记忆
        </el-button>
      </div>
    </div>

    <el-alert
      v-if="!authStore.user"
      title="请先登录账号，再管理 AI 长期记忆"
      type="warning"
      :closable="false"
      show-icon
    />

    <el-alert
      v-if="aiMemoryStore.errorMessage"
      :title="aiMemoryStore.errorMessage"
      type="error"
      :closable="false"
      show-icon
    />

    <el-card v-if="authStore.user" class="filter-card">
      <div class="filter-row">
        <el-select
          v-model="typeFilter"
          placeholder="记忆类型"
          class="filter-select"
        >
          <el-option
            label="全部类型"
            value="all"
          />

          <el-option
            v-for="option in memoryTypeOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>

        <el-select
          v-model="statusFilter"
          placeholder="记忆状态"
          class="filter-select"
        >
          <el-option
            label="全部状态"
            value="all"
          />

          <el-option
            label="正在使用"
            value="active"
          />

          <el-option
            label="已停用"
            value="inactive"
          />
        </el-select>

        <el-input
          v-model="keyword"
          clearable
          class="keyword-input"
          placeholder="搜索标题或内容"
        />

        <div class="memory-count">
          共 {{ filteredMemories.length }} 条
        </div>
      </div>
    </el-card>

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
        authStore.user &&
        filteredMemories.length === 0
      "
      description="没有符合条件的长期记忆"
    >
      <el-button
        type="primary"
        @click="openCreateDialog"
      >
        新增第一条记忆
      </el-button>
    </el-empty>

    <div
      v-else-if="authStore.user"
      class="memory-list"
    >
      <el-card
        v-for="memory in filteredMemories"
        :key="memory.id"
        class="memory-card"
        :class="{
          inactive: !memory.active
        }"
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

              <el-tag
                v-if="!memory.active"
                type="info"
                effect="plain"
              >
                已停用
              </el-tag>
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

        <div class="memory-meta">
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

        <div class="memory-actions">
          <el-button
            size="small"
            @click="openEditDialog(memory)"
          >
            编辑
          </el-button>

          <el-button
            v-if="memory.active"
            size="small"
            type="warning"
            plain
            @click="deactivateMemory(memory.id)"
          >
            停用
          </el-button>

          <el-button
            v-else
            size="small"
            type="success"
            plain
            @click="activateMemory(memory.id)"
          >
            启用
          </el-button>

          <el-button
            size="small"
            type="danger"
            plain
            @click="deleteMemory(memory.id)"
          >
            删除
          </el-button>
        </div>
      </el-card>
    </div>

    <el-card
      v-if="authStore.user"
      class="summary-card"
    >
      <template #header>
        <strong>📌 当前记忆概况</strong>
      </template>

      <div class="summary-grid">
        <div class="summary-item">
          <span>全部记忆</span>
          <strong>{{ aiMemoryStore.memories.length }}</strong>
        </div>

        <div class="summary-item">
          <span>正在使用</span>
          <strong>
            {{ aiMemoryStore.activeMemories.length }}
          </strong>
        </div>

        <div class="summary-item">
          <span>已停用</span>
          <strong>
            {{ aiMemoryStore.inactiveMemories.length }}
          </strong>
        </div>

        <div class="summary-item">
          <span>重要记忆</span>
          <strong>
            {{ aiMemoryStore.importantMemories.length }}
          </strong>
        </div>
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="
        editingMemoryId
          ? '编辑 AI 记忆'
          : '新增 AI 记忆'
      "
      width="560px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-position="top"
      >
        <el-form-item
          label="记忆类型"
          prop="memoryType"
        >
          <el-select
            v-model="form.memoryType"
            class="full-width"
          >
            <el-option
              v-for="option in memoryTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item
          label="标题"
          prop="title"
        >
          <el-input
            v-model="form.title"
            maxlength="60"
            show-word-limit
            placeholder="例如：每日可用学习时间"
          />
        </el-form-item>

        <el-form-item
          label="内容"
          prop="content"
        >
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="5"
            maxlength="500"
            show-word-limit
            placeholder="例如：通常每天最多学习3小时，晚上8点以后状态较好。"
          />
        </el-form-item>

        <el-form-item label="重要程度">
          <el-rate
            v-model="form.importance"
            show-score
            score-template="{value} / 5"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button
          :disabled="aiMemoryStore.saving"
          @click="dialogVisible = false"
        >
          取消
        </el-button>

        <el-button
          type="primary"
          :loading="aiMemoryStore.saving"
          @click="submitForm"
        >
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  reactive,
  ref
} from "vue"
import {
  ElMessage,
  ElMessageBox
} from "element-plus"
import type {
  FormInstance,
  FormRules,
  TagProps
} from "element-plus"
import { Loading } from "@element-plus/icons-vue"

import { useAuthStore } from "../../stores/auth"
import {
  useAiMemoryStore,
  type AiMemory,
  type AiMemoryType
} from "../../stores/aimemory"

type MemoryStatusFilter =
  | "all"
  | "active"
  | "inactive"

type MemoryTypeFilter =
  | "all"
  | AiMemoryType

interface MemoryForm {
  memoryType: AiMemoryType
  title: string
  content: string
  importance: number
}

const authStore = useAuthStore()
const aiMemoryStore = useAiMemoryStore()

const typeFilter = ref<MemoryTypeFilter>("all")
const statusFilter =
  ref<MemoryStatusFilter>("all")
const keyword = ref("")

const dialogVisible = ref(false)
const editingMemoryId = ref("")
const formRef = ref<FormInstance>()

const memoryTypeOptions: Array<{
  label: string
  value: AiMemoryType
}> = [
  {
    label: "学习偏好",
    value: "study_preference"
  },
  {
    label: "薄弱科目",
    value: "weak_subject"
  },
  {
    label: "学习时间",
    value: "study_schedule"
  },
  {
    label: "学习目标",
    value: "learning_goal"
  },
  {
    label: "个人备注",
    value: "personal_note"
  }
]

const form = reactive<MemoryForm>({
  memoryType: "study_preference",
  title: "",
  content: "",
  importance: 3
})

const formRules: FormRules<MemoryForm> = {
  memoryType: [
    {
      required: true,
      message: "请选择记忆类型",
      trigger: "change"
    }
  ],
  title: [
    {
      required: true,
      message: "请输入记忆标题",
      trigger: "blur"
    }
  ],
  content: [
    {
      required: true,
      message: "请输入记忆内容",
      trigger: "blur"
    }
  ]
}

const filteredMemories = computed(() => {
  const searchText = keyword.value
    .trim()
    .toLowerCase()

  return aiMemoryStore.memories.filter(memory => {
    if (
      typeFilter.value !== "all" &&
      memory.memoryType !== typeFilter.value
    ) {
      return false
    }

    if (
      statusFilter.value === "active" &&
      !memory.active
    ) {
      return false
    }

    if (
      statusFilter.value === "inactive" &&
      memory.active
    ) {
      return false
    }

    if (!searchText) {
      return true
    }

    return (
      memory.title.toLowerCase().includes(searchText) ||
      memory.content.toLowerCase().includes(searchText)
    )
  })
})

function resetForm() {
  editingMemoryId.value = ""
  form.memoryType = "study_preference"
  form.title = ""
  form.content = ""
  form.importance = 3

  formRef.value?.clearValidate()
}

function openCreateDialog() {
  resetForm()
  dialogVisible.value = true
}

function openEditDialog(memory: AiMemory) {
  editingMemoryId.value = memory.id
  form.memoryType = memory.memoryType
  form.title = memory.title
  form.content = memory.content
  form.importance = memory.importance
  dialogVisible.value = true

  formRef.value?.clearValidate()
}

async function submitForm() {
  const valid = await formRef.value
    ?.validate()
    .catch(() => false)

  if (!valid) {
    return
  }

  if (editingMemoryId.value) {
    const result =
      await aiMemoryStore.updateMemory(
        editingMemoryId.value,
        {
          memoryType: form.memoryType,
          title: form.title,
          content: form.content,
          importance: form.importance
        }
      )

    if (!result.success) {
      ElMessage.error(
        result.message || "修改记忆失败"
      )
      return
    }

    ElMessage.success("AI 记忆修改成功")
  } else {
    const result =
      await aiMemoryStore.addMemory({
        memoryType: form.memoryType,
        title: form.title,
        content: form.content,
        importance: form.importance,
        source: "manual"
      })

    if (!result.success) {
      ElMessage.error(
        result.message || "新增记忆失败"
      )
      return
    }

    ElMessage.success("AI 记忆新增成功")
  }

  dialogVisible.value = false
  resetForm()
}

async function activateMemory(id: string) {
  const result =
    await aiMemoryStore.activateMemory(id)

  if (!result.success) {
    ElMessage.error(
      result.message || "启用记忆失败"
    )
    return
  }

  ElMessage.success("AI 记忆已启用")
}

async function deactivateMemory(id: string) {
  const result =
    await aiMemoryStore.deactivateMemory(id)

  if (!result.success) {
    ElMessage.error(
      result.message || "停用记忆失败"
    )
    return
  }

  ElMessage.success("AI 记忆已停用")
}

async function deleteMemory(id: string) {
  try {
    await ElMessageBox.confirm(
      "确定删除这条 AI 记忆吗？删除后无法恢复。",
      "删除记忆",
      {
        type: "warning",
        confirmButtonText: "确定删除",
        cancelButtonText: "取消"
      }
    )
  } catch {
    return
  }

  const result =
    await aiMemoryStore.deleteMemory(id)

  if (!result.success) {
    ElMessage.error(
      result.message || "删除记忆失败"
    )
    return
  }

  ElMessage.success("AI 记忆已删除")
}

async function refreshMemories() {
  await aiMemoryStore.loadMemories()

  if (!aiMemoryStore.errorMessage) {
    ElMessage.success("AI 记忆已刷新")
  }
}

function getMemoryTagType(
  memoryType: AiMemoryType
): TagProps["type"] {
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

.header-actions {
  display: flex;
  flex: none;
  gap: 10px;
}

.filter-card {
  border: 1px solid #e2eee6;
}

.filter-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-select {
  width: 150px;
}

.keyword-input {
  width: 240px;
}

.memory-count {
  margin-left: auto;
  color: #888;
  font-size: 14px;
}

.loading-box {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  min-height: 180px;
  color: #666;
}

.memory-list {
  display: grid;
  gap: 16px;
}

.memory-card {
  border: 1px solid #e2eee6;
  transition:
    opacity 0.2s,
    transform 0.2s;
}

.memory-card:hover {
  transform: translateY(-2px);
}

.memory-card.inactive {
  opacity: 0.65;
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

.memory-meta {
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

.memory-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.summary-card {
  border: 1px solid #d8efe1;
  background: #f7fcf9;
}

.summary-grid {
  display: grid;
  grid-template-columns:
    repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.summary-item {
  padding: 16px;
  border-radius: 10px;
  background: #fff;
  text-align: center;
}

.summary-item span,
.summary-item strong {
  display: block;
}

.summary-item span {
  color: #777;
  font-size: 13px;
}

.summary-item strong {
  margin-top: 8px;
  color: #2e8b57;
  font-size: 24px;
}

.full-width {
  width: 100%;
}

@media (max-width: 700px) {
  .memory-header {
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions .el-button {
    flex: 1;
    margin-left: 0;
  }

  .filter-row {
    align-items: stretch;
    flex-direction: column;
  }

  .filter-select,
  .keyword-input {
    width: 100%;
  }

  .memory-count {
    margin-left: 0;
    text-align: right;
  }

  .memory-card-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .memory-meta {
    flex-direction: column;
  }

  .summary-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }
}
</style>