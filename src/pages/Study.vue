<template>
  <div class="study-page">
    <h2>📚 学习中心</h2>

    <StudyTimer @finish="studyStore.addRecord" />

    <PomodoroTimer />

    <StudyRecord
      :records="studyStore.records"
      @delete="studyStore.deleteRecord"
    />
  </div>
</template>

<script setup lang="ts">
import StudyTimer from "../components/StudyTimer.vue"
import PomodoroTimer from "../components/PomodoroTimer.vue"
import StudyRecord from "../components/StudyRecord.vue"
import { useStudyStore } from "../stores/study"

const studyStore = useStudyStore()
</script>

<style scoped>
.study-page {
  margin-top: 20px;
}
</style>