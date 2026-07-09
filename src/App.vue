<template>
  <div class="app">
    <header class="header">
      <h1>🎓 Med703 Pro</h1>
      <p>703考研智能学习助手</p>
    </header>

    <nav class="nav">
      <RouterLink to="/">🏠 首页</RouterLink>
      <RouterLink to="/study">📚 学习</RouterLink>
      <RouterLink to="/review">🔁 复习</RouterLink>
      <RouterLink to="/report">📈 报告</RouterLink>
      <RouterLink to="/coach">🤖 AI 教练</RouterLink>
      <RouterLink to="/settings">⚙ 设置</RouterLink>
    </nav>

    <main class="page">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router"
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.app {
  max-width: 960px;
  margin: auto;
  padding: 24px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  font-size: 52px;
  margin: 0;
}

.header p {
  color: #666;
  font-size: 22px;
  margin-top: 10px;
}

.nav {
  display: flex;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
  margin-bottom: 35px;
}

.nav a {
  text-decoration: none;
  padding: 12px 22px;
  border-radius: 12px;
  background: white;
  color: #2e8b57;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0,0,0,.08);
}

.nav a.router-link-active {
  background: #2e8b57;
  color: white;
}

.page {
  margin-top: 20px;
}
</style>