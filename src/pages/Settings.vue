<template>
  <div class="settings-page">
    <h2>⚙️ 设置</h2>

    <el-card class="card">
      <template #header>
        <strong>📅 考研日期</strong>
      </template>

      <el-date-picker
        v-model="settingsStore.examDate"
        type="date"
        value-format="YYYY-MM-DD"
        placeholder="选择考研日期"
      />
    </el-card>

    <el-card class="card">
      <template #header>
        <strong>🎯 每日学习目标</strong>
      </template>

      <div
        v-for="goal in settingsStore.goals"
        :key="goal.subject"
        class="goal-row"
      >
        <span>{{ goal.subject }}</span>

        <el-input-number
          v-model="goal.targetHours"
          :min="0"
          :step="0.5"
        />

        <span>小时</span>
      </div>
    </el-card>

    <el-card class="card">
      <template #header>
        <strong>🗑 数据管理</strong>
      </template>

      <el-button type="danger" @click="clearData">
        清空所有学习记录
      </el-button>

      <p class="tip">
        注意：此操作不可恢复。
      </p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ElMessageBox, ElMessage } from "element-plus"
import { useStudyStore } from "../stores/study"
import { useSettingsStore } from "../stores/settings"

const studyStore = useStudyStore()
const settingsStore = useSettingsStore()

function clearData() {
  ElMessageBox.confirm(
    "确定要清空所有学习记录吗？此操作不可恢复。",
    "危险操作",
    {
      confirmButtonText: "确认清空",
      cancelButtonText: "取消",
      type: "warning"
    }
  ).then(() => {
    studyStore.records.length = 0
    localStorage.removeItem("study-records")
    ElMessage.success("已清空学习记录")
  })
}
</script>

<style scoped>
.settings-page {
  margin-top: 20px;
}

.card {
  margin-top: 20px;
}

.goal-row {
  display: grid;
  grid-template-columns: 80px 160px 40px;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.tip {
  margin-top: 15px;
  color: #888;
}
</style>