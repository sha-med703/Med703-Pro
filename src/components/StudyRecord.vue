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

      <div class="actions">
        <button class="edit" @click="openEdit(item)">
          编辑
        </button>

        <button class="delete" @click="deleteRecord(index)">
          删除
        </button>
      </div>
    </div>

    <EditRecordDialog
      v-if="editingRecord"
      :record="editingRecord"
      @cancel="editingRecord = null"
      @save="saveEdit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import type { StudyRecord } from "../types/study"
import EditRecordDialog from "./EditRecordDialog.vue"

defineProps<{
  records: StudyRecord[]
}>()

const emit = defineEmits<{
  (e: "delete", index: number): void
  (e: "edit", record: StudyRecord): void
}>()

const editingRecord = ref<StudyRecord | null>(null)

function openEdit(record: StudyRecord) {
  editingRecord.value = { ...record }
}

function saveEdit(record: StudyRecord) {
  emit("edit", record)
  editingRecord.value = null
}

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
  gap: 12px;
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

.actions {
  display: flex;
  gap: 8px;
}

button {
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
}

.edit {
  background: #2e8b57;
}

.delete {
  background: #e74c3c;
}
</style>