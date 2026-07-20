import { computed, ref } from "vue"
import { defineStore } from "pinia"
import type { StudyRecord } from "../types/study"
import { SUBJECTS } from "../constants/subjects"

interface SavedTimerState {
  subject: string
  chapter: string
  content: string
  running: boolean
  startedAt: string
  stoppedSeconds: number
}

const STORAGE_KEY = "med703-study-timer"

export const useStudyTimerStore = defineStore(
  "study-timer",
  () => {
    const subject = ref<string>(SUBJECTS[0] ?? "")
    const chapter = ref("")
    const content = ref("")

    const running = ref(false)
    const startedAt = ref("")
    const stoppedSeconds = ref(0)
    const currentTimestamp = ref(Date.now())

    let timer: number | null = null

    const elapsedSeconds = computed(() => {
      if (!running.value || !startedAt.value) {
        return stoppedSeconds.value
      }

      const startedTime = new Date(
        startedAt.value
      ).getTime()

      if (Number.isNaN(startedTime)) {
        return stoppedSeconds.value
      }

      const runningSeconds = Math.max(
        0,
        Math.floor(
          (currentTimestamp.value - startedTime) / 1000
        )
      )

      return stoppedSeconds.value + runningSeconds
    })

    const timeText = computed(() => {
      return formatDuration(elapsedSeconds.value)
    })

    function formatDuration(totalSeconds: number) {
      const safeSeconds = Math.max(
        0,
        Math.floor(totalSeconds || 0)
      )

      const hours = String(
        Math.floor(safeSeconds / 3600)
      ).padStart(2, "0")

      const minutes = String(
        Math.floor((safeSeconds % 3600) / 60)
      ).padStart(2, "0")

      const seconds = String(
        safeSeconds % 60
      ).padStart(2, "0")

      return `${hours}:${minutes}:${seconds}`
    }

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

    function saveState() {
      const state: SavedTimerState = {
        subject: subject.value,
        chapter: chapter.value,
        content: content.value,
        running: running.value,
        startedAt: startedAt.value,
        stoppedSeconds: stoppedSeconds.value
      }

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state)
      )
    }

    function loadState() {
      const saved = localStorage.getItem(
        STORAGE_KEY
      )

      if (!saved) {
        return
      }

      try {
        const state = JSON.parse(
          saved
        ) as Partial<SavedTimerState>

        if (
          typeof state.subject === "string" &&
          state.subject
        ) {
          subject.value = state.subject
        }

        if (typeof state.chapter === "string") {
          chapter.value = state.chapter
        }

        if (typeof state.content === "string") {
          content.value = state.content
        }

        if (typeof state.running === "boolean") {
          running.value = state.running
        }

        if (typeof state.startedAt === "string") {
          startedAt.value = state.startedAt
        }

        if (
          typeof state.stoppedSeconds === "number" &&
          Number.isFinite(state.stoppedSeconds)
        ) {
          stoppedSeconds.value = Math.max(
            0,
            Math.floor(state.stoppedSeconds)
          )
        }
      } catch (error) {
        console.error(
          "读取学习计时状态失败：",
          error
        )

        clearSavedState()
      }

      currentTimestamp.value = Date.now()

      if (
        running.value &&
        startedAt.value
      ) {
        startInterval()
      }
    }

    function startInterval() {
      stopInterval()

      currentTimestamp.value = Date.now()

      timer = window.setInterval(() => {
        currentTimestamp.value = Date.now()
      }, 1000)
    }

    function stopInterval() {
      if (timer !== null) {
        window.clearInterval(timer)
        timer = null
      }
    }

    function startStudy() {
      if (running.value) {
        return
      }

      running.value = true
      startedAt.value = new Date().toISOString()
      currentTimestamp.value = Date.now()

      startInterval()
      saveState()
    }

    function pauseStudy() {
      if (!running.value) {
        return
      }

      stoppedSeconds.value =
        elapsedSeconds.value

      running.value = false
      startedAt.value = ""

      stopInterval()
      saveState()
    }

    function resumeStudy() {
      if (running.value) {
        return
      }

      running.value = true
      startedAt.value = new Date().toISOString()
      currentTimestamp.value = Date.now()

      startInterval()
      saveState()
    }

    function finishStudy(): StudyRecord | null {
      const duration = elapsedSeconds.value

      if (duration <= 0) {
        return null
      }

      const endDate = new Date()

      const actualStartDate =
        calculateActualStartDate(
          endDate,
          duration
        )

      const record: StudyRecord = {
        id:
          typeof crypto !== "undefined" &&
          typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : String(Date.now()),
        subject: subject.value,
        chapter: chapter.value.trim(),
        content: content.value.trim(),
        duration,
        durationText: formatDuration(duration),
        startTime: actualStartDate.toISOString(),
        endTime: endDate.toISOString(),
        date: getDateText(endDate)
      }

      resetTimer()

      return record
    }

    function calculateActualStartDate(
      endDate: Date,
      duration: number
    ) {
      return new Date(
        endDate.getTime() - duration * 1000
      )
    }

    function resetTimer() {
      stopInterval()

      running.value = false
      startedAt.value = ""
      stoppedSeconds.value = 0
      currentTimestamp.value = Date.now()

      chapter.value = ""
      content.value = ""

      clearSavedState()
    }

    function updateSubject(value: string) {
      subject.value = value
      saveState()
    }

    function updateChapter(value: string) {
      chapter.value = value
      saveState()
    }

    function updateContent(value: string) {
      content.value = value
      saveState()
    }

    function clearSavedState() {
      localStorage.removeItem(STORAGE_KEY)
    }

    loadState()

    return {
      subject,
      chapter,
      content,
      running,
      elapsedSeconds,
      timeText,
      startStudy,
      pauseStudy,
      resumeStudy,
      finishStudy,
      resetTimer,
      updateSubject,
      updateChapter,
      updateContent
    }
  }
)