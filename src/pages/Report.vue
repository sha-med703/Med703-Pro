<template>
  <div class="report-page">
    <h2>📈 学习报告</h2>

    <div class="card">
      <h3>📊 总览</h3>
      <p>📚 学习总次数：{{ studyStore.records.length }} 次</p>
      <p>⏱ 学习总时长：{{ totalTimeText }}</p>
    </div>

    <div class="card">
      <h3>📚 各科目学习时长</h3>

      <div
        v-for="item in subjectStats"
        :key="item.subject"
        class="stat"
      >
        <span>{{ item.subject }}</span>
        <strong>{{ formatTime(item.duration) }}</strong>
      </div>
    </div>

    <div class="card">
      <h3>📅 最近 7 天学习趋势</h3>

      <div
        v-for="item in last7Days"
        :key="item.date"
        class="stat"
      >
        <span>{{ item.date }}</span>
        <strong>{{ formatTime(item.duration) }}</strong>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useStudyStore } from "../stores/study"

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

const subjects = ["生理", "生化", "病理", "病生", "免疫"]

const subjectStats = computed(() => {
  return subjects.map(subject => {
    const duration = studyStore.records
      .filter(item => item.subject === subject)
      .reduce((sum, item) => sum + (item.duration || 0), 0)

    return {
      subject,
      duration
    }
  })
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
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,.08);
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