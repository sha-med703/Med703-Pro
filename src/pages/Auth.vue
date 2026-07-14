<template>
  <div class="auth-page">
    <el-card class="auth-card">
      <template #header>
        <strong>🔐 Med703 Pro 账号</strong>
      </template>

      <el-alert
        v-if="message"
        :title="message"
        :type="messageType"
        show-icon
        :closable="false"
        class="message"
      />

      <el-form label-position="top">
        <el-form-item label="邮箱">
          <el-input
            v-model="email"
            type="email"
            placeholder="请输入邮箱"
            :disabled="loading"
          />
        </el-form-item>

        <el-form-item label="密码">
          <el-input
            v-model="password"
            type="password"
            placeholder="至少输入 6 位密码"
            show-password
            :disabled="loading"
            @keyup.enter="login"
          />
        </el-form-item>

        <div class="actions">
          <el-button
            type="primary"
            :loading="loading"
            @click="login"
          >
            登录
          </el-button>

          <el-button
            :loading="loading"
            @click="register"
          >
            注册
          </el-button>
        </div>
      </el-form>

      <p class="tip">
        注册后可能需要前往邮箱点击确认链接。
      </p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useRouter } from "vue-router"
import { supabase } from "../lib/supabase"

const router = useRouter()

const email = ref("")
const password = ref("")
const loading = ref(false)
const message = ref("")
const messageType = ref<"success" | "error" | "warning" | "info">("info")

function validateForm() {
  message.value = ""

  if (!email.value.trim()) {
    message.value = "请输入邮箱。"
    messageType.value = "warning"
    return false
  }

  if (password.value.length < 6) {
    message.value = "密码至少需要 6 位。"
    messageType.value = "warning"
    return false
  }

  return true
}

async function register() {
  if (!validateForm()) return

  loading.value = true
  message.value = ""

  const { data, error } = await supabase.auth.signUp({
    email: email.value.trim(),
    password: password.value
  })

  loading.value = false

  if (error) {
    message.value = `注册失败：${error.message}`
    messageType.value = "error"
    return
  }

  if (data.session) {
    message.value = "注册并登录成功。"
    messageType.value = "success"
    await router.push("/")
  } else {
    message.value = "注册成功，请前往邮箱完成验证后再登录。"
    messageType.value = "success"
  }
}

async function login() {
  if (!validateForm()) return

  loading.value = true
  message.value = ""

  const { error } = await supabase.auth.signInWithPassword({
    email: email.value.trim(),
    password: password.value
  })

  loading.value = false

  if (error) {
    message.value = `登录失败：${error.message}`
    messageType.value = "error"
    return
  }

  message.value = "登录成功。"
  messageType.value = "success"

  await router.push("/")
}
</script>

<style scoped>
.auth-page {
  display: flex;
  justify-content: center;
  padding-top: 40px;
}

.auth-card {
  width: 100%;
  max-width: 480px;
}

.message {
  margin-bottom: 20px;
}

.actions {
  display: flex;
  gap: 12px;
}

.actions .el-button {
  flex: 1;
}

.tip {
  margin-top: 18px;
  color: #888;
  font-size: 14px;
}
</style>