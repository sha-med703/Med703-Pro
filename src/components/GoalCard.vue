<template>
  <div class="card">
    <h2>🎯 今日学习目标</h2>

    <div
      v-for="goal in goals"
      :key="goal.subject"
      class="goal"
    >
      <div class="goal-title">
        <span>{{ goal.subject }}</span>
        <span>{{ getProgress(goal.subject) }}%</span>
      </div>

      <div class="bar">
        <div
          class="bar-inner"
          :style="{ width: getProgress(goal.subject) + '%' }"
        ></div>
      </div>

      <p>目标：{{ goal.targetHours }} 小时</p>
    </div>
  </div>
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

  const targetSeconds = goal.targetHours * 3600

  return Math.min(
    Math.floor((totalSeconds / targetSeconds) * 100),
    100
  )
}
</script>

<style scoped>
.card {
  margin-top: 30px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,.08);
}

.goal {
  margin-bottom: 20px;
}

.goal-title {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
}

.bar {
  height: 12px;
  background: #e5e5e5;
  border-radius: 20px;
  overflow: hidden;
  margin: 8px 0;
}

.bar-inner {
  height: 100%;
  background: #2e8b57;
}
</style>