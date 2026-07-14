<template>
  <div class="login-page">
    <h2>Med703 Pro 登录</h2>

    <input
      v-model="email"
      placeholder="邮箱"
    />

    <input
      v-model="password"
      type="password"
      placeholder="密码"
    />

    <button @click="login">
      登录
    </button>

    <button @click="$router.push('/register')">
      注册账号
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useRouter } from "vue-router"
import { supabase } from "../lib/supabase"

const router = useRouter()

const email = ref("")
const password = ref("")

async function login() {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value
  })

  if (error) {
    alert(error.message)
    return
  }

  router.push("/")
}
</script>

<style scoped>
.login-page{
  max-width:400px;
  margin:80px auto;
  display:flex;
  flex-direction:column;
  gap:15px;
}

input{
  padding:12px;
  border-radius:8px;
}

button{
  padding:12px;
}
</style>