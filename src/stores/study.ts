import { defineStore } from "pinia"
import { ref, watch } from "vue"
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
    {
      deep: true
    }
  )

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
    addRecord,
    deleteRecord
  }
})