<template>
  <div class="card">
    <h2>🔁 今日待复习</h2>

    <h1>{{ todayTasks.length }}</h1>

    <p>今天需要完成的复习任务</p>

    <RouterLink class="btn" to="/review">
      去复习 →
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { RouterLink } from "vue-router"
import { useReviewStore } from "../stores/review"

const reviewStore = useReviewStore()

function todayString() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

const todayTasks = computed(() => {
  return reviewStore.tasks.filter(task =>
    task.reviewDate === todayString() &&
    !task.done
  )
})
</script>

<style scoped>
.card{
  margin-top:30px;
  background:white;
  padding:20px;
  border-radius:12px;
  box-shadow:0 2px 8px rgba(0,0,0,.08);
  text-align:center;
}

h1{
  font-size:48px;
  color:#2e8b57;
  margin:15px 0;
}

.btn{
  display:inline-block;
  margin-top:15px;
  text-decoration:none;
  background:#2e8b57;
  color:white;
  padding:10px 20px;
  border-radius:8px;
}
</style>