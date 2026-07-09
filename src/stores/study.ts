import { defineStore } from "pinia"
import { computed, ref, watch } from "vue"
import type { StudyRecord } from "../types/study"
import { useReviewStore } from "./review"

export const useStudyStore = defineStore("study", () => {
  const records = ref<StudyRecord[]>([])

  const saved = localStorage.getItem("study-records")

  if (saved) {
    try {
      records.value = JSON.parse(saved)
    } catch {
      records.value = []
    }
  }

  watch(
    records,
    (value) => {
      localStorage.setItem("study-records", JSON.stringify(value))
    },
    { deep: true }
  )

  const studyDates = computed(() => {
    return Array.from(
      new Set(records.value.map(item => item.date))
    ).sort()
  })

  const streakDays = computed(() => {
    const dates = [...studyDates.value].sort((a, b) => b.localeCompare(a))

    if (dates.length === 0) return 0

    let streak = 0
    const current = new Date()

    while (true) {
      const dateText = current.toISOString().slice(0, 10)

      if (dates.includes(dateText)) {
        streak++
        current.setDate(current.getDate() - 1)
      } else {
        break
      }
    }

    return streak
  })

  const longestStreak = computed(() => {
    const dates = studyDates.value

    if (dates.length === 0) return 0

    let longest = 1
    let current = 1

    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1])
      const now = new Date(dates[i])

      const diff =
        (now.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)

      if (diff === 1) {
        current++
        longest = Math.max(longest, current)
      } else {
        current = 1
      }
    }

    return longest
  })

  const monthStudyDays = computed(() => {
    const now = new Date()
    const monthText = now.toISOString().slice(0, 7)

    return studyDates.value.filter(date => {
      return date.startsWith(monthText)
    }).length
  })

  const totalRecords = computed(() => {
    return records.value.length
  })

  function addRecord(record: StudyRecord) {
    records.value.unshift(record)

    const reviewStore = useReviewStore()
    reviewStore.addReviewTasks(record)
  }

  function deleteRecord(index: number) {
    records.value.splice(index, 1)
  }

  function updateRecord(record: StudyRecord) {
    const index = records.value.findIndex(item => item.id === record.id)

    if (index !== -1) {
      records.value[index] = record
    }
  }

  return {
    records,
    studyDates,
    streakDays,
    longestStreak,
    monthStudyDays,
    totalRecords,
    addRecord,
    deleteRecord,
    updateRecord
  }
})