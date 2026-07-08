<template>
  <div class="card">
    <h2>🔍 搜索与筛选</h2>

    <input
      :value="keyword"
      placeholder="搜索章节或学习内容"
      @input="handleKeyword"
    />

    <select
      :value="subject"
      @change="handleSubject"
    >
      <option value="全部">全部科目</option>

      <option
        v-for="item in SUBJECTS"
        :key="item"
        :value="item"
      >
        {{ item }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { SUBJECTS } from "../constants/subjects"

defineProps<{
  keyword: string
  subject: string
}>()

const emit = defineEmits<{
  (e: "update:keyword", value: string): void
  (e: "update:subject", value: string): void
}>()

function handleKeyword(event: Event) {
  const target = event.target as HTMLInputElement
  emit("update:keyword", target.value)
}

function handleSubject(event: Event) {
  const target = event.target as HTMLSelectElement
  emit("update:subject", target.value)
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

input,
select {
  width: 100%;
  margin-top: 12px;
  padding: 10px;
  box-sizing: border-box;
}
</style>