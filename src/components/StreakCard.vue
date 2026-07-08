<template>
  <div class="card">
    <h2>🔥 连续学习</h2>

    <div class="days">
      {{ days }}
    </div>

    <p>已连续学习 {{ days }} 天</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  days: number
}>()
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

.days {
  font-size: 48px;
  font-weight: bold;
  color: #e67e22;
  margin: 15px 0;
}
</style>