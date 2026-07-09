<template>
  <div class="coach-page">
    <h2>🤖 AI 学习教练</h2>

    <el-card class="card">
      <template #header>
        <strong>🏆 今日学习评分</strong>
      </template>

      <h1 class="score">{{ studyScore }} 分</h1>
      <p>{{ scoreComment }}</p>
    </el-card>

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
        <strong>
          {{ formatTime(item.duration) }}
          / 目标 {{ item.targetHours }} 小时
        </strong>
      </div>
    </el-card>

    <el-card class="card">
      <template #header>
        <strong>📉 薄弱科目提醒</strong>
      </template>

      <p v-if="weakSubjects.length === 0">
        今天没有明显薄弱科目，整体学习覆盖不错。
      </p>

      <p v-else>
        今天需要重点关注：{{ weakSubjects.join("、") }}
      </p>
    </el-card>

    <el-card class="card">
      <template #header>
        <strong>📅 明日学习计划</strong>
      </template>

      <div
        v-for="plan in tomorrowPlan"
        :key="plan"
        class="plan"
      >
        {{ plan }}
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

    <el-card class="card">
      <template #header>
        <strong>💬 今日鼓励</strong>
      </template>

      <p>{{ encouragement }}</p>
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

const weakSubjects = computed(() => {
  return todaySubjectStats.value
    .filter(item => item.targetHours > 0 && item.duration < item.targetHours * 3600 * 0.5)
    .map(item => item.subject)
})

const studyScore = computed(() => {
  let score = completionRate.value

  if (todayRecords.value.length >= 3) {
    score += 5
  }

  const studiedSubjects = todaySubjectStats.value.filter(item => item.duration > 0).length

  if (studiedSubjects >= 3) {
    score += 5
  }

  if (weakSubjects.value.length === 0 && todayTotal.value > 0) {
    score += 5
  }

  return Math.min(score, 100)
})

const scoreComment = computed(() => {
  if (studyScore.value >= 90) return "优秀！今天学习状态非常好。"
  if (studyScore.value >= 75) return "良好！今天完成度不错，继续保持。"
  if (studyScore.value >= 50) return "一般，还可以继续补充一些学习时间。"
  return "今天学习量偏少，建议先完成一个番茄钟。"
})

const tomorrowPlan = computed(() => {
  const plans: string[] = []

  if (weakSubjects.value.length > 0) {
    weakSubjects.value.slice(0, 3).forEach((subject, index) => {
      const time = ["09:00", "14:00", "19:00"][index] || "20:00"
      plans.push(`${time} 复习/学习 ${subject} 60 分钟`)
    })
  } else {
    plans.push("09:00 703 专业课复盘 60 分钟")
    plans.push("14:00 英语一阅读或长难句 60 分钟")
    plans.push("19:00 政治选择题 40 分钟")
  }

  return plans
})

const suggestions = computed(() => {
  const tips: string[] = []

  if (todayTotal.value === 0) {
    tips.push("今天还没有学习记录，建议先完成一个 25 分钟番茄钟。")
    tips.push("可以优先从英语一或703专业课中最薄弱的一门开始。")
    return tips
  }

  tips.push(`今天已经学习 ${todayTotalText.value}，完成率 ${completionRate.value}%。`)

  if (weakSubjects.value.length > 0) {
    tips.push(`今天较薄弱的科目是：${weakSubjects.value.join("、")}。建议优先补齐其中 1～2 门。`)
  } else {
    tips.push("今天各科覆盖较好，可以安排轻量复习巩固。")
  }

  if (completionRate.value >= 80) {
    tips.push("今天整体学习完成度较高，建议晚上做复盘，避免过度疲劳。")
  } else {
    tips.push("今天目标完成率还不高，建议先完成核心科目，再安排公共课巩固。")
  }

  return tips
})

const encouragement = computed(() => {
  if (studyScore.value >= 90) {
    return "今天非常优秀！保持这个节奏，你会越来越接近目标。"
  }

  if (studyScore.value >= 75) {
    return "今天表现不错，坚持比完美更重要，继续稳步推进。"
  }

  if (studyScore.value >= 50) {
    return "今天已经开始行动了，再补一点时间就会更好。"
  }

  return "哪怕只学 25 分钟，也是在向目标靠近。先开始，就是胜利。"
})
</script>

<style scoped>
.coach-page {
  margin-top: 20px;
}

.card {
  margin-top: 20px;
}

.score {
  font-size: 52px;
  color: #2e8b57;
  margin: 10px 0;
}

.row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.row:last-child {
  border-bottom: none;
}

.plan {
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.plan:last-child {
  border-bottom: none;
}
</style>