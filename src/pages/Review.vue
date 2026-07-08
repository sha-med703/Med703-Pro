<template>
  <div class="review-page">
    <h2>🔁 艾宾浩斯复习</h2>

    <div class="card">
      <h3>📚 今日待复习：{{ todayTasks.length }} 条</h3>

      <div v-if="todayTasks.length === 0">
        今天暂无复习任务
      </div>

      <div
        v-for="task in todayTasks"
        :key="task.id"
        class="task"
      >
        <div>
          <strong>{{ task.subject }} - {{ task.chapter }}</strong>
          <p>{{ task.content }}</p>
          <p>第 {{ task.round }} 轮复习</p>
        </div>

        <button @click="reviewStore.finishTask(task.id)">
          完成
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useReviewStore } from "../stores/review"

const reviewStore = useReviewStore()

function getToday() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const todayTasks = computed(() => {
  return reviewStore.tasks.filter(item => {
    return item.reviewDate === getToday() && !item.done
  })
})
</script>

<style scoped>
.review-page {
  margin-top: 20px;
}

.card {
  margin-top: 20px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,.08);
}

.task {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
  padding: 15px 0;
}

.task:last-child {
  border-bottom: none;
}

button {
  background: #2e8b57;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
}
</style>