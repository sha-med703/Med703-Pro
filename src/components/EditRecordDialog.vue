<template>
  <div class="mask">
    <div class="dialog">
      <h2>✏️ 编辑学习记录</h2>

      <label>科目</label>
      <select v-model="form.subject">
        <option>生理</option>
        <option>生化</option>
        <option>病理</option>
        <option>病生</option>
        <option>免疫</option>
      </select>

      <label>章节</label>
      <input v-model="form.chapter" />

      <label>学习内容</label>
      <input v-model="form.content" />

      <div class="actions">
        <button class="cancel" @click="$emit('cancel')">
          取消
        </button>

        <button class="save" @click="save">
          保存修改
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from "vue"
import type { StudyRecord } from "../types/study"

const props = defineProps<{
  record: StudyRecord
}>()

const emit = defineEmits<{
  (e: "cancel"): void
  (e: "save", record: StudyRecord): void
}>()

const form = reactive<StudyRecord>({
  ...props.record
})

watch(
  () => props.record,
  (newRecord) => {
    Object.assign(form, newRecord)
  }
)

function save() {
  emit("save", { ...form })
}
</script>

<style scoped>
.mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.dialog {
  width: 420px;
  background: white;
  padding: 24px;
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(0,0,0,.2);
}

label {
  display: block;
  margin-top: 14px;
  font-weight: bold;
}

input,
select {
  width: 100%;
  margin-top: 6px;
  padding: 10px;
  box-sizing: border-box;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
}

button {
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
}

.cancel {
  background: #ddd;
}

.save {
  background: #2e8b57;
  color: white;
}
</style>