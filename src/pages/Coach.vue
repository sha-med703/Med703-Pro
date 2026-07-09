<template>
  <div class="coach-page">
    <h2>🤖 AI 学习教练</h2>

    <el-card class="card">
      <template #header>
        <strong>📅 今日学习分析</strong>
      </template>

      <p>今日总学习时长：{{ todayTotalText }}</p>
      <p>今日学习次数：{{ todayRecords.length }} 次</p>
      <p>今日目标完成率：{{ completionRate }}%</p>
    </el-card>

    <el-card class="card">
      <template #header>
        <strong>📚 今日科目情况</strong>
      </template>

      <div
        v-for="item in todaySubjectStats"
        :key="item.subject"
        class="row"
      >
        <span>{{ item.subject }}</span>
        <strong>{{ formatTime(item.duration) }}</strong>
      </div>
    </el-card>

    <el-card class="card">
      <template #header>
        <strong>💡 AI 学习建议</strong>
      </template>

      <p
        v-for="tip in suggestions"
        :key="tip"
      >
        {{ tip }}
      </p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useStudyStore } from "../stores/study"
import { useSettingsStore } from "../stores/settings"

const studyStore = useStudyStore()
const settingsStore = useSettingsStore()

function getToday() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function formatTime(total: number) {
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)

  return `${h}小时 ${m}分`
}

const todayRecords = computed(() => {
  return studyStore.records.filter(item => item.date === getToday())
})

const todayTotal = computed(() => {
  return todayRecords.value.reduce((sum, item) => {
    return sum + (item.duration || 0)
  }, 0)
})

const todayTotalText = computed(() => {
  return formatTime(todayTotal.value)
})

const todaySubjectStats = computed(() => {
  return settingsStore.goals.map(goal => {
    const duration = todayRecords.value
      .filter(item => item.subject === goal.subject)
      .reduce((sum, item) => sum + (item.duration || 0), 0)

    return {
      subject: goal.subject,
      targetHours: goal.targetHours,
      duration
    }
  })
})

const totalTargetSeconds = computed(() => {
  return settingsStore.goals.reduce((sum, item) => {
    return sum + item.targetHours * 3600
  }, 0)
})

const completionRate = computed(() => {
  if (totalTargetSeconds.value === 0) return 0

  return Math.min(
    Math.floor((todayTotal.value / totalTargetSeconds.value) * 100),
    100
  )
})

const suggestions = computed(() => {
  const tips: string[] = []

  if (todayTotal.value === 0) {
    tips.push("今天还没有学习记录，建议先完成一个 25 分钟番茄钟。")
    tips.push("可以优先从英语一或703专业课中最薄弱的一门开始。")
    return tips
  }

  tips.push(`今天已经学习 ${todayTotalText.value}，完成率 ${completionRate.value}%。`)

  const weakSubjects = todaySubjectStats.value
    .filter(item => item.targetHours > 0 && item.duration === 0)
    .map(item => item.subject)

  if (weakSubjects.length > 0) {
    tips.push(`今天还没有学习：${weakSubjects.join("、")}。建议优先补齐其中 1～2 门。`)
  } else {
    tips.push("今天所有设定科目都有学习记录，整体完成度很好。")
  }

  const lowProgress = todaySubjectStats.value.find(item => {
    const target = item.targetHours * 3600
    return target > 0 && item.duration > 0 && item.duration < target * 0.5
  })

  if (lowProgress) {
    tips.push(`${lowProgress.subject} 今天学习时间偏少，可以再补充 30～60 分钟。`)
  }

  if (completionRate.value >= 80) {
    tips.push("今天整体学习完成度较高，建议晚上安排轻量复习，避免过度疲劳。")
  } else {
    tips.push("今天目标完成率还不高，建议优先完成核心科目，再安排公共课巩固。")
  }

  return tips
})
</script>

<style scoped>
.coach-page {
  margin-top: 20px;
}

.card {
  margin-top: 20px;
}

.row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.row:last-child {
  border-bottom: none;
}
</style>