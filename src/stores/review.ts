import { defineStore } from "pinia"
import { ref, watch } from "vue"
import type { StudyRecord, ReviewTask } from "../types/study"

export const useReviewStore = defineStore("review", () => {
  const tasks = ref<ReviewTask[]>([])

  const saved = localStorage.getItem("review-tasks")

  if (saved) {
    try {
      tasks.value = JSON.parse(saved)
    } catch {
      tasks.value = []
    }
  }

  watch(
    tasks,
    (value) => {
      localStorage.setItem("review-tasks", JSON.stringify(value))
    },
    {
      deep: true
    }
  )

  function addReviewTasks(record: StudyRecord) {
    const intervals = [0, 1, 3, 7, 14, 30]

    intervals.forEach((day, index) => {
      const reviewDate = new Date(record.date)
      reviewDate.setDate(reviewDate.getDate() + day)

      const dateText = reviewDate.toISOString().slice(0, 10)

      tasks.value.push({
        id: `${record.id}-${index + 1}`,
        studyRecordId: record.id,
        subject: record.subject,
        chapter: record.chapter,
        content: record.content,
        reviewDate: dateText,
        round: index + 1,
        done: false
      })
    })
  }

  function finishTask(id: string) {
    const task = tasks.value.find(item => item.id === id)

    if (task) {
      task.done = true
    }
  }

  return {
    tasks,
    addReviewTasks,
    finishTask
  }
})