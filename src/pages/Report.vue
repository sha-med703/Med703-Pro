<template>
  <div class="report-page">
    <h2>📈 学习报告</h2>

    <div class="card">
      <p>📚 学习总次数：{{ studyStore.records.length }} 次</p>
      <p>⏱ 学习总时长：{{ totalTime }}</p>
      <p>📊 学习报告功能开发中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useStudyStore } from "../stores/study"

const studyStore = useStudyStore()

const totalTime = computed(() => {
  const total = studyStore.records.reduce((sum, item) => {
    return sum + (item.duration || 0)
  }, 0)

  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60

  return `${h}小时 ${m}分 ${s}秒`
})
</script>

<style scoped>
.report-page {
  margin-top: 20px;
}

.card {
  margin-top: 20px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,.08);
}
</style>