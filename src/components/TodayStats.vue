<template>
  <el-card class="card">
    <template #header>
      <strong>📊 今日统计</strong>
    </template>

    <div class="item">
      <span>学习次数</span>
      <strong>{{ safeRecords.length }} 次</strong>
    </div>

    <div class="item">
      <span>学习总时长</span>
      <strong>{{ totalTime }}</strong>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from "vue"
import type { StudyRecord } from "../types/study"

const props = defineProps<{
  records?: StudyRecord[]
}>()

const safeRecords = computed(() => props.records || [])

const totalTime = computed(() => {
  const total = safeRecords.value.reduce((sum, item) => {
    return sum + (item.duration || 0)
  }, 0)

  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60

  return `${h}小时 ${m}分 ${s}秒`
})
</script>

<style scoped>
.card {
  margin-top: 30px;
}

.item {
  display: flex;
  justify-content: space-between;
  margin: 15px 0;
  font-size: 18px;
}
</style>