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

  const streakDays = computed(() => {
    const dates = Array.from(
      new Set(records.value.map(item => item.date))
    ).sort((a, b) => b.localeCompare(a))

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

  function addRecord(record: StudyRecord) {
    records.value.unshift(record)

    const reviewStore = useReviewStore()
    reviewStore.addReviewTasks(record)
  }

  function deleteRecord(index: number) {
    records.value.splice(index, 1)
  }

  return {
    records,
    streakDays,
    addRecord,
    deleteRecord
  }
})