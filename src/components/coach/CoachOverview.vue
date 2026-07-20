<template>
  <div class="overview">
    <div class="report-header">
      <div>
        <h3>📊 今日学习总览</h3>
        <p>
          本地数据实时统计，AI 报告由 DeepSeek 结合学习记录、复习任务和长期记忆生成。
        </p>
      </div>

      <div class="report-actions">
        <el-tag
          v-if="aiReport"
          :type="reportOutdated ? 'warning' : 'success'"
          effect="light"
        >
          {{
            reportOutdated
              ? "学习数据已变化"
              : "今日 AI 报告已生成"
          }}
        </el-tag>

        <el-button
          type="primary"
          :loading="generatingReport"
          :disabled="
            generatingReport ||
            !authStore.user
          "
          @click="generateAiReport"
        >
          {{
            aiReport
              ? "重新生成 AI 报告"
              : "生成 AI 今日报告"
          }}
        </el-button>
      </div>
    </div>

    <el-alert
      v-if="!authStore.user"
      title="请先登录账号，再生成 AI 每日学习报告"
      type="warning"
      :closable="false"
      show-icon
    />

    <div class="overview-grid">
      <el-card class="card score-card">
        <template #header>
          <strong>🏆 今日学习评分</strong>
        </template>

        <div class="score-content">
          <h1 class="score">
            {{ studyScore }} 分
          </h1>

          <p>{{ scoreComment }}</p>

          <el-progress
            :percentage="studyScore"
            :stroke-width="12"
            :status="
              studyScore >= 80
                ? 'success'
                : undefined
            "
          />
        </div>
      </el-card>

      <el-card class="card">
        <template #header>
          <strong>📅 今日学习分析</strong>
        </template>

        <div class="summary-list">
          <div class="summary-item">
            <span>今日总学习时长</span>
            <strong>{{ todayTotalText }}</strong>
          </div>

          <div class="summary-item">
            <span>今日学习次数</span>
            <strong>
              {{ todayRecords.length }} 次
            </strong>
          </div>

          <div class="summary-item">
            <span>今日目标完成率</span>
            <strong>{{ completionRate }}%</strong>
          </div>

          <div class="summary-item">
            <span>到期未完成复习</span>
            <strong>
              {{ todayPendingReviewCount }} 项
            </strong>
          </div>
        </div>
      </el-card>
    </div>

    <el-card class="card">
      <template #header>
        <strong>📚 今日科目情况</strong>
      </template>

      <div
        v-if="todaySubjectStats.length === 0"
        class="empty-text"
      >
        暂未设置每日学习目标。
      </div>

      <div
        v-for="item in todaySubjectStats"
        :key="item.subject"
        class="subject-row"
      >
        <div class="subject-info">
          <strong>{{ item.subject }}</strong>

          <span>
            {{ formatTime(item.duration) }}
            / 目标 {{ item.targetHours }} 小时
          </span>
        </div>

        <el-progress
          :percentage="getSubjectProgress(item)"
          :stroke-width="12"
        />
      </div>
    </el-card>

    <div class="overview-grid">
      <el-card class="card">
        <template #header>
          <strong>📉 今日关注科目</strong>
        </template>

        <p v-if="weakSubjects.length === 0">
          今天没有明显未达标科目，整体覆盖情况较好。
        </p>

        <template v-else>
          <p>当前目标完成不足 50%：</p>

          <div class="tag-list">
            <el-tag
              v-for="subject in weakSubjects"
              :key="subject"
              type="warning"
              effect="light"
            >
              {{ subject }}
            </el-tag>
          </div>
        </template>
      </el-card>

      <el-card class="card">
        <template #header>
          <strong>🔥 学习坚持情况</strong>
        </template>

        <div class="summary-list">
          <div class="summary-item">
            <span>当前连续学习</span>
            <strong>
              {{ studyStore.streakDays }} 天
            </strong>
          </div>

          <div class="summary-item">
            <span>最长连续学习</span>
            <strong>
              {{ studyStore.longestStreak }} 天
            </strong>
          </div>

          <div class="summary-item">
            <span>本月学习天数</span>
            <strong>
              {{ studyStore.monthStudyDays }} 天
            </strong>
          </div>

          <div class="summary-item">
            <span>累计学习次数</span>
            <strong>
              {{ studyStore.totalRecords }} 次
            </strong>
          </div>
        </div>
      </el-card>
    </div>

    <el-card class="card ai-report-card">
      <template #header>
        <div class="ai-report-header">
          <div>
            <strong>🤖 AI 每日学习报告</strong>

            <p v-if="reportGeneratedAt">
              生成时间：
              {{ formatDateTime(reportGeneratedAt) }}
            </p>
          </div>

          <el-tag type="success" effect="light">
            DeepSeek
          </el-tag>
        </div>
      </template>

      <div
        v-if="generatingReport"
        class="report-loading"
      >
        <el-icon class="is-loading">
          <Loading />
        </el-icon>

        <strong>
          AI 正在分析今日学习数据……
        </strong>

        <span>
          正在结合学习记录、目标、复习任务和长期记忆生成报告。
        </span>
      </div>

      <el-alert
        v-else-if="reportError"
        :title="reportError"
        type="error"
        :closable="false"
        show-icon
      />

      <div
        v-else-if="aiReport"
        class="ai-report-content"
      >
        <el-alert
          v-if="reportOutdated"
          class="outdated-alert"
          title="报告生成后学习数据发生了变化，建议重新生成"
          type="warning"
          :closable="false"
          show-icon
        />

        <div class="report-text">
          {{ aiReport }}
        </div>
      </div>

      <el-empty
        v-else
        description="今天还没有生成 AI 学习报告"
      >
        <p class="empty-description">
          点击“生成 AI 今日报告”，DeepSeek 会分析今日表现并安排明日重点。
        </p>

        <el-button
          type="primary"
          :disabled="!authStore.user"
          @click="generateAiReport"
        >
          立即生成
        </el-button>
      </el-empty>
    </el-card>

    <el-card class="card">
      <template #header>
        <strong>📅 本地明日计划建议</strong>
      </template>

      <div
        v-for="plan in tomorrowPlan"
        :key="plan"
        class="plan-item"
      >
        {{ plan }}
      </div>
    </el-card>

    <el-card class="card">
      <template #header>
        <strong>💡 实时学习建议</strong>
      </template>

      <div
        v-for="tip in suggestions"
        :key="tip"
        class="suggestion-item"
      >
        {{ tip }}
      </div>
    </el-card>

    <el-card class="card encouragement-card">
      <template #header>
        <strong>💬 今日鼓励</strong>
      </template>

      <p>{{ encouragement }}</p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  onMounted,
  ref,
  watch
} from "vue"
import { Loading } from "@element-plus/icons-vue"
import { ElMessage } from "element-plus"

import { supabase } from "../../lib/supabase"
import { useAuthStore } from "../../stores/auth"
import { useStudyStore } from "../../stores/study"
import { useSettingsStore } from "../../stores/settings"
import { useReviewStore } from "../../stores/review"
import { useAiMemoryStore } from "../../stores/aimemory"

interface SubjectStat {
  subject: string
  targetHours: number
  duration: number
}

interface CoachFunctionResponse {
  answer?: string
  error?: string
}

interface CachedAiReport {
  date: string
  userId: string
  report: string
  generatedAt: string
  dataFingerprint: string
}

const REPORT_STORAGE_PREFIX =
  "med703-ai-daily-report"

const authStore = useAuthStore()
const studyStore = useStudyStore()
const settingsStore = useSettingsStore()
const reviewStore = useReviewStore()
const aiMemoryStore = useAiMemoryStore()

const aiReport = ref("")
const reportGeneratedAt = ref("")
const savedReportFingerprint = ref("")
const generatingReport = ref(false)
const reportError = ref("")

function getDateText(date: Date) {
  const year = date.getFullYear()
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0")
  const day = String(
    date.getDate()
  ).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function getToday() {
  return getDateText(new Date())
}

function formatTime(total: number) {
  const safeTotal = Math.max(
    0,
    Math.floor(total || 0)
  )

  const hours = Math.floor(
    safeTotal / 3600
  )

  const minutes = Math.floor(
    (safeTotal % 3600) / 60
  )

  return `${hours}小时 ${minutes}分`
}

function formatDateTime(value: string) {
  if (!value) {
    return ""
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString("zh-CN", {
    hour12: false
  })
}

const todayRecords = computed(() => {
  return studyStore.records.filter(record => {
    return record.date === getToday()
  })
})

const todayTotal = computed(() => {
  return todayRecords.value.reduce(
    (sum, record) => {
      return sum + (record.duration || 0)
    },
    0
  )
})

const todayTotalText = computed(() => {
  return formatTime(todayTotal.value)
})

const todaySubjectStats =
  computed<SubjectStat[]>(() => {
    return settingsStore.goals.map(goal => {
      const duration = todayRecords.value
        .filter(record => {
          return (
            record.subject ===
            goal.subject
          )
        })
        .reduce((sum, record) => {
          return (
            sum +
            (record.duration || 0)
          )
        }, 0)

      return {
        subject: goal.subject,
        targetHours: goal.targetHours,
        duration
      }
    })
  })

const totalTargetSeconds = computed(() => {
  return settingsStore.goals.reduce(
    (sum, goal) => {
      return (
        sum +
        goal.targetHours * 3600
      )
    },
    0
  )
})

const completionRate = computed(() => {
  if (totalTargetSeconds.value <= 0) {
    return 0
  }

  return Math.min(
    Math.floor(
      (
        todayTotal.value /
        totalTargetSeconds.value
      ) * 100
    ),
    100
  )
})

const weakSubjects = computed(() => {
  return todaySubjectStats.value
    .filter(item => {
      if (item.targetHours <= 0) {
        return false
      }

      const targetSeconds =
        item.targetHours * 3600

      return (
        item.duration <
        targetSeconds * 0.5
      )
    })
    .map(item => item.subject)
})

const todayPendingReviewCount =
  computed(() => {
    const today = getToday()

    return reviewStore.tasks.filter(
      task => {
        return (
          !task.done &&
          task.reviewDate <= today
        )
      }
    ).length
  })

const studiedSubjectCount =
  computed(() => {
    return todaySubjectStats.value.filter(
      item => {
        return item.duration > 0
      }
    ).length
  })

const studyScore = computed(() => {
  let score = completionRate.value

  if (todayRecords.value.length >= 3) {
    score += 5
  }

  if (studiedSubjectCount.value >= 3) {
    score += 5
  }

  if (
    weakSubjects.value.length === 0 &&
    todayTotal.value > 0
  ) {
    score += 5
  }

  if (
    todayPendingReviewCount.value === 0 &&
    todayTotal.value > 0
  ) {
    score += 5
  }

  return Math.min(score, 100)
})

const scoreComment = computed(() => {
  if (studyScore.value >= 90) {
    return "优秀！今天学习状态非常好。"
  }

  if (studyScore.value >= 75) {
    return "良好！今天完成度不错，继续保持。"
  }

  if (studyScore.value >= 50) {
    return "今天已经形成有效投入，还可以继续完成核心任务。"
  }

  return "今天学习量暂时偏少，可以先完成一个短时学习任务。"
})

const tomorrowPlan = computed(() => {
  const plans: string[] = []

  if (
    todayPendingReviewCount.value > 0
  ) {
    plans.push(
      `09:00 优先完成 ${Math.min(
        todayPendingReviewCount.value,
        5
      )} 项到期复习任务`
    )
  }

  if (weakSubjects.value.length > 0) {
    weakSubjects.value
      .slice(0, 3)
      .forEach((subject, index) => {
        const time =
          [
            "10:30",
            "14:00",
            "19:00"
          ][index] || "20:00"

        plans.push(
          `${time} 学习或复习 ${subject} 60分钟`
        )
      })
  }

  if (plans.length === 0) {
    plans.push(
      "09:00 703专业课复盘60分钟"
    )

    plans.push(
      "14:00 重点章节学习60分钟"
    )

    plans.push(
      "19:00 艾宾浩斯复习40分钟"
    )
  }

  return plans
})

const suggestions = computed(() => {
  const tips: string[] = []

  if (todayTotal.value === 0) {
    tips.push(
      "今天还没有学习记录，建议先完成一个25分钟番茄钟。"
    )

    tips.push(
      "可以优先从近期学习较少的703专业课开始。"
    )

    if (
      todayPendingReviewCount.value > 0
    ) {
      tips.push(
        `目前有 ${todayPendingReviewCount.value} 项到期复习任务，可以先完成其中1～2项。`
      )
    }

    return tips
  }

  tips.push(
    `今天已经学习 ${todayTotalText.value}，目标完成率为 ${completionRate.value}%。`
  )

  if (weakSubjects.value.length > 0) {
    tips.push(
      `当前需要优先关注：${weakSubjects.value.join(
        "、"
      )}。`
    )
  } else {
    tips.push(
      "今天各科目标覆盖较好，可以安排轻量复盘。"
    )
  }

  if (
    todayPendingReviewCount.value > 0
  ) {
    tips.push(
      `仍有 ${todayPendingReviewCount.value} 项到期复习任务，建议尽快完成。`
    )
  }

  if (completionRate.value >= 80) {
    tips.push(
      "整体完成度较高，晚上适合做简短复盘，避免过度疲劳。"
    )
  } else {
    tips.push(
      "建议优先完成核心科目，再安排补充学习。"
    )
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

  return "哪怕只学25分钟，也是在向目标靠近。先开始，就是胜利。"
})

const currentDataFingerprint =
  computed(() => {
    const recordText = todayRecords.value
      .map(record => {
        return [
          record.id,
          record.subject,
          record.chapter,
          record.content,
          record.duration,
          record.endTime
        ].join("|")
      })
      .sort()
      .join("||")

    const reviewText = reviewStore.tasks
      .filter(task => {
        return (
          !task.done &&
          task.reviewDate <= getToday()
        )
      })
      .map(task => {
        return [
          task.id,
          task.subject,
          task.chapter,
          task.reviewDate,
          task.round
        ].join("|")
      })
      .sort()
      .join("||")

    const goalText =
      settingsStore.goals
        .map(goal => {
          return (
            `${goal.subject}:` +
            `${goal.targetHours}`
          )
        })
        .sort()
        .join("|")

    return [
      getToday(),
      recordText,
      reviewText,
      goalText,
      aiMemoryStore.memorySummary
    ].join("###")
  })

const reportOutdated = computed(() => {
  if (
    !aiReport.value ||
    !savedReportFingerprint.value
  ) {
    return false
  }

  return (
    savedReportFingerprint.value !==
    currentDataFingerprint.value
  )
})

function getSubjectProgress(
  item: SubjectStat
) {
  if (item.targetHours <= 0) {
    return 0
  }

  const targetSeconds =
    item.targetHours * 3600

  return Math.min(
    Math.floor(
      (
        item.duration /
        targetSeconds
      ) * 100
    ),
    100
  )
}

function getStorageKey() {
  const userId =
    authStore.user?.id || "guest"

  return (
    `${REPORT_STORAGE_PREFIX}-` +
    `${userId}-${getToday()}`
  )
}

function loadCachedReport() {
  const saved = localStorage.getItem(
    getStorageKey()
  )

  if (!saved) {
    aiReport.value = ""
    reportGeneratedAt.value = ""
    savedReportFingerprint.value = ""
    return
  }

  try {
    const cached =
      JSON.parse(saved) as CachedAiReport

    if (
      cached.date !== getToday() ||
      cached.userId !==
        (authStore.user?.id || "guest")
    ) {
      localStorage.removeItem(
        getStorageKey()
      )

      return
    }

    aiReport.value =
      cached.report || ""

    reportGeneratedAt.value =
      cached.generatedAt || ""

    savedReportFingerprint.value =
      cached.dataFingerprint || ""
  } catch (error) {
    console.error(
      "读取 AI 每日报告缓存失败：",
      error
    )

    localStorage.removeItem(
      getStorageKey()
    )
  }
}

function saveCachedReport() {
  if (!aiReport.value) {
    return
  }

  const cached: CachedAiReport = {
    date: getToday(),
    userId:
      authStore.user?.id || "guest",
    report: aiReport.value,
    generatedAt:
      reportGeneratedAt.value,
    dataFingerprint:
      savedReportFingerprint.value
  }

  localStorage.setItem(
    getStorageKey(),
    JSON.stringify(cached)
  )
}

function buildRecentStudySummary() {
  const today = getToday()
  const startDate = new Date()

  startDate.setDate(
    startDate.getDate() - 6
  )

  const startDateText =
    getDateText(startDate)

  const recentRecords =
    studyStore.records.filter(record => {
      return (
        record.date >= startDateText &&
        record.date <= today
      )
    })

  const subjectMap =
    new Map<string, number>()

  for (const record of recentRecords) {
    subjectMap.set(
      record.subject,
      (
        subjectMap.get(
          record.subject
        ) ?? 0
      ) + (record.duration || 0)
    )
  }

  const recentTotal =
    recentRecords.reduce(
      (sum, record) => {
        return (
          sum +
          (record.duration || 0)
        )
      },
      0
    )

  const subjectLines =
    Array.from(subjectMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([subject, duration]) => {
        return (
          `- ${subject}：` +
          `${formatTime(duration)}`
        )
      })

  const todayLines =
    todaySubjectStats.value.map(item => {
      return (
        `- ${item.subject}：` +
        `${formatTime(item.duration)}，` +
        `每日目标${item.targetHours}小时，` +
        `完成${getSubjectProgress(item)}%`
      )
    })

  const pendingReviews =
    reviewStore.tasks
      .filter(task => {
        return (
          !task.done &&
          task.reviewDate <= today
        )
      })
      .slice(0, 12)

  const reviewLines =
    pendingReviews.map(task => {
      return (
        `- ${task.subject}｜` +
        `${task.chapter || "未填写章节"}｜` +
        `第${task.round}轮｜` +
        `应复习日期${task.reviewDate}`
      )
    })

  return [
    `今天日期：${today}`,
    `本地今日学习评分：${studyScore.value}分`,
    `今日学习总时长：${todayTotalText.value}`,
    `今日学习次数：${todayRecords.value.length}次`,
    `今日目标完成率：${completionRate.value}%`,
    `到期未完成复习任务：${todayPendingReviewCount.value}项`,
    `当前连续学习：${studyStore.streakDays}天`,
    `最长连续学习：${studyStore.longestStreak}天`,
    `本月学习天数：${studyStore.monthStudyDays}天`,
    "",
    "今日各科情况：",
    todayLines.length > 0
      ? todayLines.join("\n")
      : "- 暂无目标数据",
    "",
    "最近7天学习总时长：",
    formatTime(recentTotal),
    "",
    "最近7天各科累计：",
    subjectLines.length > 0
      ? subjectLines.join("\n")
      : "- 暂无学习记录",
    "",
    "到期复习任务：",
    reviewLines.length > 0
      ? reviewLines.join("\n")
      : "- 暂无到期任务"
  ].join("\n")
}

async function generateAiReport() {
  if (!authStore.user) {
    ElMessage.warning(
      "请先登录账号"
    )
    return
  }

  if (generatingReport.value) {
    return
  }

  generatingReport.value = true
  reportError.value = ""

  try {
    if (
      !aiMemoryStore.initialized
    ) {
      await aiMemoryStore.loadMemories()
    }

    const message = `
请根据以下真实学习数据，为用户生成今天的学习日报。

必须包含以下六个部分：

一、今日表现总结
二、学习得分解读
三、需要关注的问题
四、今晚剩余时间建议
五、明日学习计划
六、一句鼓励

要求：
1. 使用简洁、自然的中文。
2. 必须依据真实数据，不能虚构。
3. 明日计划要具体到科目、顺序和建议时长。
4. 优先考虑到期复习任务和长期薄弱科目。
5. 若今天学习较少，不要过度批评，要给出可执行的小目标。
6. 不要使用JSON。
7. 不要输出代码块。
8. 总长度控制在600到1000字之间。
`.trim()

    const { data, error } =
      await supabase.functions.invoke<
        CoachFunctionResponse
      >(
        "deepseek-coach",
        {
          body: {
            mode: "analysis",
            message,
            studySummary:
              buildRecentStudySummary(),
            preferences:
              "这是每日学习报告，请重点给出今天的总结和明日可执行计划。",
            memorySummary:
              aiMemoryStore.memorySummary,
            history: [],
            extractMemories: false
          }
        }
      )

    if (error) {
      console.error(
        "生成 AI 每日报告失败：",
        error
      )

      reportError.value =
        "AI 报告生成失败，请检查网络、Edge Function 状态和 DeepSeek 余额。"

      ElMessage.error(
        reportError.value
      )

      return
    }

    if (data?.error) {
      reportError.value =
        data.error

      ElMessage.error(
        data.error
      )

      return
    }

    const answer =
      data?.answer?.trim()

    if (!answer) {
      reportError.value =
        "AI 没有返回有效的学习报告"

      ElMessage.error(
        reportError.value
      )

      return
    }

    aiReport.value = answer
    reportGeneratedAt.value =
      new Date().toISOString()

    savedReportFingerprint.value =
      currentDataFingerprint.value

    saveCachedReport()

    ElMessage.success(
      "AI 今日学习报告已生成"
    )
  } catch (error) {
    console.error(
      "生成 AI 每日报告发生异常：",
      error
    )

    reportError.value =
      error instanceof Error
        ? error.message
        : "生成 AI 报告时发生未知错误"

    ElMessage.error(
      reportError.value
    )
  } finally {
    generatingReport.value = false
  }
}

onMounted(async () => {
  if (!authStore.user) {
    await authStore.initializeAuth()
  }

  if (
    authStore.user &&
    !aiMemoryStore.initialized
  ) {
    await aiMemoryStore.loadMemories()
  }

  loadCachedReport()
})

watch(
  () => authStore.user?.id,
  () => {
    loadCachedReport()
  }
)
</script>

<style scoped>
.overview {
  display: grid;
  gap: 20px;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.report-header h3 {
  margin: 0;
}

.report-header p {
  margin: 8px 0 0;
  color: #777;
  line-height: 1.7;
}

.report-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  flex: none;
  gap: 10px;
}

.overview-grid {
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.card {
  border: 1px solid #e2eee6;
}

.score-card {
  background: linear-gradient(
    135deg,
    #f5fff8 0%,
    #ffffff 100%
  );
}

.score-content {
  text-align: center;
}

.score {
  margin: 4px 0 10px;
  color: #2e8b57;
  font-size: 54px;
}

.summary-list {
  display: grid;
  gap: 12px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.summary-item:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.subject-row {
  padding: 14px 0;
  border-bottom: 1px solid #eee;
}

.subject-row:last-child {
  border-bottom: none;
}

.subject-info {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 10px;
}

.subject-info span {
  color: #666;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ai-report-card {
  border: 1px solid #bfe2cc;
  background: linear-gradient(
    145deg,
    #f7fcf9 0%,
    #ffffff 55%
  );
}

.ai-report-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.ai-report-header p {
  margin: 6px 0 0;
  color: #999;
  font-size: 13px;
}

.report-loading {
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  min-height: 260px;
  color: #666;
  text-align: center;
}

.report-loading .el-icon {
  color: #2e8b57;
  font-size: 34px;
}

.report-loading span {
  color: #999;
  font-size: 13px;
}

.outdated-alert {
  margin-bottom: 18px;
}

.report-text {
  padding: 20px;
  border-radius: 12px;
  background: #fff;
  color: #333;
  font-size: 15px;
  line-height: 1.9;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  box-shadow:
    0 2px 10px rgba(46, 139, 87, 0.07);
}

.empty-description {
  color: #999;
}

.plan-item,
.suggestion-item {
  padding: 11px 0;
  border-bottom: 1px solid #eee;
  line-height: 1.7;
}

.plan-item:last-child,
.suggestion-item:last-child {
  border-bottom: none;
}

.plan-item::before {
  margin-right: 8px;
  content: "▸";
  color: #2e8b57;
}

.suggestion-item::before {
  margin-right: 8px;
  content: "•";
  color: #2e8b57;
}

.encouragement-card {
  background: #f6fbf8;
}

.encouragement-card p {
  margin: 0;
  color: #2e8b57;
  font-size: 18px;
  font-weight: bold;
  line-height: 1.8;
  text-align: center;
}

.empty-text {
  padding: 30px 0;
  color: #999;
  text-align: center;
}

@media (max-width: 700px) {
  .report-header {
    flex-direction: column;
  }

  .report-actions {
    width: 100%;
  }

  .report-actions .el-button {
    width: 100%;
  }

  .overview-grid {
    grid-template-columns: 1fr;
  }

  .subject-info {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }

  .summary-item {
    align-items: flex-start;
  }

  .summary-item strong {
    text-align: right;
  }

  .score {
    font-size: 44px;
  }

  .ai-report-header {
    flex-direction: column;
  }

  .report-text {
    padding: 15px;
    font-size: 14px;
  }
}
</style>