<template>
  <div class="card">
    <h2>⏳ 考研倒计时</h2>

    <div class="days">
      {{ daysLeft }}
    </div>

    <p>距离 703 考研还有 {{ daysLeft }} 天</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"

const examDate = new Date("2026-12-20")

const daysLeft = computed(() => {
  const today = new Date()
  const diff = examDate.getTime() - today.getTime()
  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0)
})
</script>

<style scoped>
.card {
  margin-top: 30px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,.08);
  text-align: center;
}

.days {
  font-size: 48px;
  font-weight: bold;
  color: #2e8b57;
  margin: 20px 0;
}
</style>