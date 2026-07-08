<template>
  <div class="card">
    <h2>📚 今日学习记录</h2>

    <div v-if="records.length === 0">
      今天还没有学习记录
    </div>

    <div
      v-for="(item, index) in records"
      :key="item.id"
      class="record"
    >
      <div>
        <h3>{{ item.subject }} - {{ item.chapter || "未填写章节" }}</h3>
        <p>{{ item.content || "未填写学习内容" }}</p>
        <strong>{{ item.durationText }}</strong>
        <p class="date">{{ item.date }}</p>
      </div>

      <button @click="deleteRecord(index)">
        删除
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StudyRecord } from "../types/study"

defineProps<{
  records: StudyRecord[]
}>()

const emit = defineEmits<{
  (e: "delete", index: number): void
}>()

function deleteRecord(index: number) {
  emit("delete", index)
}
</script>

<style scoped>
.card {
  margin-top: 30px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,.08);
}

.record {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #eee;
}

.record:last-child {
  border-bottom: none;
}

.date {
  color: #888;
  font-size: 14px;
}

button {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
}
</style>