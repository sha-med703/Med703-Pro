import { defineStore } from "pinia"
import { ref, watch } from "vue"

export interface SubjectGoal {
  subject: string
  targetHours: number
}

const defaultGoals: SubjectGoal[] = [
  { subject: "生理", targetHours: 2 },
  { subject: "生化", targetHours: 1 },
  { subject: "病理", targetHours: 1 },
  { subject: "病生", targetHours: 1 },
  { subject: "免疫", targetHours: 1 },
  { subject: "政治", targetHours: 1 },
  { subject: "英语一", targetHours: 2 }
]

export const useSettingsStore = defineStore("settings", () => {
  const examDate = ref("2026-12-20")

  const goals = ref<SubjectGoal[]>(structuredClone(defaultGoals))

  const saved = localStorage.getItem("settings")

  if (saved) {
    try {
      const data = JSON.parse(saved)

      examDate.value = data.examDate ?? examDate.value
      goals.value = data.goals ?? goals.value
    } catch {
      // 忽略损坏的数据
    }
  }

  watch(
    [examDate, goals],
    () => {
      localStorage.setItem(
        "settings",
        JSON.stringify({
          examDate: examDate.value,
          goals: goals.value
        })
      )
    },
    { deep: true }
  )

  return {
    examDate,
    goals
  }
})