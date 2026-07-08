<template>
  <div class="settings-page">
    <h2>⚙️ 设置</h2>

    <div class="card">
      <button @click="clearData">
        🗑 清空所有学习记录
      </button>

      <p class="tip">
        注意：此操作不可恢复。
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStudyStore } from "../stores/study"

const studyStore = useStudyStore()

function clearData() {
  if (confirm("确定要清空所有学习记录吗？")) {
    studyStore.records.length = 0
    localStorage.removeItem("study-records")
    alert("已清空学习记录。")
  }
}
</script>

<style scoped>
.settings-page {
  margin-top: 20px;
}

.card {
  margin-top: 20px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,.08);
}

button {
  background: #d9534f;
  color: white;
  border: none;
  padding: 12px 18px;
  border-radius: 8px;
  cursor: pointer;
}

.tip {
  margin-top: 15px;
  color: #888;
}
</style>