<template>
  <div class="card">
    <div class="card-header">
      <div>
        <h2>📚 学习计时器</h2>

        <p v-if="timerStore.running" class="running-tip">
          🟢 正在学习中，切换页面或刷新后仍会继续计时
        </p>

        <p
          v-else-if="timerStore.elapsedSeconds > 0"
          class="paused-tip"
        >
          ⏸ 当前计时已暂停，可以继续或结束学习
        </p>
      </div>

      <el-tag
        v-if="timerStore.running"
        type="success"
        effect="dark"
      >
        计时中
      </el-tag>

      <el-tag
        v-else-if="timerStore.elapsedSeconds > 0"
        type="warning"
        effect="light"
      >
        已暂停
      </el-tag>
    </div>

    <label>学习科目</label>

    <select
      v-model="subjectModel"
      :disabled="timerStore.running"
    >
      <option
        v-for="item in SUBJECTS"
        :key="item"
        :value="item"
      >
        {{ item }}
      </option>
    </select>

    <label>学习章节</label>

    <input
      v-model="chapterModel"
      :disabled="timerStore.running"
      placeholder="例如：神经系统 / 阅读理解 / 马原"
    />

    <label>学习内容</label>

    <input
      v-model="contentModel"
      :disabled="timerStore.running"
      placeholder="例如：动作电位 / 长难句 / 唯物辩证法"
    />

    <div class="timer-display">
      <span class="timer-label">
        当前学习时长
      </span>

      <h1>{{ timerStore.timeText }}</h1>
    </div>

    <div class="button-group">
      <button
        v-if="
          !timerStore.running &&
          timerStore.elapsedSeconds === 0
        "
        class="primary-button"
        @click="startStudy"
      >
        ▶ 开始学习
      </button>

      <template v-else-if="timerStore.running">
        <button
          class="warning-button"
          @click="timerStore.pauseStudy"
        >
          ⏸ 暂停
        </button>

        <button
          class="danger-button"
          @click="finishStudy"
        >
          ■ 结束学习
        </button>
      </template>

      <template v-else>
        <button
          class="primary-button"
          @click="timerStore.resumeStudy"
        >
          ▶ 继续学习
        </button>

        <button
          class="danger-button"
          @click="finishStudy"
        >
          ■ 结束并保存
        </button>

        <button
          class="secondary-button"
          @click="confirmReset"
        >
          清空本次计时
        </button>
      </template>
    </div>

    <div
      v-if="
        timerStore.running ||
        timerStore.elapsedSeconds > 0
      "
      class="current-task"
    >
      <strong>当前任务</strong>

      <p>
        科目：{{ timerStore.subject || "未选择" }}
      </p>

      <p>
        章节：{{ timerStore.chapter || "未填写" }}
      </p>

      <p>
        内容：{{ timerStore.content || "未填写" }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import {
  ElMessage,
  ElMessageBox
} from "element-plus"
import type { StudyRecord } from "../types/study"
import { SUBJECTS } from "../constants/subjects"
import { useStudyTimerStore } from "../stores/studyTimer"

const emit = defineEmits<{
  (event: "finish", record: StudyRecord): void
}>()

const timerStore = useStudyTimerStore()

const subjectModel = computed({
  get() {
    return timerStore.subject
  },
  set(value: string) {
    timerStore.updateSubject(value)
  }
})

const chapterModel = computed({
  get() {
    return timerStore.chapter
  },
  set(value: string) {
    timerStore.updateChapter(value)
  }
})

const contentModel = computed({
  get() {
    return timerStore.content
  },
  set(value: string) {
    timerStore.updateContent(value)
  }
})

function startStudy() {
  if (!timerStore.subject) {
    ElMessage.warning("请先选择学习科目")
    return
  }

  timerStore.startStudy()
  ElMessage.success("学习计时已开始")
}

function finishStudy() {
  const record = timerStore.finishStudy()

  if (!record) {
    ElMessage.warning("当前没有可保存的学习时长")
    return
  }

  emit("finish", record)

  ElMessage.success(
    `学习记录已保存，本次学习 ${record.durationText}`
  )
}

async function confirmReset() {
  try {
    await ElMessageBox.confirm(
      "确定清空当前尚未保存的学习计时吗？清空后无法恢复。",
      "清空计时",
      {
        type: "warning",
        confirmButtonText: "确定清空",
        cancelButtonText: "取消"
      }
    )
  } catch {
    return
  }

  timerStore.resetTimer()
  ElMessage.success("当前计时已清空")
}
</script>

<style scoped>
.card {
  padding: 20px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.card-header h2 {
  margin: 0;
}

.running-tip,
.paused-tip {
  margin: 8px 0 0;
  font-size: 13px;
}

.running-tip {
  color: #2e8b57;
}

.paused-tip {
  color: #b88230;
}

label {
  display: block;
  margin-top: 15px;
  font-weight: bold;
}

input,
select {
  box-sizing: border-box;
  width: 100%;
  margin-top: 8px;
  padding: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: white;
  font-size: 14px;
}

input:disabled,
select:disabled {
  background: #f5f7fa;
  color: #777;
  cursor: not-allowed;
}

.timer-display {
  margin-top: 22px;
  padding: 20px;
  border: 1px solid #d8efe1;
  border-radius: 12px;
  background: #f6fbf8;
  text-align: center;
}

.timer-label {
  color: #777;
  font-size: 14px;
}

h1 {
  margin: 10px 0 0;
  color: #2e8b57;
  font-size: 48px;
  font-variant-numeric: tabular-nums;
}

.button-group {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

button {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
}

.primary-button {
  background: #2e8b57;
}

.warning-button {
  background: #e6a23c;
}

.danger-button {
  background: #f56c6c;
}

.secondary-button {
  background: #909399;
}

button:hover {
  opacity: 0.9;
}

.current-task {
  margin-top: 18px;
  padding: 14px;
  border-radius: 10px;
  background: #f7f8f8;
}

.current-task strong {
  color: #333;
}

.current-task p {
  margin: 8px 0 0;
  color: #666;
  line-height: 1.5;
}

@media (max-width: 600px) {
  .card-header {
    flex-direction: column;
  }

  .button-group {
    flex-direction: column;
  }

  button {
    width: 100%;
  }

  h1 {
    font-size: 40px;
  }
}
</style>