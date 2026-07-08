<template>
  <div class="card">
    <h2>📚 学习计时器</h2>

    <label>学习科目</label>
    <select v-model="subject">
      <option>生理</option>
      <option>生化</option>
      <option>病理</option>
      <option>病生</option>
      <option>免疫</option>
    </select>

    <label>学习章节</label>
    <input
      v-model="chapter"
      placeholder="例如：神经系统"
    />

    <label>学习内容</label>
    <input
      v-model="content"
      placeholder="例如：动作电位"
    />

    <h1>{{ time }}</h1>

    <button v-if="!running" @click="startStudy">
      ▶ 开始学习
    </button>

    <button v-else @click="stopStudy">
      ■ 结束学习
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from "vue"
import type { StudyRecord } from "../types/study"

const emit = defineEmits<{
  (e: "finish", record: StudyRecord): void
}>()

const subject = ref("生理")
const chapter = ref("")
const content = ref("")

const running = ref(false)
const seconds = ref(0)
const time = ref("00:00:00")

const startTime = ref("")

let timer: number | null = null

function formatTime(totalSeconds: number) {
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0")
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0")
  const s = String(totalSeconds % 60).padStart(2, "0")

  return `${h}:${m}:${s}`
}

function getDateText(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function startStudy() {
  if (running.value) return

  running.value = true
  seconds.value = 0
  time.value = "00:00:00"
  startTime.value = new Date().toISOString()

  timer = window.setInterval(() => {
    seconds.value++
    time.value = formatTime(seconds.value)
  }, 1000)
}

function stopStudy() {
  running.value = false

  if (timer !== null) {
    clearInterval(timer)
    timer = null
  }

  const endDate = new Date()

  const record: StudyRecord = {
    id: String(Date.now()),
    subject: subject.value,
    chapter: chapter.value,
    content: content.value,
    duration: seconds.value,
    durationText: time.value,
    startTime: startTime.value,
    endTime: endDate.toISOString(),
    date: getDateText(endDate)
  }

  emit("finish", record)

  chapter.value = ""
  content.value = ""
  seconds.value = 0
  time.value = "00:00:00"
}

onUnmounted(() => {
  if (timer !== null) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
.card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,.08);
}

label {
  display: block;
  margin-top: 15px;
  font-weight: bold;
}

input,
select {
  width: 100%;
  padding: 10px;
  margin-top: 8px;
  box-sizing: border-box;
}

button {
  margin-top: 20px;
  width: 100%;
  padding: 12px;
  background: #2e8b57;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

h1 {
  text-align: center;
  margin-top: 20px;
}
</style>