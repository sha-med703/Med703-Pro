import { defineStore } from "pinia"
import { computed, ref } from "vue"
import { supabase } from "../lib/supabase"

export type AiPlanStatus =
  | "active"
  | "completed"
  | "archived"

export interface AiPlan {
  id: string
  userId: string
  planDate: string
  title: string
  userRequest: string
  aiContent: string
  status: AiPlanStatus
  createdAt: string
  updatedAt: string
}

interface AiPlanRow {
  id: string
  user_id: string
  plan_date: string
  title: string
  user_request: string | null
  ai_content: string
  status: AiPlanStatus
  created_at: string
  updated_at: string
}

interface CreateAiPlanInput {
  planDate?: string
  title?: string
  userRequest?: string
  aiContent: string
}

export const useAiPlanStore = defineStore("ai-plan", () => {
  const plans = ref<AiPlan[]>([])
  const loading = ref(false)
  const initialized = ref(false)

  const activePlans = computed(() => {
    return plans.value.filter(plan => plan.status === "active")
  })

  const completedPlans = computed(() => {
    return plans.value.filter(
      plan => plan.status === "completed"
    )
  })

  const todayPlan = computed(() => {
    const today = getDateText(new Date())

    return plans.value.find(plan => {
      return (
        plan.planDate === today &&
        plan.status === "active"
      )
    })
  })

  function getDateText(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
  }

  function rowToAiPlan(row: AiPlanRow): AiPlan {
    return {
      id: row.id,
      userId: row.user_id,
      planDate: row.plan_date,
      title: row.title,
      userRequest: row.user_request ?? "",
      aiContent: row.ai_content,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  }

  function sortPlans() {
    plans.value.sort((a, b) => {
      const dateCompare = b.planDate.localeCompare(a.planDate)

      if (dateCompare !== 0) {
        return dateCompare
      }

      return b.createdAt.localeCompare(a.createdAt)
    })
  }

  async function loadPlans() {
    loading.value = true

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      loading.value = false
      initialized.value = true
      plans.value = []
      return
    }

    const { data, error } = await supabase
      .from("ai_plans")
      .select(`
        id,
        user_id,
        plan_date,
        title,
        user_request,
        ai_content,
        status,
        created_at,
        updated_at
      `)
      .order("plan_date", { ascending: false })
      .order("created_at", { ascending: false })

    loading.value = false
    initialized.value = true

    if (error) {
      console.error("读取 AI 学习计划失败：", error)
      return
    }

    plans.value = (data ?? []).map(row => {
      return rowToAiPlan(row as AiPlanRow)
    })

    sortPlans()

    console.log("AI 学习计划加载完成")
  }

  async function savePlan(input: CreateAiPlanInput) {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("保存 AI 计划失败：当前未登录")
      return {
        success: false,
        message: "请先登录账号"
      }
    }

    const planDate =
      input.planDate || getDateText(new Date())

    const { data, error } = await supabase
      .from("ai_plans")
      .insert({
        user_id: user.id,
        plan_date: planDate,
        title: input.title?.trim() || "AI 学习计划",
        user_request: input.userRequest?.trim() || "",
        ai_content: input.aiContent.trim(),
        status: "active"
      })
      .select(`
        id,
        user_id,
        plan_date,
        title,
        user_request,
        ai_content,
        status,
        created_at,
        updated_at
      `)
      .single()

    if (error) {
      console.error("保存 AI 学习计划失败：", error)

      return {
        success: false,
        message: error.message
      }
    }

    const newPlan = rowToAiPlan(data as AiPlanRow)

    plans.value.unshift(newPlan)
    sortPlans()

    console.log("AI 学习计划保存成功")

    return {
      success: true,
      plan: newPlan
    }
  }

  async function updatePlanContent(
    id: string,
    content: string
  ) {
    const plan = plans.value.find(item => item.id === id)

    if (!plan) {
      return {
        success: false,
        message: "没有找到该计划"
      }
    }

    const oldContent = plan.aiContent
    const oldUpdatedAt = plan.updatedAt

    plan.aiContent = content
    plan.updatedAt = new Date().toISOString()

    const { data, error } = await supabase
      .from("ai_plans")
      .update({
        ai_content: content,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select(`
        id,
        user_id,
        plan_date,
        title,
        user_request,
        ai_content,
        status,
        created_at,
        updated_at
      `)
      .single()

    if (error) {
      plan.aiContent = oldContent
      plan.updatedAt = oldUpdatedAt

      console.error("修改 AI 学习计划失败：", error)

      return {
        success: false,
        message: error.message
      }
    }

    const updatedPlan = rowToAiPlan(data as AiPlanRow)
    const index = plans.value.findIndex(item => item.id === id)

    if (index !== -1) {
      plans.value[index] = updatedPlan
    }

    return {
      success: true
    }
  }

  async function completePlan(id: string) {
    return updatePlanStatus(id, "completed")
  }

  async function archivePlan(id: string) {
    return updatePlanStatus(id, "archived")
  }

  async function activatePlan(id: string) {
    return updatePlanStatus(id, "active")
  }

  async function updatePlanStatus(
    id: string,
    status: AiPlanStatus
  ) {
    const plan = plans.value.find(item => item.id === id)

    if (!plan) {
      return {
        success: false,
        message: "没有找到该计划"
      }
    }

    const oldStatus = plan.status
    const oldUpdatedAt = plan.updatedAt

    plan.status = status
    plan.updatedAt = new Date().toISOString()

    const { data, error } = await supabase
      .from("ai_plans")
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select(`
        id,
        user_id,
        plan_date,
        title,
        user_request,
        ai_content,
        status,
        created_at,
        updated_at
      `)
      .single()

    if (error) {
      plan.status = oldStatus
      plan.updatedAt = oldUpdatedAt

      console.error("更新 AI 学习计划状态失败：", error)

      return {
        success: false,
        message: error.message
      }
    }

    const updatedPlan = rowToAiPlan(data as AiPlanRow)
    const index = plans.value.findIndex(item => item.id === id)

    if (index !== -1) {
      plans.value[index] = updatedPlan
    }

    sortPlans()

    return {
      success: true
    }
  }

  async function deletePlan(id: string) {
    const index = plans.value.findIndex(item => item.id === id)

    if (index === -1) {
      return {
        success: false,
        message: "没有找到该计划"
      }
    }

    const oldPlan = plans.value[index]

    plans.value.splice(index, 1)

    const { error } = await supabase
      .from("ai_plans")
      .delete()
      .eq("id", id)

    if (error) {
      plans.value.splice(index, 0, oldPlan)

      console.error("删除 AI 学习计划失败：", error)

      return {
        success: false,
        message: error.message
      }
    }

    console.log("AI 学习计划删除成功")

    return {
      success: true
    }
  }

  function clearPlans() {
    plans.value = []
    initialized.value = false
  }

  return {
    plans,
    loading,
    initialized,
    activePlans,
    completedPlans,
    todayPlan,
    loadPlans,
    savePlan,
    updatePlanContent,
    completePlan,
    archivePlan,
    activatePlan,
    deletePlan,
    clearPlans
  }
})