<template>
  <el-card class="card">
    <template #header>
      <strong>🎯 今日学习目标</strong>
    </template>

    <div
      v-for="goal in goals"
      :key="goal.subject"
      class="goal"
    >
      <div class="goal-title">
        <span>{{ goal.subject }}</span>
        <span>{{ getProgress(goal.subject) }}%</span>
      </div>

      <el-progress
        :percentage="getProgress(goal.subject)"
        :stroke-width="12"
      />

      <p>目标：{{ goal.targetHours }} 小时</p>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import type { StudyRecord } from "../types/study"

const props = defineProps<{
  records?: StudyRecord[]
}>()

const goals = [
  { subject: "生理", targetHours: 2 },
  { subject: "生化", targetHours: 1 },
  { subject: "病理", targetHours: 1 },
  { subject: "病生", targetHours: 1 },
  { subject: "免疫", targetHours: 1 }
]

function getProgress(subject: string) {
  const records = props.records ?? []

  const totalSeconds = records
    .filter(item => item.subject === subject)
    .reduce((sum, item) => sum + (item.duration || 0), 0)

  const goal = goals.find(item => item.subject === subject)

  if (!goal) return 0

  return Math.min(
    Math.floor((totalSeconds / (goal.targetHours * 3600)) * 100),
    100
  )
}
</script>

<style scoped>
.card {
  margin-top: 30px;
}

.goal {
  margin-bottom: 22px;
}

.goal-title {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  margin-bottom: 8px;
}
</style>