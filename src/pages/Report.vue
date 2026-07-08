<template>
  <div class="report-page">
    <h2>📈 学习报告</h2>

    <el-card class="card">
      <template #header>
        <strong>📊 总览</strong>
      </template>

      <p>📚 学习总次数：{{ studyStore.records.length }} 次</p>
      <p>⏱ 学习总时长：{{ totalTimeText }}</p>
    </el-card>

    <el-card class="card">
      <template #header>
        <strong>📈 最近 7 天学习趋势</strong>
      </template>

      <StudyTrendChart
        :dates="last7Days.map(item => item.date)"
        :durations="last7Days.map(item => item.duration)"
      />
    </el-card>

    <el-card class="card">
      <template #header>
        <strong>🥧 科目学习占比</strong>
      </template>

      <SubjectPieChart
        :subjects="activeSubjectStats.map(item => item.subject)"
        :durations="activeSubjectStats.map(item => item.duration)"
      />
    </el-card>

    <el-card class="card">
      <template #header>
        <strong>📚 各科目学习时长</strong>
      </template>

      <div
        v-for="item in subjectStats"
        :key="item.subject"
        class="stat"
      >
        <span>{{ item.subject }}</span>
        <strong>{{ formatTime(item.duration) }}</strong>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useStudyStore } from "../stores/study"
import { SUBJECTS } from "../constants/subjects"
import StudyTrendChart from "../components/report/StudyTrendChart.vue"
import SubjectPieChart from "../components/report/SubjectPieChart.vue"

const studyStore = useStudyStore()

function formatTime(total: number) {
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60

  return `${h}小时 ${m}分 ${s}秒`
}

const totalSeconds = computed(() => {
  return studyStore.records.reduce((sum, item) => {
    return sum + (item.duration || 0)
  }, 0)
})

const totalTimeText = computed(() => {
  return formatTime(totalSeconds.value)
})

const subjectStats = computed(() => {
  return SUBJECTS.map(subject => {
    const duration = studyStore.records
      .filter(item => item.subject === subject)
      .reduce((sum, item) => sum + (item.duration || 0), 0)

    return {
      subject,
      duration
    }
  })
})

const activeSubjectStats = computed(() => {
  return subjectStats.value.filter(item => item.duration > 0)
})

const last7Days = computed(() => {
  const result = []

  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)

    const dateText = date.toISOString().slice(0, 10)

    const duration = studyStore.records
      .filter(item => item.date === dateText)
      .reduce((sum, item) => sum + (item.duration || 0), 0)

    result.push({
      date: dateText,
      duration
    })
  }

  return result
})
</script>

<style scoped>
.report-page {
  margin-top: 20px;
}

.card {
  margin-top: 20px;
}

.stat {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.stat:last-child {
  border-bottom: none;
}
</style>