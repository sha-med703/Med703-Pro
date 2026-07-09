<template>
  <div class="heatmap">
    <div
      v-for="day in days"
      :key="day.date"
      class="cell"
      :class="getLevel(day.duration)"
      :title="`${day.date}：${formatTime(day.duration)}`"
    ></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  days: {
    date: string
    duration: number
  }[]
}>()

function getLevel(duration: number) {
  if (duration === 0) return "level-0"
  if (duration < 1800) return "level-1"
  if (duration < 3600) return "level-2"
  if (duration < 7200) return "level-3"
  return "level-4"
}

function formatTime(total: number) {
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)

  return `${h}小时${m}分`
}
</script>

<style scoped>
.heatmap {
  display: grid;
  grid-template-columns: repeat(14, 18px);
  gap: 6px;
  margin-top: 10px;
}

.cell {
  width: 18px;
  height: 18px;
  border-radius: 4px;
}

.level-0 {
  background: #ebedf0;
}

.level-1 {
  background: #c6e48b;
}

.level-2 {
  background: #7bc96f;
}

.level-3 {
  background: #239a3b;
}

.level-4 {
  background: #196127;
}
</style>