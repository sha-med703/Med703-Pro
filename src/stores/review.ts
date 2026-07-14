import { defineStore } from "pinia"
import { ref, watch } from "vue"
import type { StudyRecord, ReviewTask } from "../types/study"
import { supabase } from "../lib/supabase"

interface ReviewTaskRow {
  id: string
  study_record_id: string
  subject: string
  chapter: string | null
  content: string | null
  review_date: string
  round: number
  done: boolean
  created_at: string
}

export const useReviewStore = defineStore("review", () => {
  const tasks = ref<ReviewTask[]>([])
  const loading = ref(false)
  const initialized = ref(false)

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
    value => {
      localStorage.setItem("review-tasks", JSON.stringify(value))
    },
    {
      deep: true
    }
  )

  function rowToReviewTask(row: ReviewTaskRow): ReviewTask {
    return {
      id: row.id,
      studyRecordId: row.study_record_id,
      subject: row.subject,
      chapter: row.chapter ?? "",
      content: row.content ?? "",
      reviewDate: row.review_date,
      round: row.round,
      done: row.done
    }
  }

  async function loadCloudTasks() {
    loading.value = true

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      loading.value = false
      initialized.value = true
      return
    }

    const { data, error } = await supabase
      .from("review_tasks")
      .select(`
        id,
        study_record_id,
        subject,
        chapter,
        content,
        review_date,
        round,
        done,
        created_at
      `)
      .order("review_date", { ascending: true })
      .order("round", { ascending: true })

    loading.value = false
    initialized.value = true

    if (error) {
      console.error("读取云端复习任务失败：", error)
      return
    }

    const cloudTasks = (data ?? []).map(row =>
      rowToReviewTask(row as ReviewTaskRow)
    )

    const taskMap = new Map<string, ReviewTask>()

    for (const task of tasks.value) {
      taskMap.set(task.id, task)
    }

    for (const task of cloudTasks) {
      taskMap.set(task.id, task)
    }

    tasks.value = Array.from(taskMap.values()).sort((a, b) => {
      const dateCompare = a.reviewDate.localeCompare(b.reviewDate)

      if (dateCompare !== 0) {
        return dateCompare
      }

      return a.round - b.round
    })

    console.log("云端复习任务加载完成")
  }

  async function addReviewTasks(record: StudyRecord) {
    const intervals = [0, 1, 3, 7, 14, 30]

    const newTasks: ReviewTask[] = intervals.map((day, index) => {
      const reviewDate = new Date(record.date)
      reviewDate.setDate(reviewDate.getDate() + day)

      const dateText = reviewDate.toISOString().slice(0, 10)

      return {
        id: `${record.id}-${index + 1}`,
        studyRecordId: record.id,
        subject: record.subject,
        chapter: record.chapter,
        content: record.content,
        reviewDate: dateText,
        round: index + 1,
        done: false
      }
    })

    tasks.value.push(...newTasks)

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.warn("当前未登录，复习任务仅保存在本机")
      return
    }

    const rows = newTasks.map(task => ({
      id: task.id,
      user_id: user.id,
      study_record_id: task.studyRecordId,
      subject: task.subject,
      chapter: task.chapter,
      content: task.content,
      review_date: task.reviewDate,
      round: task.round,
      done: task.done
    }))

    const { error } = await supabase
      .from("review_tasks")
      .insert(rows)

    if (error) {
      console.error("复习任务上传失败：", error)
      return
    }

    console.log("复习任务已同步到 Supabase")
  }

  async function finishTask(id: string) {
    const task = tasks.value.find(item => item.id === id)

    if (!task) return

    const oldDone = task.done
    task.done = true

    const { error } = await supabase
      .from("review_tasks")
      .update({
        done: true
      })
      .eq("id", id)

    if (error) {
      task.done = oldDone
      console.error("云端复习任务更新失败：", error)
      return
    }

    console.log("云端复习任务已完成")
  }

  async function deleteTasksByStudyRecordId(studyRecordId: string) {
    const oldTasks = [...tasks.value]

    tasks.value = tasks.value.filter(
      task => task.studyRecordId !== studyRecordId
    )

    const { error } = await supabase
      .from("review_tasks")
      .delete()
      .eq("study_record_id", studyRecordId)

    if (error) {
      tasks.value = oldTasks
      console.error("关联复习任务删除失败：", error)
      return
    }

    console.log("关联复习任务已删除")
  }

  function clearTasks() {
    tasks.value = []
  }

  return {
    tasks,
    loading,
    initialized,
    loadCloudTasks,
    addReviewTasks,
    finishTask,
    deleteTasksByStudyRecordId,
    clearTasks
  }
})