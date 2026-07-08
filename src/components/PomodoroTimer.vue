<template>
  <div class="card">
    <h2>🍅 番茄钟</h2>

    <div class="mode-list">
      <button @click="setMode(25, 5)">25 / 5</button>
      <button @click="setMode(50, 10)">50 / 10</button>
      <button @click="setMode(90, 20)">90 / 20</button>
    </div>

    <p class="mode">
      当前模式：学习 {{ studyMinutes }} 分钟 / 休息 {{ restMinutes }} 分钟
    </p>

    <div class="time">
      {{ timeText }}
    </div>

    <button v-if="!running" @click="startPomodoro">
      ▶ 开始番茄钟
    </button>

    <button v-else @click="stopPomodoro">
      ■ 停止番茄钟
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from "vue"

const studyMinutes = ref(25)
const restMinutes = ref(5)
const secondsLeft = ref(25 * 60)
const running = ref(false)

let timer: number | null = null

const timeText = computed(() => {
  const m = String(Math.floor(secondsLeft.value / 60)).padStart(2, "0")
  const s = String(secondsLeft.value % 60).padStart(2, "0")
  return `${m}:${s}`
})

function setMode(study: number, rest: number) {
  if (running.value) return

  studyMinutes.value = study
  restMinutes.value = rest
  secondsLeft.value = study * 60
}

function startPomodoro() {
  if (running.value) return

  running.value = true

  timer = window.setInterval(() => {
    if (secondsLeft.value > 0) {
      secondsLeft.value--
    } else {
      stopPomodoro()
      alert("学习时间结束，该休息啦！")
    }
  }, 1000)
}

function stopPomodoro() {
  running.value = false

  if (timer !== null) {
    clearInterval(timer)
    timer = null
  }
}

onUnmounted(() => {
  if (timer !== null) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
.card {
  margin-top: 30px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,.08);
}

.mode-list {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.mode {
  color: #666;
}

.time {
  font-size: 48px;
  text-align: center;
  font-weight: bold;
  color: #2e8b57;
  margin: 20px 0;
}

button {
  padding: 10px 14px;
  border: none;
  border-radius: 8px;
  background: #2e8b57;
  color: white;
  cursor: pointer;
}
</style>