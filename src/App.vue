<template>
  <div class="app">
    <header class="header">
      <h1>🎓 Med703 Pro</h1>
      <p>703考研智能学习助手</p>

      <div v-if="authStore.loading" class="account-status">
        正在检查登录状态……
      </div>

      <div
        v-else-if="authStore.user"
        class="account-status logged-in"
      >
        <span>👤 {{ authStore.user.email }}</span>

        <el-button
          type="danger"
          plain
          size="small"
          @click="handleSignOut"
        >
          退出登录
        </el-button>
      </div>

      <div v-else class="account-status">
        <span>当前未登录，学习记录暂时保存在本机。</span>
      </div>
    </header>

    <nav class="nav">
      <RouterLink to="/">🏠 首页</RouterLink>
      <RouterLink to="/study">📚 学习</RouterLink>
      <RouterLink to="/review">🔁 复习</RouterLink>
      <RouterLink to="/report">📈 报告</RouterLink>
      <RouterLink to="/coach">🤖 AI 教练</RouterLink>

      <RouterLink to="/auth">
        {{ authStore.user ? "👤 账号" : "🔐 登录" }}
      </RouterLink>

      <RouterLink to="/settings">⚙ 设置</RouterLink>
    </nav>

    <main class="page">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from "vue"
import { RouterLink, RouterView, useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import { useAuthStore } from "./stores/auth"
import { useStudyStore } from "./stores/study"

const router = useRouter()
const authStore = useAuthStore()
const studyStore = useStudyStore()

onMounted(async () => {
  await authStore.initializeAuth()
})

watch(
  () => authStore.user?.id,
  async (userId, previousUserId) => {
    if (userId) {
      await studyStore.loadCloudRecords()
      return
    }

    if (previousUserId) {
      studyStore.clearRecords()
    }
  },
  { immediate: true }
)

async function handleSignOut() {
  const success = await authStore.signOut()

  if (!success) {
    ElMessage.error("退出登录失败，请稍后重试")
    return
  }

  studyStore.clearRecords()
  ElMessage.success("已退出登录")
  await router.push("/auth")
}
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
  margin: 0;
  font-size: 52px;
}

.header p {
  margin-top: 10px;
  color: #666;
  font-size: 22px;
}

.account-status {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  color: #666;
  font-size: 14px;
}

.logged-in {
  color: #2e8b57;
}

.nav {
  display: flex;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
  margin-bottom: 35px;
}

.nav a {
  padding: 12px 22px;
  border-radius: 12px;
  background: white;
  color: #2e8b57;
  text-decoration: none;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.nav a.router-link-active {
  background: #2e8b57;
  color: white;
}

.page {
  margin-top: 20px;
}

@media (max-width: 600px) {
  .app {
    padding: 14px;
  }

  .header h1 {
    font-size: 34px;
  }

  .header p {
    font-size: 17px;
  }

  .account-status {
    flex-direction: column;
  }

  .nav {
    gap: 8px;
  }

  .nav a {
    padding: 10px 13px;
    font-size: 14px;
  }
}
</style>