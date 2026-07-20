import { defineStore } from "pinia"
import { computed, ref, watch } from "vue"

import type { StudyRecord } from "../types/study"
import { SUBJECTS } from "../constants/subjects"
import { supabase } from "../lib/supabase"
import { useReviewStore } from "./review"

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

export interface DailyStudyStat {
  date: string
  duration: number
  recordCount: number
}

export interface SubjectStudyStat {
  subject: string
  duration: number
  recordCount: number
  percentage: number
}

export interface BestStudyDay {
  date: string
  duration: number
  recordCount: number
}

export interface PeriodComparison {
  currentDuration: number
  previousDuration: number
  difference: number
  percentage: number
  trend: "up" | "down" | "same"
}

const LOCAL_STORAGE_KEY = "study-records"

export const useStudyStore = defineStore(
  "study",
  () => {
    const records = ref<StudyRecord[]>([])
    const loading = ref(false)
    const initialized = ref(false)
    const errorMessage = ref("")

    const saved = localStorage.getItem(
      LOCAL_STORAGE_KEY
    )

    if (saved) {
      try {
        const parsed = JSON.parse(saved)

        records.value = Array.isArray(parsed)
          ? parsed
          : []
      } catch (error) {
        console.error(
          "读取本地学习记录失败：",
          error
        )

        records.value = []
      }
    }

    watch(
      records,
      value => {
        localStorage.setItem(
          LOCAL_STORAGE_KEY,
          JSON.stringify(value)
        )
      },
      {
        deep: true
      }
    )

    function getDateText(date: Date) {
      const year = date.getFullYear()

      const month = String(
        date.getMonth() + 1
      ).padStart(2, "0")

      const day = String(
        date.getDate()
      ).padStart(2, "0")

      return `${year}-${month}-${day}`
    }

    function getTodayText() {
      return getDateText(new Date())
    }

    function getMonthText(date = new Date()) {
      const year = date.getFullYear()

      const month = String(
        date.getMonth() + 1
      ).padStart(2, "0")

      return `${year}-${month}`
    }

    function formatDuration(
      totalSeconds: number,
      includeSeconds = true
    ) {
      const safeSeconds = Math.max(
        0,
        Math.floor(totalSeconds || 0)
      )

      const hours = Math.floor(
        safeSeconds / 3600
      )

      const minutes = Math.floor(
        (safeSeconds % 3600) / 60
      )

      const seconds =
        safeSeconds % 60

      if (includeSeconds) {
        return (
          `${hours}小时 ` +
          `${minutes}分 ` +
          `${seconds}秒`
        )
      }

      return `${hours}小时 ${minutes}分`
    }

    function getRecordsDuration(
      targetRecords: StudyRecord[]
    ) {
      return targetRecords.reduce(
        (sum, record) => {
          return (
            sum +
            Math.max(
              0,
              Number(record.duration) || 0
            )
          )
        },
        0
      )
    }

    function getRecordsByDateRange(
      startDate: string,
      endDate: string
    ) {
      return records.value.filter(record => {
        return (
          record.date >= startDate &&
          record.date <= endDate
        )
      })
    }

    function createDailyStats(
      dayCount: number,
      endDate = new Date()
    ): DailyStudyStat[] {
      const result: DailyStudyStat[] = []

      for (
        let index = dayCount - 1;
        index >= 0;
        index--
      ) {
        const date = new Date(endDate)

        date.setHours(12, 0, 0, 0)

        date.setDate(
          date.getDate() - index
        )

        const dateText =
          getDateText(date)

        const dateRecords =
          records.value.filter(record => {
            return record.date === dateText
          })

        result.push({
          date: dateText,
          duration:
            getRecordsDuration(dateRecords),
          recordCount:
            dateRecords.length
        })
      }

      return result
    }

    function createPeriodComparison(
      days: number
    ): PeriodComparison {
      const currentEnd = new Date()

      currentEnd.setHours(12, 0, 0, 0)

      const currentStart =
        new Date(currentEnd)

      currentStart.setDate(
        currentStart.getDate() -
          (days - 1)
      )

      const previousEnd =
        new Date(currentStart)

      previousEnd.setDate(
        previousEnd.getDate() - 1
      )

      const previousStart =
        new Date(previousEnd)

      previousStart.setDate(
        previousStart.getDate() -
          (days - 1)
      )

      const currentDuration =
        getRecordsDuration(
          getRecordsByDateRange(
            getDateText(currentStart),
            getDateText(currentEnd)
          )
        )

      const previousDuration =
        getRecordsDuration(
          getRecordsByDateRange(
            getDateText(previousStart),
            getDateText(previousEnd)
          )
        )

      const difference =
        currentDuration -
        previousDuration

      let percentage = 0

      if (previousDuration > 0) {
        percentage = Math.round(
          (difference /
            previousDuration) *
            100
        )
      } else if (currentDuration > 0) {
        percentage = 100
      }

      let trend:
        | "up"
        | "down"
        | "same" = "same"

      if (difference > 0) {
        trend = "up"
      }

      if (difference < 0) {
        trend = "down"
      }

      return {
        currentDuration,
        previousDuration,
        difference,
        percentage,
        trend
      }
    }

    const sortedRecords = computed(() => {
      return [...records.value].sort(
        (a, b) => {
          return (
            `${b.date} ${b.endTime}`.localeCompare(
              `${a.date} ${a.endTime}`
            )
          )
        }
      )
    })

    const totalRecords = computed(() => {
      return records.value.length
    })

    const totalSeconds = computed(() => {
      return getRecordsDuration(
        records.value
      )
    })

    const totalTimeText = computed(() => {
      return formatDuration(
        totalSeconds.value
      )
    })

    const studyDates = computed(() => {
      return Array.from(
        new Set(
          records.value
            .map(record => record.date)
            .filter(Boolean)
        )
      ).sort()
    })

    const totalStudyDays =
      computed(() => {
        return studyDates.value.length
      })

    const todayRecords = computed(() => {
      const today = getTodayText()

      return records.value.filter(
        record => {
          return record.date === today
        }
      )
    })

    const todayTotalSeconds =
      computed(() => {
        return getRecordsDuration(
          todayRecords.value
        )
      })

    const todayTimeText = computed(() => {
      return formatDuration(
        todayTotalSeconds.value
      )
    })

    const last7Days = computed(() => {
      return createDailyStats(7)
    })

    const last30Days = computed(() => {
      return createDailyStats(30)
    })

    const last56Days = computed(() => {
      return createDailyStats(56)
    })

    const last365Days = computed(() => {
      return createDailyStats(365)
    })

    const weekTotalSeconds =
      computed(() => {
        return last7Days.value.reduce(
          (sum, item) => {
            return sum + item.duration
          },
          0
        )
      })

    const weekTimeText = computed(() => {
      return formatDuration(
        weekTotalSeconds.value
      )
    })

    const monthTotalSeconds =
      computed(() => {
        const monthText =
          getMonthText()

        const monthRecords =
          records.value.filter(record => {
            return record.date.startsWith(
              monthText
            )
          })

        return getRecordsDuration(
          monthRecords
        )
      })

    const monthTimeText = computed(() => {
      return formatDuration(
        monthTotalSeconds.value
      )
    })

    const monthStudyDays =
      computed(() => {
        const monthText =
          getMonthText()

        return studyDates.value.filter(
          date => {
            return date.startsWith(
              monthText
            )
          }
        ).length
      })

    const averageDailySeconds =
      computed(() => {
        if (
          totalStudyDays.value === 0
        ) {
          return 0
        }

        return Math.round(
          totalSeconds.value /
            totalStudyDays.value
        )
      })

    const averageDailyTimeText =
      computed(() => {
        return formatDuration(
          averageDailySeconds.value,
          false
        )
      })

    const average7DaySeconds =
      computed(() => {
        return Math.round(
          weekTotalSeconds.value / 7
        )
      })

    const average7DayTimeText =
      computed(() => {
        return formatDuration(
          average7DaySeconds.value,
          false
        )
      })

    const subjectStats =
      computed<SubjectStudyStat[]>(
        () => {
          const knownSubjects =
            new Set<string>(
              SUBJECTS as readonly string[]
            )

          for (
            const record of records.value
          ) {
            if (record.subject) {
              knownSubjects.add(
                record.subject
              )
            }
          }

          return Array.from(
            knownSubjects
          )
            .map(subject => {
              const subjectRecords =
                records.value.filter(
                  record => {
                    return (
                      record.subject ===
                      subject
                    )
                  }
                )

              const duration =
                getRecordsDuration(
                  subjectRecords
                )

              const percentage =
                totalSeconds.value > 0
                  ? Math.round(
                      (duration /
                        totalSeconds.value) *
                        100
                    )
                  : 0

              return {
                subject,
                duration,
                recordCount:
                  subjectRecords.length,
                percentage
              }
            })
            .sort((a, b) => {
              return (
                b.duration -
                a.duration
              )
            })
        }
      )

    const activeSubjectStats =
      computed(() => {
        return subjectStats.value.filter(
          item => item.duration > 0
        )
      })

    const mostActiveSubject =
      computed(() => {
        return (
          activeSubjectStats.value[0] ??
          null
        )
      })

    const bestStudyDay =
      computed<BestStudyDay | null>(
        () => {
          if (
            studyDates.value.length === 0
          ) {
            return null
          }

          let result: BestStudyDay | null =
            null

          for (
            const date of studyDates.value
          ) {
            const dateRecords =
              records.value.filter(
                record => {
                  return (
                    record.date === date
                  )
                }
              )

            const duration =
              getRecordsDuration(
                dateRecords
              )

            if (
              !result ||
              duration > result.duration
            ) {
              result = {
                date,
                duration,
                recordCount:
                  dateRecords.length
              }
            }
          }

          return result
        }
      )

    const streakDays = computed(() => {
      if (
        studyDates.value.length === 0
      ) {
        return 0
      }

      const dateSet = new Set(
        studyDates.value
      )

      const current = new Date()

      current.setHours(12, 0, 0, 0)

      const todayText =
        getDateText(current)

      if (!dateSet.has(todayText)) {
        current.setDate(
          current.getDate() - 1
        )
      }

      let streak = 0

      while (true) {
        const dateText =
          getDateText(current)

        if (!dateSet.has(dateText)) {
          break
        }

        streak += 1

        current.setDate(
          current.getDate() - 1
        )
      }

      return streak
    })

    const longestStreak =
      computed(() => {
        const dates =
          studyDates.value

        if (dates.length === 0) {
          return 0
        }

        let longest = 1
        let currentStreak = 1

        for (
          let index = 1;
          index < dates.length;
          index++
        ) {
          const previousDate =
            new Date(
              `${dates[index - 1]}T12:00:00`
            )

          const currentDate =
            new Date(
              `${dates[index]}T12:00:00`
            )

          const difference =
            Math.round(
              (
                currentDate.getTime() -
                previousDate.getTime()
              ) /
                (1000 * 60 * 60 * 24)
            )

          if (difference === 1) {
            currentStreak += 1

            longest = Math.max(
              longest,
              currentStreak
            )
          } else {
            currentStreak = 1
          }
        }

        return longest
      })

    const sevenDayComparison =
      computed(() => {
        return createPeriodComparison(7)
      })

    const thirtyDayComparison =
      computed(() => {
        return createPeriodComparison(30)
      })

    function rowToStudyRecord(
      row: StudyRecordRow
    ): StudyRecord {
      return {
        id: row.id,
        subject: row.subject,
        chapter: row.chapter ?? "",
        content: row.content ?? "",
        duration:
          Number(row.duration) || 0,
        durationText:
          row.duration_text ?? "",
        startTime:
          row.start_time ?? "",
        endTime:
          row.end_time ?? "",
        date:
          row.study_date ?? ""
      }
    }

    async function loadCloudRecords() {
      if (loading.value) {
        return
      }

      loading.value = true
      errorMessage.value = ""

      try {
        const {
          data: { user },
          error: userError
        } =
          await supabase.auth.getUser()

        if (userError || !user) {
          initialized.value = true
          return
        }

        const { data, error } =
          await supabase
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
            .eq("user_id", user.id)
            .order("created_at", {
              ascending: false
            })

        if (error) {
          console.error(
            "读取云端学习记录失败：",
            error
          )

          errorMessage.value =
            "云端学习记录加载失败"

          return
        }

        const cloudRecords =
          (data ?? []).map(row => {
            return rowToStudyRecord(
              row as StudyRecordRow
            )
          })

        const recordMap =
          new Map<
            string,
            StudyRecord
          >()

        for (
          const record of records.value
        ) {
          recordMap.set(
            record.id,
            record
          )
        }

        for (
          const record of cloudRecords
        ) {
          recordMap.set(
            record.id,
            record
          )
        }

        records.value =
          Array.from(
            recordMap.values()
          ).sort((a, b) => {
            return (
              `${b.date} ${b.endTime}`.localeCompare(
                `${a.date} ${a.endTime}`
              )
            )
          })

        console.log(
          "云端学习记录加载完成"
        )
      } catch (error) {
        console.error(
          "加载学习记录发生异常：",
          error
        )

        errorMessage.value =
          error instanceof Error
            ? error.message
            : "加载学习记录失败"
      } finally {
        loading.value = false
        initialized.value = true
      }
    }

    async function addRecord(
      record: StudyRecord
    ) {
      errorMessage.value = ""

      const exists =
        records.value.some(item => {
          return item.id === record.id
        })

      if (!exists) {
        records.value.unshift(record)
      }

      const reviewStore =
        useReviewStore()

      try {
        await reviewStore.addReviewTasks(
          record
        )
      } catch (error) {
        console.error(
          "创建复习任务失败：",
          error
        )
      }

      try {
        const {
          data: { user },
          error: userError
        } =
          await supabase.auth.getUser()

        if (userError || !user) {
          console.warn(
            "当前未登录，学习记录仅保存在本机"
          )

          return {
            success: true,
            cloudSynced: false,
            message:
              "学习记录已保存在本机"
          }
        }

        const { error } =
          await supabase
            .from("study_records")
            .upsert(
              {
                id: record.id,
                user_id: user.id,
                subject:
                  record.subject,
                chapter:
                  record.chapter,
                content:
                  record.content,
                duration:
                  record.duration,
                duration_text:
                  record.durationText,
                start_time:
                  record.startTime,
                end_time:
                  record.endTime,
                study_date:
                  record.date
              },
              {
                onConflict: "id"
              }
            )

        if (error) {
          console.error(
            "学习记录上传失败：",
            error
          )

          errorMessage.value =
            "学习记录已保存到本机，但云端同步失败"

          return {
            success: false,
            cloudSynced: false,
            message:
              errorMessage.value
          }
        }

        console.log(
          "学习记录已同步到 Supabase"
        )

        return {
          success: true,
          cloudSynced: true,
          message:
            "学习记录保存成功"
        }
      } catch (error) {
        console.error(
          "保存学习记录发生异常：",
          error
        )

        errorMessage.value =
          "学习记录已保存到本机，但云端同步异常"

        return {
          success: false,
          cloudSynced: false,
          message:
            errorMessage.value
        }
      }
    }

    async function deleteRecord(
      index: number
    ) {
      const record =
        records.value[index]

      if (!record) {
        return {
          success: false,
          message:
            "没有找到需要删除的学习记录"
        }
      }

      const oldRecord = {
        ...record
      }

      records.value.splice(index, 1)

      const reviewStore =
        useReviewStore()

      try {
        await reviewStore
          .deleteTasksByStudyRecordId(
            record.id
          )
      } catch (error) {
        console.error(
          "删除关联复习任务失败：",
          error
        )
      }

      try {
        const {
          data: { user }
        } =
          await supabase.auth.getUser()

        if (!user) {
          return {
            success: true,
            cloudSynced: false,
            message:
              "本地学习记录已删除"
          }
        }

        const { error } =
          await supabase
            .from("study_records")
            .delete()
            .eq("id", record.id)
            .eq("user_id", user.id)

        if (error) {
          console.error(
            "云端学习记录删除失败：",
            error
          )

          records.value.splice(
            index,
            0,
            oldRecord
          )

          errorMessage.value =
            "云端删除失败，已恢复本地记录"

          return {
            success: false,
            cloudSynced: false,
            message:
              errorMessage.value
          }
        }

        console.log(
          "学习记录及关联复习任务已删除"
        )

        return {
          success: true,
          cloudSynced: true,
          message:
            "学习记录删除成功"
        }
      } catch (error) {
        console.error(
          "删除学习记录发生异常：",
          error
        )

        records.value.splice(
          index,
          0,
          oldRecord
        )

        errorMessage.value =
          "删除学习记录失败"

        return {
          success: false,
          cloudSynced: false,
          message:
            errorMessage.value
        }
      }
    }

    async function updateRecord(
      record: StudyRecord
    ) {
      const index =
        records.value.findIndex(
          item => {
            return (
              item.id === record.id
            )
          }
        )

      if (index === -1) {
        return {
          success: false,
          message:
            "没有找到需要修改的学习记录"
        }
      }

      const oldRecord = {
        ...records.value[index]
      }

      records.value[index] = {
        ...record
      }

      try {
        const {
          data: { user }
        } =
          await supabase.auth.getUser()

        if (!user) {
          return {
            success: true,
            cloudSynced: false,
            message:
              "学习记录已在本机修改"
          }
        }

        const { error } =
          await supabase
            .from("study_records")
            .update({
              subject:
                record.subject,
              chapter:
                record.chapter,
              content:
                record.content,
              duration:
                record.duration,
              duration_text:
                record.durationText,
              start_time:
                record.startTime,
              end_time:
                record.endTime,
              study_date:
                record.date
            })
            .eq("id", record.id)
            .eq("user_id", user.id)

        if (error) {
          console.error(
            "云端学习记录修改失败：",
            error
          )

          records.value[index] =
            oldRecord

          errorMessage.value =
            "云端修改失败，已恢复原记录"

          return {
            success: false,
            cloudSynced: false,
            message:
              errorMessage.value
          }
        }

        console.log(
          "云端学习记录已更新"
        )

        return {
          success: true,
          cloudSynced: true,
          message:
            "学习记录修改成功"
        }
      } catch (error) {
        console.error(
          "修改学习记录发生异常：",
          error
        )

        records.value[index] =
          oldRecord

        errorMessage.value =
          "修改学习记录失败"

        return {
          success: false,
          cloudSynced: false,
          message:
            errorMessage.value
        }
      }
    }

    function clearRecords() {
      records.value = []
      errorMessage.value = ""
    }

    function clearError() {
      errorMessage.value = ""
    }

    return {
      records,
      sortedRecords,
      loading,
      initialized,
      errorMessage,

      totalRecords,
      totalSeconds,
      totalTimeText,
      totalStudyDays,

      studyDates,
      streakDays,
      longestStreak,

      todayRecords,
      todayTotalSeconds,
      todayTimeText,

      weekTotalSeconds,
      weekTimeText,
      monthTotalSeconds,
      monthTimeText,
      monthStudyDays,

      averageDailySeconds,
      averageDailyTimeText,
      average7DaySeconds,
      average7DayTimeText,

      last7Days,
      last30Days,
      last56Days,
      last365Days,

      subjectStats,
      activeSubjectStats,
      mostActiveSubject,
      bestStudyDay,

      sevenDayComparison,
      thirtyDayComparison,

      getDateText,
      getTodayText,
      formatDuration,
      getRecordsByDateRange,
      createDailyStats,
      createPeriodComparison,

      loadCloudRecords,
      addRecord,
      deleteRecord,
      updateRecord,
      clearRecords,
      clearError
    }
  }
)