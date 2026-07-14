import { defineStore } from "pinia"
import { computed, ref, watch } from "vue"
import type { StudyRecord } from "../types/study"
import { useReviewStore } from "./review"
import { supabase } from "../lib/supabase"

interface StudyRecordRow {
  id: string
  subject: string
  chapter: string | null
  content: string | null
  duration: number
  duration_text: string | null
  start_time: string | null
  end_time: string | null
  study_date: string | null
  created_at: string
}

export const useStudyStore = defineStore("study", () => {
  const records = ref<StudyRecord[]>([])
  const loading = ref(false)
  const initialized = ref(false)

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
    value => {
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
    const dates = [...studyDates.value].sort((a, b) =>
      b.localeCompare(a)
    )

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
        (now.getTime() - prev.getTime()) /
        (1000 * 60 * 60 * 24)

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

    return studyDates.value.filter(date =>
      date.startsWith(monthText)
    ).length
  })

  const totalRecords = computed(() => {
    return records.value.length
  })

  function rowToStudyRecord(row: StudyRecordRow): StudyRecord {
    return {
      id: row.id,
      subject: row.subject,
      chapter: row.chapter ?? "",
      content: row.content ?? "",
      duration: row.duration,
      durationText: row.duration_text ?? "",
      startTime: row.start_time ?? "",
      endTime: row.end_time ?? "",
      date: row.study_date ?? ""
    }
  }

  async function loadCloudRecords() {
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
      .from("study_records")
      .select(`
        id,
        subject,
        chapter,
        content,
        duration,
        duration_text,
        start_time,
        end_time,
        study_date,
        created_at
      `)
      .order("created_at", { ascending: false })

    loading.value = false
    initialized.value = true

    if (error) {
      console.error("读取云端学习记录失败：", error)
      return
    }

    const cloudRecords = (data ?? []).map(row =>
      rowToStudyRecord(row as StudyRecordRow)
    )

    const recordMap = new Map<string, StudyRecord>()

    for (const record of records.value) {
      recordMap.set(record.id, record)
    }

    for (const record of cloudRecords) {
      recordMap.set(record.id, record)
    }

    records.value = Array.from(recordMap.values()).sort((a, b) => {
      return `${b.date} ${b.endTime}`.localeCompare(
        `${a.date} ${a.endTime}`
      )
    })

    console.log("云端学习记录加载完成")
  }

  async function addRecord(record: StudyRecord) {
    records.value.unshift(record)

    const reviewStore = useReviewStore()
    reviewStore.addReviewTasks(record)

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.warn("当前未登录，学习记录仅保存在本机")
      return
    }

    const { error } = await supabase
      .from("study_records")
      .insert({
        id: record.id,
        user_id: user.id,
        subject: record.subject,
        chapter: record.chapter,
        content: record.content,
        duration: record.duration,
        duration_text: record.durationText,
        start_time: record.startTime,
        end_time: record.endTime,
        study_date: record.date
      })

    if (error) {
      console.error("学习记录上传失败：", error)
      return
    }

    console.log("学习记录已同步到 Supabase")
  }

  async function deleteRecord(index: number) {
    const record = records.value[index]

    if (!record) return

    records.value.splice(index, 1)

    const { error } = await supabase
      .from("study_records")
      .delete()
      .eq("id", record.id)

    if (error) {
      console.error("云端学习记录删除失败：", error)
      records.value.splice(index, 0, record)
      return
    }

    console.log("云端学习记录已删除")
  }

  async function updateRecord(record: StudyRecord) {
    const index = records.value.findIndex(
      item => item.id === record.id
    )

    if (index === -1) return

    const oldRecord = { ...records.value[index] }
    records.value[index] = record

    const { error } = await supabase
      .from("study_records")
      .update({
        subject: record.subject,
        chapter: record.chapter,
        content: record.content,
        duration: record.duration,
        duration_text: record.durationText,
        start_time: record.startTime,
        end_time: record.endTime,
        study_date: record.date
      })
      .eq("id", record.id)

    if (error) {
      console.error("云端学习记录修改失败：", error)
      records.value[index] = oldRecord
      return
    }

    console.log("云端学习记录已更新")
  }

  function clearRecords() {
    records.value = []
  }

  return {
    records,
    loading,
    initialized,
    studyDates,
    streakDays,
    longestStreak,
    monthStudyDays,
    totalRecords,
    loadCloudRecords,
    addRecord,
    deleteRecord,
    updateRecord,
    clearRecords
  }
})