<template>
  <div class="card">
    <h2>📚 今日待复习</h2>

    <div class="count">
      {{ todayTasks.length }}
    </div>

    <p>今天还有 {{ todayTasks.length }} 项复习任务</p>

    <RouterLink class="btn" to="/review">
      立即复习 →
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { RouterLink } from "vue-router"
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
.card {
  margin-top: 30px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,.08);
  text-align: center;
}

.count {
  font-size: 48px;
  font-weight: bold;
  color: #2e8b57;
  margin: 15px 0;
}

.btn {
  display: inline-block;
  margin-top: 15px;
  text-decoration: none;
  background: #2e8b57;
  color: white;
  padding: 10px 18px;
  border-radius: 8px;
}
</style>