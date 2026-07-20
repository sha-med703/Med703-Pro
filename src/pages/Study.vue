<template>
  <div class="study-page">
    <h2>📚 学习中心</h2>

    <StudyTimer
      @finish="studyStore.addRecord"
    />

    <PomodoroTimer />

    <SearchBar
      v-model:keyword="keyword"
      v-model:subject="subject"
    />

    <StudyRecord
      :records="filteredRecords"
      @delete="studyStore.deleteRecord"
      @edit="studyStore.updateRecord"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import StudyTimer from "../components/StudyTimer.vue"
import PomodoroTimer from "../components/PomodoroTimer.vue"
import StudyRecord from "../components/StudyRecord.vue"
import SearchBar from "../components/SearchBar.vue"
import { useStudyStore } from "../stores/study"

const studyStore = useStudyStore()

const keyword = ref("")
const subject = ref("全部")

const filteredRecords = computed(() => {
  return studyStore.records.filter(item => {
    const matchSubject =
      subject.value === "全部" ||
      item.subject === subject.value

    const text =
      `${item.chapter ?? ""} ${item.content ?? ""}`

    const matchKeyword =
      keyword.value.trim() === "" ||
      text.includes(keyword.value.trim())

    return matchSubject && matchKeyword
  })
})
</script>

<style scoped>
.study-page {
  margin-top: 20px;
}

.study-page > * + * {
  margin-top: 20px;
}
</style>