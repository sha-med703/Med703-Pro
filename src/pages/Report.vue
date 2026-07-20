<template>
  <div class="report-page">
    <div class="page-header">
      <div>
        <h2>📈 学习报告</h2>
        <p class="page-subtitle">
          汇总学习时长、趋势、科目分布和阶段表现
        </p>
      </div>

      <el-tag
        v-if="studyStore.loading"
        type="info"
        effect="plain"
      >
        正在同步数据
      </el-tag>

      <el-tag
        v-else-if="studyStore.initialized"
        type="success"
        effect="plain"
      >
        数据已更新
      </el-tag>
    </div>

    <el-alert
      v-if="studyStore.errorMessage"
      class="error-alert"
      :title="studyStore.errorMessage"
      type="warning"
      show-icon
      closable
      @close="studyStore.clearError"
    />

    <section class="overview-grid">
      <el-card
        v-for="item in overviewCards"
        :key="item.key"
        class="overview-card"
        shadow="hover"
      >
        <div class="overview-card-content">
          <div
            class="overview-icon"
            :class="`overview-icon-${item.key}`"
          >
            {{ item.icon }}
          </div>

          <div class="overview-info">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
            <small>{{ item.description }}</small>
          </div>
        </div>
      </el-card>
    </section>

    <section class="analysis-grid">
      <el-card class="card comparison-card">
        <template #header>
          <div class="card-header">
            <strong>📊 周期表现</strong>

            <el-segmented
              v-model="comparisonPeriod"
              :options="comparisonOptions"
              size="small"
            />
          </div>
        </template>

        <div class="comparison-content">
          <div
            class="comparison-trend"
            :class="comparisonTrendClass"
          >
            <span class="comparison-arrow">
              {{ comparisonArrow }}
            </span>

            <strong>
              {{ comparisonPercentageText }}
            </strong>
          </div>

          <p class="comparison-description">
            {{ comparisonDescription }}
          </p>

          <div class="comparison-values">
            <div>
              <span>本周期</span>
              <strong>
                {{
                  studyStore.formatDuration(
                    currentComparison.currentDuration,
                    false
                  )
                }}
              </strong>
            </div>

            <div>
              <span>上一周期</span>
              <strong>
                {{
                  studyStore.formatDuration(
                    currentComparison.previousDuration,
                    false
                  )
                }}
              </strong>
            </div>
          </div>
        </div>
      </el-card>

      <el-card class="card record-card">
        <template #header>
          <strong>🏆 学习纪录</strong>
        </template>

        <div class="record-list">
          <div class="record-item">
            <div>
              <span>最佳学习日</span>
              <small>
                {{
                  studyStore.bestStudyDay
                    ? formatDisplayDate(
                        studyStore.bestStudyDay.date
                      )
                    : "暂无记录"
                }}
              </small>
            </div>

            <strong>
              {{
                studyStore.bestStudyDay
                  ? studyStore.formatDuration(
                      studyStore.bestStudyDay.duration,
                      false
                    )
                  : "0小时 0分"
              }}
            </strong>
          </div>

          <div class="record-item">
            <div>
              <span>最活跃科目</span>
              <small>
                {{
                  studyStore.mostActiveSubject
                    ? `${studyStore.mostActiveSubject.recordCount} 次学习`
                    : "暂无记录"
                }}
              </small>
            </div>

            <strong>
              {{
                studyStore.mostActiveSubject
                  ? studyStore.mostActiveSubject.subject
                  : "暂无"
              }}
            </strong>
          </div>

          <div class="record-item">
            <div>
              <span>当前连续学习</span>
              <small>保持稳定节奏</small>
            </div>

            <strong>
              {{ studyStore.streakDays }} 天
            </strong>
          </div>

          <div class="record-item">
            <div>
              <span>最长连续学习</span>
              <small>历史最佳纪录</small>
            </div>

            <strong>
              {{ studyStore.longestStreak }} 天
            </strong>
          </div>
        </div>
      </el-card>
    </section>

    <MonthlyStudyCalendar
      :records="studyStore.records"
    />

    <el-card class="card">
      <template #header>
        <div class="card-header">
          <div>
            <strong>📈 学习趋势</strong>
            <p class="header-description">
              查看近期每日学习时长变化
            </p>
          </div>

          <el-segmented
            v-model="trendPeriod"
            :options="trendOptions"
            size="small"
          />
        </div>
      </template>

      <div class="trend-summary">
        <div class="trend-stat">
          <span>周期总时长</span>
          <strong>
            {{
              studyStore.formatDuration(
                trendTotalSeconds,
                false
              )
            }}
          </strong>
        </div>

        <div class="trend-stat">
          <span>日均学习</span>
          <strong>
            {{
              studyStore.formatDuration(
                trendAverageSeconds,
                false
              )
            }}
          </strong>
        </div>

        <div class="trend-stat">
          <span>有效学习天数</span>
          <strong>
            {{ trendStudyDays }} 天
          </strong>
        </div>

        <div class="trend-stat">
          <span>最高单日</span>
          <strong>
            {{
              studyStore.formatDuration(
                trendBestDayDuration,
                false
              )
            }}
          </strong>
        </div>
      </div>

      <div
        v-if="hasTrendData"
        class="chart-wrapper"
      >
        <StudyTrendChart
          :dates="trendDates"
          :durations="trendDurations"
        />
      </div>

      <el-empty
        v-else
        description="当前周期还没有学习数据"
      />
    </el-card>

    <el-card class="card">
      <template #header>
        <div class="card-header">
          <div>
            <strong>🔥 最近一年学习热力图</strong>
            <p class="header-description">
              颜色越深，代表当天学习时间越长
            </p>
          </div>

          <el-tag
            type="success"
            effect="plain"
          >
            {{ studyStore.totalStudyDays }} 个学习日
          </el-tag>
        </div>
      </template>

      <div class="heatmap-scroll">
        <StudyHeatmap
          :days="studyStore.last365Days"
        />
      </div>

      <div class="heatmap-legend">
        <span>少</span>
        <i class="legend-cell level-0"></i>
        <i class="legend-cell level-1"></i>
        <i class="legend-cell level-2"></i>
        <i class="legend-cell level-3"></i>
        <i class="legend-cell level-4"></i>
        <span>多</span>
      </div>
    </el-card>

    <section class="subject-grid">
      <el-card class="card subject-chart-card">
        <template #header>
          <div class="card-header">
            <div>
              <strong>🥧 科目学习占比</strong>
              <p class="header-description">
                分析各科目学习投入情况
              </p>
            </div>
          </div>
        </template>

        <div
          v-if="studyStore.activeSubjectStats.length > 0"
          class="chart-wrapper"
        >
          <SubjectPieChart
            :subjects="
              studyStore.activeSubjectStats.map(
                item => item.subject
              )
            "
            :durations="
              studyStore.activeSubjectStats.map(
                item => item.duration
              )
            "
          />
        </div>

        <el-empty
          v-else
          description="还没有科目学习数据"
        />
      </el-card>

      <el-card class="card subject-list-card">
        <template #header>
          <strong>📚 各科目学习情况</strong>
        </template>

        <div class="subject-list">
          <div
            v-for="item in studyStore.subjectStats"
            :key="item.subject"
            class="subject-item"
          >
            <div class="subject-main">
              <div class="subject-title-row">
                <span>{{ item.subject }}</span>

                <strong>
                  {{
                    studyStore.formatDuration(
                      item.duration,
                      false
                    )
                  }}
                </strong>
              </div>

              <el-progress
                :percentage="item.percentage"
                :stroke-width="10"
                :show-text="false"
              />

              <div class="subject-meta">
                <span>
                  {{ item.recordCount }} 次学习
                </span>

                <span>
                  {{ item.percentage }}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </section>

    <el-card class="card insight-card">
      <template #header>
        <div class="card-header">
          <div>
            <strong>🤖 智能学习分析</strong>
            <p class="header-description">
              根据当前学习记录自动生成阶段总结
            </p>
          </div>
        </div>
      </template>

      <div
        v-if="studyStore.totalRecords > 0"
        class="insight-list"
      >
        <div
          v-for="(insight, index) in learningInsights"
          :key="`${index}-${insight}`"
          class="insight-item"
        >
          <span class="insight-index">
            {{ index + 1 }}
          </span>

          <p>{{ insight }}</p>
        </div>
      </div>

      <el-empty
        v-else
        description="完成学习记录后，将自动生成分析建议"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  onMounted,
  ref
} from "vue"

import { useStudyStore } from "../stores/study"

import MonthlyStudyCalendar from "../components/report/MonthlyStudyCalendar.vue"
import StudyTrendChart from "../components/report/StudyTrendChart.vue"
import StudyHeatmap from "../components/report/StudyHeatmap.vue"
import SubjectPieChart from "../components/report/SubjectPieChart.vue"

type TrendPeriod = "7天" | "30天"
type ComparisonPeriod = "最近7天" | "最近30天"

const studyStore = useStudyStore()

const trendPeriod = ref<TrendPeriod>("7天")
const comparisonPeriod =
  ref<ComparisonPeriod>("最近7天")

const trendOptions: TrendPeriod[] = [
  "7天",
  "30天"
]

const comparisonOptions: ComparisonPeriod[] = [
  "最近7天",
  "最近30天"
]

onMounted(() => {
  if (!studyStore.initialized) {
    studyStore.loadCloudRecords()
  }
})

const overviewCards = computed(() => {
  return [
    {
      key: "total",
      icon: "📚",
      label: "累计学习",
      value: studyStore.totalTimeText,
      description:
        `${studyStore.totalRecords} 次学习记录`
    },
    {
      key: "today",
      icon: "☀️",
      label: "今日学习",
      value: studyStore.todayTimeText,
      description:
        `${studyStore.todayRecords.length} 次学习`
    },
    {
      key: "week",
      icon: "📅",
      label: "最近 7 天",
      value: studyStore.weekTimeText,
      description:
        `日均 ${studyStore.average7DayTimeText}`
    },
    {
      key: "month",
      icon: "🗓️",
      label: "本月学习",
      value: studyStore.monthTimeText,
      description:
        `${studyStore.monthStudyDays} 个学习日`
    }
  ]
})

const currentComparison = computed(() => {
  if (
    comparisonPeriod.value === "最近30天"
  ) {
    return studyStore.thirtyDayComparison
  }

  return studyStore.sevenDayComparison
})

const comparisonArrow = computed(() => {
  if (
    currentComparison.value.trend === "up"
  ) {
    return "↑"
  }

  if (
    currentComparison.value.trend === "down"
  ) {
    return "↓"
  }

  return "→"
})

const comparisonTrendClass = computed(() => {
  return `trend-${currentComparison.value.trend}`
})

const comparisonPercentageText =
  computed(() => {
    const percentage = Math.abs(
      currentComparison.value.percentage
    )

    if (
      currentComparison.value.trend === "same"
    ) {
      return "持平"
    }

    return `${percentage}%`
  })

const comparisonDescription =
  computed(() => {
    const periodText =
      comparisonPeriod.value === "最近30天"
        ? "最近 30 天"
        : "最近 7 天"

    if (
      currentComparison.value.currentDuration ===
        0 &&
      currentComparison.value.previousDuration ===
        0
    ) {
      return `${periodText}和上一周期都还没有学习记录。`
    }

    if (
      currentComparison.value.trend === "up"
    ) {
      return `${periodText}学习时长较上一周期有所增长，学习投入正在提升。`
    }

    if (
      currentComparison.value.trend === "down"
    ) {
      return `${periodText}学习时长较上一周期有所下降，需要关注近期节奏。`
    }

    return `${periodText}学习时长与上一周期基本持平，整体节奏较稳定。`
  })

const trendData = computed(() => {
  if (trendPeriod.value === "30天") {
    return studyStore.last30Days
  }

  return studyStore.last7Days
})

const trendDates = computed(() => {
  return trendData.value.map(item => {
    return formatChartDate(item.date)
  })
})

const trendDurations = computed(() => {
  return trendData.value.map(item => {
    return item.duration
  })
})

const trendTotalSeconds = computed(() => {
  return trendData.value.reduce(
    (sum, item) => {
      return sum + item.duration
    },
    0
  )
})

const trendAverageSeconds = computed(() => {
  if (trendData.value.length === 0) {
    return 0
  }

  return Math.round(
    trendTotalSeconds.value /
      trendData.value.length
  )
})

const trendStudyDays = computed(() => {
  return trendData.value.filter(item => {
    return item.duration > 0
  }).length
})

const trendBestDayDuration = computed(() => {
  if (trendData.value.length === 0) {
    return 0
  }

  return Math.max(
    ...trendData.value.map(item => {
      return item.duration
    })
  )
})

const hasTrendData = computed(() => {
  return trendTotalSeconds.value > 0
})

const learningInsights = computed(() => {
  const insights: string[] = []

  const comparison =
    studyStore.thirtyDayComparison

  if (
    comparison.currentDuration === 0
  ) {
    insights.push(
      "最近 30 天还没有形成稳定学习数据，建议先从每天完成一次有效学习记录开始。"
    )
  } else if (
    comparison.trend === "up"
  ) {
    insights.push(
      `最近 30 天学习时长较上一周期增长 ${Math.abs(
        comparison.percentage
      )}%，当前学习投入呈上升趋势。`
    )
  } else if (
    comparison.trend === "down"
  ) {
    insights.push(
      `最近 30 天学习时长较上一周期下降 ${Math.abs(
        comparison.percentage
      )}%，建议检查计划是否过重或学习节奏是否受到干扰。`
    )
  } else {
    insights.push(
      "最近 30 天学习投入与上一周期基本持平，整体节奏相对稳定。"
    )
  }

  if (studyStore.mostActiveSubject) {
    insights.push(
      `${studyStore.mostActiveSubject.subject}是目前投入最多的科目，占累计学习时长的 ${studyStore.mostActiveSubject.percentage}%。`
    )
  }

  const weakSubject =
    studyStore.subjectStats
      .filter(item => {
        return item.duration === 0
      })
      .map(item => item.subject)

  if (weakSubject.length > 0) {
    insights.push(
      `${weakSubject.slice(0, 3).join("、")}目前还没有学习记录，建议尽快安排基础学习任务。`
    )
  } else {
    const lowestSubject =
      [...studyStore.subjectStats]
        .filter(item => {
          return item.duration > 0
        })
        .sort((a, b) => {
          return a.duration - b.duration
        })[0]

    if (lowestSubject) {
      insights.push(
        `${lowestSubject.subject}当前学习投入相对较少，可以适当提高近期计划中的学习占比。`
      )
    }
  }

  if (studyStore.streakDays >= 7) {
    insights.push(
      `你已经连续学习 ${studyStore.streakDays} 天，学习习惯保持良好，注意安排适当休息。`
    )
  } else if (studyStore.streakDays > 0) {
    insights.push(
      `当前已连续学习 ${studyStore.streakDays} 天，继续保持即可逐步形成稳定习惯。`
    )
  } else {
    insights.push(
      "当前连续学习天数为 0，今天完成一次学习即可重新开始连续记录。"
    )
  }

  if (
    studyStore.averageDailySeconds <
      3600 &&
    studyStore.totalStudyDays > 0
  ) {
    insights.push(
      "目前平均每个学习日不足 1 小时，可以优先提高有效学习时长，而不是一次安排过多任务。"
    )
  } else if (
    studyStore.averageDailySeconds >=
    7200
  ) {
    insights.push(
      "目前平均每个学习日已达到 2 小时以上，建议继续保持，并关注各科目的均衡程度。"
    )
  }

  return insights.slice(0, 5)
})

function formatDisplayDate(
  dateText: string
) {
  const parts = dateText.split("-")

  if (parts.length !== 3) {
    return dateText
  }

  const month = Number(parts[1])
  const day = Number(parts[2])

  return `${month}月${day}日`
}

function formatChartDate(
  dateText: string
) {
  const parts = dateText.split("-")

  if (parts.length !== 3) {
    return dateText
  }

  return `${Number(parts[1])}/${Number(
    parts[2]
  )}`
}
</script>

<style scoped>
.report-page {
  width: 100%;
  margin-top: 20px;
  padding-bottom: 40px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.page-header h2 {
  margin: 0;
}

.page-subtitle {
  margin: 8px 0 0;
  color: var(
    --el-text-color-secondary
  );
  font-size: 14px;
}

.error-alert {
  margin-top: 20px;
}

.card {
  margin-top: 20px;
  border-radius: 16px;
}

.overview-grid {
  display: grid;
  grid-template-columns:
    repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.overview-card {
  border-radius: 16px;
}

.overview-card-content {
  display: flex;
  align-items: center;
  gap: 14px;
}

.overview-icon {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  font-size: 25px;
}

.overview-icon-total {
  background: rgba(64, 158, 255, 0.12);
}

.overview-icon-today {
  background: rgba(230, 162, 60, 0.14);
}

.overview-icon-week {
  background: rgba(103, 194, 58, 0.14);
}

.overview-icon-month {
  background: rgba(144, 147, 153, 0.14);
}

.overview-info {
  min-width: 0;
}

.overview-info span,
.overview-info small {
  display: block;
  color: var(
    --el-text-color-secondary
  );
}

.overview-info strong {
  display: block;
  margin: 5px 0;
  font-size: 20px;
  line-height: 1.3;
  word-break: break-word;
}

.overview-info small {
  font-size: 12px;
}

.analysis-grid,
.subject-grid {
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.header-description {
  margin: 5px 0 0;
  color: var(
    --el-text-color-secondary
  );
  font-size: 13px;
  font-weight: normal;
}

.comparison-content {
  display: flex;
  min-height: 210px;
  flex-direction: column;
  justify-content: center;
}

.comparison-trend {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 32px;
}

.comparison-arrow {
  font-size: 36px;
}

.trend-up {
  color: var(--el-color-success);
}

.trend-down {
  color: var(--el-color-danger);
}

.trend-same {
  color: var(
    --el-text-color-secondary
  );
}

.comparison-description {
  margin: 12px 0 20px;
  color: var(
    --el-text-color-secondary
  );
  line-height: 1.7;
}

.comparison-values {
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.comparison-values > div {
  padding: 14px;
  background: var(
    --el-fill-color-light
  );
  border-radius: 12px;
}

.comparison-values span,
.comparison-values strong {
  display: block;
}

.comparison-values span {
  margin-bottom: 6px;
  color: var(
    --el-text-color-secondary
  );
  font-size: 13px;
}

.record-list {
  display: flex;
  flex-direction: column;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 15px 0;
  border-bottom: 1px solid
    var(--el-border-color-lighter);
}

.record-item:first-child {
  padding-top: 0;
}

.record-item:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.record-item span,
.record-item small {
  display: block;
}

.record-item small {
  margin-top: 4px;
  color: var(
    --el-text-color-secondary
  );
}

.record-item strong {
  text-align: right;
}

.trend-summary {
  display: grid;
  grid-template-columns:
    repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.trend-stat {
  padding: 14px;
  background: var(
    --el-fill-color-light
  );
  border-radius: 12px;
}

.trend-stat span,
.trend-stat strong {
  display: block;
}

.trend-stat span {
  margin-bottom: 6px;
  color: var(
    --el-text-color-secondary
  );
  font-size: 13px;
}

.chart-wrapper {
  width: 100%;
  min-width: 0;
}

.heatmap-scroll {
  max-width: 100%;
  overflow-x: auto;
  padding-bottom: 8px;
}

.heatmap-legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
  margin-top: 14px;
  color: var(
    --el-text-color-secondary
  );
  font-size: 12px;
}

.legend-cell {
  width: 14px;
  height: 14px;
  border-radius: 3px;
}

.level-0 {
  background: #ebedf0;
}

.level-1 {
  background: #c6e48b;
}

.level-2 {
  background: #7bc96f;
}

.level-3 {
  background: #239a3b;
}

.level-4 {
  background: #196127;
}

.subject-list {
  max-height: 430px;
  overflow-y: auto;
  padding-right: 4px;
}

.subject-item {
  padding: 13px 0;
  border-bottom: 1px solid
    var(--el-border-color-lighter);
}

.subject-item:first-child {
  padding-top: 0;
}

.subject-item:last-child {
  border-bottom: none;
}

.subject-title-row,
.subject-meta {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.subject-title-row {
  margin-bottom: 9px;
}

.subject-meta {
  margin-top: 7px;
  color: var(
    --el-text-color-secondary
  );
  font-size: 12px;
}

.insight-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.insight-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  background: var(
    --el-fill-color-light
  );
  border-radius: 12px;
}

.insight-index {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 27px;
  height: 27px;
  color: white;
  background: var(
    --el-color-primary
  );
  border-radius: 50%;
  font-size: 13px;
  font-weight: bold;
}

.insight-item p {
  margin: 2px 0 0;
  line-height: 1.7;
}

@media (max-width: 1100px) {
  .overview-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .trend-summary {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 800px) {
  .analysis-grid,
  .subject-grid {
    grid-template-columns: 1fr;
  }

  .page-header,
  .card-header {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 600px) {
  .report-page {
    margin-top: 12px;
  }

  .overview-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .overview-card-content {
    align-items: flex-start;
  }

  .trend-summary,
  .comparison-values {
    grid-template-columns: 1fr;
  }

  .record-item {
    align-items: flex-start;
  }

  .overview-info strong {
    font-size: 18px;
  }

  .comparison-trend {
    font-size: 28px;
  }
}
</style>