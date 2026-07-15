<template>
  <div class="coach-page">
    <h2>🤖 AI 学习教练</h2>

    <el-card class="card ai-card">
      <template #header>
        <div class="card-header">
          <strong>🧠 DeepSeek 智能教练</strong>

          <el-tag type="success">
            DeepSeek
          </el-tag>
        </div>
      </template>

      <div v-if="!authStore.user" class="login-tip">
        <el-alert
          title="请先登录账号，再使用 AI 学习教练"
          type="warning"
          :closable="false"
          show-icon
        />
      </div>

      <template v-else>
        <div class="mode-group">
          <el-radio-group v-model="aiMode">
            <el-radio-button value="plan">
              📅 制定计划
            </el-radio-button>

            <el-radio-button value="analysis">
              📊 学习分析
            </el-radio-button>

            <el-radio-button value="question">
              💬 知识问答
            </el-radio-button>
          </el-radio-group>
        </div>

        <div class="input-section">
          <label>你的想法或要求</label>

          <el-input
            v-model="userMessage"
            type="textarea"
            :rows="4"
            :placeholder="messagePlaceholder"
            maxlength="1000"
            show-word-limit
          />
        </div>

        <div
          v-if="aiMode === 'plan'"
          class="input-section"
        >
          <label>学习偏好（可选）</label>

          <el-input
            v-model="preferences"
            type="textarea"
            :rows="3"
            placeholder="例如：今天只有2小时；重点学生理；不安排生化；晚上状态较好；一天最多安排3门科目。"
            maxlength="600"
            show-word-limit
          />
        </div>

        <div class="quick-actions">
          <el-button
            size="small"
            @click="setQuickMessage('我今天只有2小时，请重新安排计划。')"
          >
            今天只有2小时
          </el-button>

          <el-button
            size="small"
            @click="setQuickMessage('请优先安排我最近学习较少的科目。')"
          >
            优先薄弱科目
          </el-button>

          <el-button
            size="small"
            @click="setQuickMessage('今天状态一般，请安排轻松一点的计划。')"
          >
            今天轻松一点
          </el-button>

          <el-button
            size="small"
            @click="setQuickMessage('请优先完成今天到期的复习任务。')"
          >
            优先复习任务
          </el-button>
        </div>

        <div class="button-row">
          <el-button
            type="primary"
            :loading="aiLoading"
            :disabled="aiLoading"
            @click="askCoach"
          >
            {{ aiLoading ? "AI 正在思考……" : actionButtonText }}
          </el-button>

          <el-button
            :disabled="aiLoading"
            @click="clearAiResult"
          >
            清空
          </el-button>
        </div>

        <el-alert
          v-if="aiError"
          class="result-alert"
          :title="aiError"
          type="error"
          :closable="false"
          show-icon
        />

        <div
          v-if="aiAnswer"
          class="ai-result"
        >
          <div class="result-title">
            <strong>🤖 AI 教练回复</strong>

            <div class="result-actions">
              <el-button
                v-if="aiMode === 'plan'"
                type="success"
                plain
                size="small"
                :loading="savingPlan"
                :disabled="savingPlan"
                @click="saveCurrentPlan"
              >
                保存这份计划
              </el-button>

              <el-button
                text
                type="primary"
                @click="copyAnswer"
              >
                复制内容
              </el-button>
            </div>
          </div>

          <div class="answer-content">
            {{ aiAnswer }}
          </div>
        </div>

        <p class="notice">
          AI 建议仅用于学习规划和知识辅助，你可以随时要求它重新调整。
        </p>
      </template>
    </el-card>

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
      <p>今日待复习任务：{{ todayPendingReviewCount }} 项</p>
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
        <strong>📅 本地明日计划建议</strong>
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
        <strong>💡 本地学习建议</strong>
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
import { computed, ref } from "vue"
import { ElMessage } from "element-plus"
import { useStudyStore } from "../stores/study"
import { useSettingsStore } from "../stores/settings"
import { useReviewStore } from "../stores/review"
import { useAuthStore } from "../stores/auth"
import { useAiPlanStore } from "../stores/aiPlan"
import { supabase } from "../lib/supabase"

type AiMode = "plan" | "analysis" | "question"

interface CoachFunctionResponse {
  answer?: string
  error?: string
  model?: string
  usage?: unknown
}

const studyStore = useStudyStore()
const settingsStore = useSettingsStore()
const reviewStore = useReviewStore()
const authStore = useAuthStore()
const aiPlanStore = useAiPlanStore()

const aiMode = ref<AiMode>("plan")
const userMessage = ref("")
const preferences = ref("")
const aiAnswer = ref("")
const aiError = ref("")
const aiLoading = ref(false)
const savingPlan = ref(false)

function getDateText(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function getToday() {
  return getDateText(new Date())
}

function formatTime(total: number) {
  const safeTotal = Math.max(0, Math.floor(total || 0))
  const h = Math.floor(safeTotal / 3600)
  const m = Math.floor((safeTotal % 3600) / 60)

  return `${h}小时 ${m}分`
}

const todayRecords = computed(() => {
  return studyStore.records.filter(
    item => item.date === getToday()
  )
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
      .reduce(
        (sum, item) => sum + (item.duration || 0),
        0
      )

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
    Math.floor(
      (todayTotal.value / totalTargetSeconds.value) * 100
    ),
    100
  )
})

const weakSubjects = computed(() => {
  return todaySubjectStats.value
    .filter(item => {
      return (
        item.targetHours > 0 &&
        item.duration < item.targetHours * 3600 * 0.5
      )
    })
    .map(item => item.subject)
})

const todayPendingReviewCount = computed(() => {
  const today = getToday()

  return reviewStore.tasks.filter(task => {
    return task.reviewDate <= today && !task.done
  }).length
})

const studyScore = computed(() => {
  let score = completionRate.value

  if (todayRecords.value.length >= 3) {
    score += 5
  }

  const studiedSubjects = todaySubjectStats.value.filter(
    item => item.duration > 0
  ).length

  if (studiedSubjects >= 3) {
    score += 5
  }

  if (
    weakSubjects.value.length === 0 &&
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
    return "一般，还可以继续补充一些学习时间。"
  }

  return "今天学习量偏少，建议先完成一个番茄钟。"
})

const tomorrowPlan = computed(() => {
  const plans: string[] = []

  if (weakSubjects.value.length > 0) {
    weakSubjects.value
      .slice(0, 3)
      .forEach((subject, index) => {
        const time =
          ["09:00", "14:00", "19:00"][index] || "20:00"

        plans.push(
          `${time} 复习/学习 ${subject} 60 分钟`
        )
      })
  } else {
    plans.push("09:00 703 专业课复盘 60 分钟")
    plans.push("14:00 重点章节学习 60 分钟")
    plans.push("19:00 艾宾浩斯复习 40 分钟")
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
      "可以优先从703专业课中近期学习较少的一门开始。"
    )

    return tips
  }

  tips.push(
    `今天已经学习 ${todayTotalText.value}，完成率 ${completionRate.value}%。`
  )

  if (weakSubjects.value.length > 0) {
    tips.push(
      `今天较薄弱的科目是：${weakSubjects.value.join(
        "、"
      )}。建议优先补齐其中1～2门。`
    )
  } else {
    tips.push(
      "今天各科覆盖较好，可以安排轻量复习巩固。"
    )
  }

  if (todayPendingReviewCount.value > 0) {
    tips.push(
      `今天还有 ${todayPendingReviewCount.value} 项到期复习任务，建议优先完成。`
    )
  }

  if (completionRate.value >= 80) {
    tips.push(
      "今天整体学习完成度较高，建议晚上做复盘，避免过度疲劳。"
    )
  } else {
    tips.push(
      "今天目标完成率还不高，建议先完成核心科目，再安排补充学习。"
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

const messagePlaceholder = computed(() => {
  if (aiMode.value === "analysis") {
    return "例如：请分析我最近30天的学习情况，指出薄弱科目和改进方向。"
  }

  if (aiMode.value === "question") {
    return "例如：请解释动作电位的形成过程，并给我一个方便记忆的方法。"
  }

  return "例如：我今天只有3小时，想重点学生理和病理，请结合我的学习数据制定计划。"
})

const actionButtonText = computed(() => {
  if (aiMode.value === "analysis") {
    return "生成学习分析"
  }

  if (aiMode.value === "question") {
    return "向 AI 提问"
  }

  return "生成学习计划"
})

const recent30DayRecords = computed(() => {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 29)

  const startDateText = getDateText(startDate)

  return studyStore.records.filter(record => {
    return record.date >= startDateText
  })
})

function buildStudySummary() {
  const subjectMap = new Map<string, number>()

  for (const record of recent30DayRecords.value) {
    const current = subjectMap.get(record.subject) ?? 0

    subjectMap.set(
      record.subject,
      current + (record.duration || 0)
    )
  }

  const subjectLines = Array.from(subjectMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([subject, duration]) => {
      return `- ${subject}：${formatTime(duration)}`
    })

  const goalLines = settingsStore.goals.map(goal => {
    return `- ${goal.subject}：每日目标 ${goal.targetHours} 小时`
  })

  const pendingTasks = reviewStore.tasks
    .filter(task => {
      return !task.done && task.reviewDate <= getToday()
    })
    .slice(0, 20)

  const reviewLines = pendingTasks.map(task => {
    return (
      `- ${task.subject}｜${task.chapter || "未填写章节"}` +
      `｜第${task.round}轮｜复习日期 ${task.reviewDate}`
    )
  })

  const total30Days = recent30DayRecords.value.reduce(
    (sum, record) => {
      return sum + (record.duration || 0)
    },
    0
  )

  return [
    `今天日期：${getToday()}`,
    `最近30天学习总时长：${formatTime(total30Days)}`,
    `最近30天学习次数：${recent30DayRecords.value.length}次`,
    `今日学习时长：${todayTotalText.value}`,
    `今日目标完成率：${completionRate.value}%`,
    `连续学习天数：${studyStore.streakDays}天`,
    `最长连续学习：${studyStore.longestStreak}天`,
    `当前到期未完成复习任务：${todayPendingReviewCount.value}项`,
    "",
    "最近30天各科目学习时长：",
    subjectLines.length > 0
      ? subjectLines.join("\n")
      : "- 暂无学习记录",
    "",
    "用户设置的每日学习目标：",
    goalLines.length > 0
      ? goalLines.join("\n")
      : "- 暂未设置",
    "",
    "部分到期复习任务：",
    reviewLines.length > 0
      ? reviewLines.join("\n")
      : "- 暂无到期任务"
  ].join("\n")
}

function setQuickMessage(message: string) {
  userMessage.value = message
}

async function askCoach() {
  if (!authStore.user) {
    ElMessage.warning("请先登录账号")
    return
  }

  if (
    aiMode.value === "question" &&
    !userMessage.value.trim()
  ) {
    ElMessage.warning("请输入想咨询的问题")
    return
  }

  aiLoading.value = true
  aiError.value = ""
  aiAnswer.value = ""

  try {
    const defaultMessage =
      aiMode.value === "plan"
        ? "请根据我的学习数据制定今天或明天的学习计划。"
        : "请分析我的近期学习情况并给出具体建议。"

    const { data, error } =
      await supabase.functions.invoke<CoachFunctionResponse>(
        "deepseek-coach",
        {
          body: {
            mode: aiMode.value,
            message:
              userMessage.value.trim() || defaultMessage,
            preferences: preferences.value.trim(),
            studySummary: buildStudySummary()
          }
        }
      )

    if (error) {
      console.error("AI Edge Function 调用失败：", error)
      aiError.value =
        "AI 服务调用失败，请检查登录状态、函数部署和账户余额。"
      return
    }

    if (data?.error) {
      aiError.value = data.error
      return
    }

    if (!data?.answer) {
      aiError.value = "AI 没有返回有效内容，请重新尝试。"
      return
    }

    aiAnswer.value = data.answer
  } catch (error) {
    console.error("AI 教练执行失败：", error)

    aiError.value =
      error instanceof Error
        ? error.message
        : "AI 服务发生未知错误"
  } finally {
    aiLoading.value = false
  }
}

async function saveCurrentPlan() {
  if (!authStore.user) {
    ElMessage.warning("请先登录账号")
    return
  }

  if (!aiAnswer.value.trim()) {
    ElMessage.warning("当前没有可保存的 AI 计划")
    return
  }

  if (aiMode.value !== "plan") {
    ElMessage.warning("只有学习计划可以保存")
    return
  }

  savingPlan.value = true

  try {
    const result = await aiPlanStore.savePlan({
      planDate: getToday(),
      title: "AI 每日学习计划",
      userRequest: [
        userMessage.value.trim(),
        preferences.value.trim()
      ]
        .filter(Boolean)
        .join("\n"),
      aiContent: aiAnswer.value.trim()
    })

    if (!result.success) {
      ElMessage.error(
        result.message || "保存 AI 学习计划失败"
      )
      return
    }

    ElMessage.success("AI 学习计划已保存")
  } catch (error) {
    console.error("保存 AI 学习计划失败：", error)

    ElMessage.error(
      error instanceof Error
        ? error.message
        : "保存 AI 学习计划失败"
    )
  } finally {
    savingPlan.value = false
  }
}

function clearAiResult() {
  userMessage.value = ""
  preferences.value = ""
  aiAnswer.value = ""
  aiError.value = ""
}

async function copyAnswer() {
  if (!aiAnswer.value) return

  try {
    await navigator.clipboard.writeText(aiAnswer.value)
    ElMessage.success("AI 回复已复制")
  } catch {
    ElMessage.error("复制失败，请手动选择文字复制")
  }
}
</script>

<style scoped>
.coach-page {
  margin-top: 20px;
}

.card {
  margin-top: 20px;
}

.ai-card {
  border: 1px solid #d8efe1;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.login-tip {
  margin-bottom: 10px;
}

.mode-group {
  margin-bottom: 20px;
}

.input-section {
  margin-top: 18px;
}

.input-section label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: bold;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.button-row {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.result-alert {
  margin-top: 20px;
}

.ai-result {
  margin-top: 20px;
  padding: 18px;
  border: 1px solid #d8efe1;
  border-radius: 12px;
  background: #f6fbf8;
}

.result-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.result-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.answer-content {
  color: #333;
  line-height: 1.8;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.notice {
  margin: 16px 0 0;
  color: #888;
  font-size: 13px;
}

.score {
  margin: 10px 0;
  color: #2e8b57;
  font-size: 52px;
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

@media (max-width: 600px) {
  .mode-group {
    overflow-x: auto;
  }

  .button-row {
    flex-direction: column;
  }

  .button-row .el-button {
    width: 100%;
    margin-left: 0;
  }

  .result-title {
    align-items: flex-start;
    flex-direction: column;
  }

  .result-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .row {
    align-items: flex-start;
  }

  .row strong {
    text-align: right;
  }

  .score {
    font-size: 42px;
  }
}
</style>