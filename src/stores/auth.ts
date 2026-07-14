import { defineStore } from "pinia"
import { ref } from "vue"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "../lib/supabase"

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(true)

  async function initializeAuth() {
    loading.value = true

    const {
      data: { session: currentSession },
      error
    } = await supabase.auth.getSession()

    if (error) {
      console.error("获取登录状态失败：", error.message)
    }

    session.value = currentSession
    user.value = currentSession?.user ?? null
    loading.value = false

    supabase.auth.onAuthStateChange((_event, newSession) => {
      session.value = newSession
      user.value = newSession?.user ?? null
    })
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("退出登录失败：", error.message)
      return false
    }

    user.value = null
    session.value = null
    return true
  }

  return {
    user,
    session,
    loading,
    initializeAuth,
    signOut
  }
})