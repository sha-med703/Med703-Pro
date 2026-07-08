<template>
  <div class="dashboard">
    <h2>🏠 首页</h2>

    <div class="section-title">① 倒计时</div>
    <CountdownCard />

    <div class="section-title">② 今日统计</div>
    <TodayStats :records="studyStore.records" />

    <div class="section-title">③ 今日目标</div>
    <GoalCard :records="studyStore.records" />
  </div>
</template>

<script setup lang="ts">
import CountdownCard from "../components/CountdownCard.vue"
import TodayStats from "../components/TodayStats.vue"
import GoalCard from "../components/GoalCard.vue"
import { useStudyStore } from "../stores/study"

const studyStore = useStudyStore()
</script>

<style scoped>
.dashboard {
  margin-top: 20px;
}

.section-title {
  margin-top: 30px;
  font-size: 22px;
  font-weight: bold;
  color: #2e8b57;
}
</style>