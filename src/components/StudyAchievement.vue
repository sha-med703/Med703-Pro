<template>
  <el-card class="card">
    <template #header>
      <strong>🔥 学习成就</strong>
    </template>

    <div class="item">
      <span>🔥 连续学习</span>
      <strong>{{ streak }} 天</strong>
    </div>

    <div class="item">
      <span>🏆 最长连续</span>
      <strong>{{ longest }} 天</strong>
    </div>

    <div class="item">
      <span>📅 本月学习</span>
      <strong>{{ monthDays }} 天</strong>
    </div>

    <div class="item">
      <span>📚 学习记录</span>
      <strong>{{ totalRecords }} 次</strong>
    </div>
  </el-card>
</template>

<script setup lang="ts">
defineProps<{
  streak: number
  longest: number
  monthDays: number
  totalRecords: number
}>()
</script>

<style scoped>
.card {
  margin-top: 20px;
}

.item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.item:last-child {
  border-bottom: none;
}
</style>