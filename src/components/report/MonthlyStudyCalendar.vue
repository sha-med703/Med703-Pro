<template>
  <el-card class="calendar-card">
    <template #header>
      <div class="header-row">
        <strong>📅 月度学习日历</strong>

        <div class="controls">
          <el-button size="small" @click="previousMonth">
            上个月
          </el-button>

          <span class="month-title">
            {{ currentYear }} 年 {{ currentMonth + 1 }} 月
          </span>

          <el-button size="small" @click="nextMonth">
            下个月
          </el-button>
        </div>
      </div>
    </template>

    <div class="week-header">
      <span
        v-for="week in weekNames"
        :key="week"
      >
        {{ week }}
      </span>
    </div>

    <div class="calendar-grid">
      <div
        v-for="item in calendarDays"
        :key="item.key"
        class="day-cell"
        :class="{
          empty: !item.date,
          today: item.date === todayText
        }"
        @click="selectDay(item.date)"
      >
        <template v-if="item.date">
          <span class="day-number">
            {{ item.day }}
          </span>

          <div
            class="study-dot"
            :class="getLevel(item.duration)"
          ></div>

          <small>
            {{ formatShortTime(item.duration) }}
          </small>
        </template>
      </div>
    </div>

    <div v-if="selectedDate" class="detail">
      <strong>{{ selectedDate }} 学习情况</strong>
      <p>总学习时长：{{ formatTime(selectedDuration) }}</p>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import type { StudyRecord } from "../../types/study"

const props = defineProps<{
  records: StudyRecord[]
}>()

const currentDate = ref(new Date())
const selectedDate = ref("")

const weekNames = ["日", "一", "二", "三", "四", "五", "六"]

const currentYear = computed(() => {
  return currentDate.value.getFullYear()
})

const currentMonth = computed(() => {
  return currentDate.value.getMonth()
})

const todayText = getDateText(new Date())

function getDateText(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function getDurationByDate(dateText: string) {
  return props.records
    .filter(item => item.date === dateText)
    .reduce((sum, item) => sum + (item.duration || 0), 0)
}

const calendarDays = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value

  const firstDay = new Date(year, month, 1).getDay()
  const totalDays = new Date(year, month + 1, 0).getDate()

  const result: {
    key: string
    date: string
    day: number | null
    duration: number
  }[] = []

  for (let i = 0; i < firstDay; i++) {
    result.push({
      key: `empty-${i}`,
      date: "",
      day: null,
      duration: 0
    })
  }

  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(year, month, day)
    const dateText = getDateText(date)

    result.push({
      key: dateText,
      date: dateText,
      day,
      duration: getDurationByDate(dateText)
    })
  }

  return result
})

const selectedDuration = computed(() => {
  if (!selectedDate.value) return 0
  return getDurationByDate(selectedDate.value)
})

function previousMonth() {
  currentDate.value = new Date(
    currentYear.value,
    currentMonth.value - 1,
    1
  )

  selectedDate.value = ""
}

function nextMonth() {
  currentDate.value = new Date(
    currentYear.value,
    currentMonth.value + 1,
    1
  )

  selectedDate.value = ""
}

function selectDay(date: string) {
  if (!date) return
  selectedDate.value = date
}

function getLevel(duration: number) {
  if (duration === 0) return "level-0"
  if (duration < 1800) return "level-1"
  if (duration < 3600) return "level-2"
  if (duration < 7200) return "level-3"
  return "level-4"
}

function formatShortTime(total: number) {
  if (total === 0) return "0分"

  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)

  if (h > 0) {
    return `${h}时${m}分`
  }

  return `${m}分`
}

function formatTime(total: number) {
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60

  return `${h}小时 ${m}分 ${s}秒`
}
</script>

<style scoped>
.calendar-card {
  margin-top: 20px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.month-title {
  min-width: 110px;
  text-align: center;
  font-weight: bold;
}

.week-header,
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.week-header {
  margin-bottom: 8px;
  text-align: center;
  color: #666;
  font-weight: bold;
}

.day-cell {
  min-height: 88px;
  padding: 8px;
  border: 1px solid #eee;
  border-radius: 10px;
  cursor: pointer;
  transition: 0.2s;
}

.day-cell:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.day-cell.empty {
  cursor: default;
  background: transparent;
  border-color: transparent;
  box-shadow: none;
}

.day-cell.today {
  border-color: #2e8b57;
}

.day-number {
  display: block;
  font-weight: bold;
}

.study-dot {
  width: 100%;
  height: 12px;
  margin: 10px 0 6px;
  border-radius: 8px;
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

.detail {
  margin-top: 20px;
  padding: 16px;
  background: #f6f8f7;
  border-radius: 10px;
}

@media (max-width: 600px) {
  .day-cell {
    min-height: 68px;
    padding: 5px;
    font-size: 12px;
  }

  .week-header,
  .calendar-grid {
    gap: 4px;
  }

  .controls {
    width: 100%;
    justify-content: space-between;
  }
}
</style>