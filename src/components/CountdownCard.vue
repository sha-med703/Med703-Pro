<template>
  <el-card class="countdown-card">
    <template #header>
      <strong>⏳ 考研倒计时</strong>
    </template>

    <div class="days">
      {{ daysLeft }}
    </div>

    <p>距离 703 考研还有 {{ daysLeft }} 天</p>
    <p class="date">考试日期：{{ settingsStore.examDate }}</p>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useSettingsStore } from "../stores/settings"

const settingsStore = useSettingsStore()

const daysLeft = computed(() => {
  const examDate = new Date(settingsStore.examDate)
  const today = new Date()
  const diff = examDate.getTime() - today.getTime()

  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0)
})
</script>

<style scoped>
.countdown-card {
  margin-top: 30px;
  text-align: center;
}

.days {
  font-size: 48px;
  font-weight: bold;
  color: #2e8b57;
  margin: 20px 0;
}

.date {
  color: #888;
}
</style>