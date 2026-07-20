import { computed, ref } from "vue"
import { defineStore } from "pinia"
import { supabase } from "../lib/supabase"

export type AiMemoryType =
  | "study_preference"
  | "weak_subject"
  | "study_schedule"
  | "learning_goal"
  | "personal_note"

export type AiMemorySource =
  | "manual"
  | "ai_chat"
  | "study_analysis"
  | "ai_plan"

export interface AiMemory {
  id: string
  userId: string
  memoryType: AiMemoryType
  title: string
  content: string
  importance: number
  source: AiMemorySource
  active: boolean
  createdAt: string
  updatedAt: string
}

interface AiMemoryRow {
  id: string
  user_id: string
  memory_type: AiMemoryType
  title: string
  content: string
  importance: number
  source: AiMemorySource
  active: boolean
  created_at: string
  updated_at: string
}

interface CreateMemoryInput {
  memoryType: AiMemoryType
  title: string
  content: string
  importance?: number
  source?: AiMemorySource
}

interface UpdateMemoryInput {
  memoryType?: AiMemoryType
  title?: string
  content?: string
  importance?: number
  source?: AiMemorySource
  active?: boolean
}

export const useAiMemoryStore = defineStore(
  "ai-memory",
  () => {
    const memories = ref<AiMemory[]>([])
    const loading = ref(false)
    const saving = ref(false)
    const initialized = ref(false)
    const errorMessage = ref("")

    const activeMemories = computed(() => {
      return memories.value
        .filter(memory => memory.active)
        .sort((a, b) => {
          if (b.importance !== a.importance) {
            return b.importance - a.importance
          }

          return b.updatedAt.localeCompare(a.updatedAt)
        })
    })

    const inactiveMemories = computed(() => {
      return memories.value
        .filter(memory => !memory.active)
        .sort((a, b) => {
          return b.updatedAt.localeCompare(a.updatedAt)
        })
    })

    const importantMemories = computed(() => {
      return activeMemories.value.filter(memory => {
        return memory.importance >= 4
      })
    })

    const memoriesByType = computed(() => {
      const result: Record<
        AiMemoryType,
        AiMemory[]
      > = {
        study_preference: [],
        weak_subject: [],
        study_schedule: [],
        learning_goal: [],
        personal_note: []
      }

      for (const memory of activeMemories.value) {
        result[memory.memoryType].push(memory)
      }

      return result
    })

    const memorySummary = computed(() => {
      if (activeMemories.value.length === 0) {
        return "暂无长期记忆"
      }

      return activeMemories.value
        .slice(0, 20)
        .map(memory => {
          return (
            `- [${getMemoryTypeText(memory.memoryType)}] ` +
            `${memory.title}：${memory.content}` +
            `（重要度 ${memory.importance}/5）`
          )
        })
        .join("\n")
    })

    function rowToMemory(
      row: AiMemoryRow
    ): AiMemory {
      return {
        id: row.id,
        userId: row.user_id,
        memoryType: row.memory_type,
        title: row.title,
        content: row.content,
        importance: row.importance,
        source: row.source,
        active: row.active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    }

    function normalizeImportance(value: number) {
      if (!Number.isFinite(value)) {
        return 3
      }

      return Math.min(
        5,
        Math.max(1, Math.round(value))
      )
    }

    function sortMemories() {
      memories.value.sort((a, b) => {
        if (a.active !== b.active) {
          return a.active ? -1 : 1
        }

        if (b.importance !== a.importance) {
          return b.importance - a.importance
        }

        return b.updatedAt.localeCompare(a.updatedAt)
      })
    }

    async function loadMemories() {
      loading.value = true
      errorMessage.value = ""

      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser()

      if (userError || !user) {
        memories.value = []
        loading.value = false
        initialized.value = true
        return
      }

      const { data, error } = await supabase
        .from("ai_memories")
        .select(`
          id,
          user_id,
          memory_type,
          title,
          content,
          importance,
          source,
          active,
          created_at,
          updated_at
        `)
        .order("active", {
          ascending: false
        })
        .order("importance", {
          ascending: false
        })
        .order("updated_at", {
          ascending: false
        })

      loading.value = false
      initialized.value = true

      if (error) {
        console.error(
          "读取 AI 长期记忆失败：",
          error
        )

        errorMessage.value = error.message
        return
      }

      memories.value = (data ?? []).map(row => {
        return rowToMemory(row as AiMemoryRow)
      })

      sortMemories()

      console.log("AI 长期记忆加载完成")
    }

    async function addMemory(
      input: CreateMemoryInput
    ) {
      const title = input.title.trim()
      const content = input.content.trim()

      if (!title) {
        return {
          success: false,
          message: "记忆标题不能为空"
        }
      }

      if (!content) {
        return {
          success: false,
          message: "记忆内容不能为空"
        }
      }

      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser()

      if (userError || !user) {
        return {
          success: false,
          message: "请先登录账号"
        }
      }

      saving.value = true
      errorMessage.value = ""

      const { data, error } = await supabase
        .from("ai_memories")
        .insert({
          user_id: user.id,
          memory_type: input.memoryType,
          title,
          content,
          importance: normalizeImportance(
            input.importance ?? 3
          ),
          source: input.source ?? "manual",
          active: true
        })
        .select(`
          id,
          user_id,
          memory_type,
          title,
          content,
          importance,
          source,
          active,
          created_at,
          updated_at
        `)
        .single()

      saving.value = false

      if (error) {
        console.error(
          "新增 AI 长期记忆失败：",
          error
        )

        errorMessage.value = error.message

        return {
          success: false,
          message: error.message
        }
      }

      const newMemory = rowToMemory(
        data as AiMemoryRow
      )

      memories.value.push(newMemory)
      sortMemories()

      console.log("AI 长期记忆新增成功")

      return {
        success: true,
        memory: newMemory
      }
    }

    async function updateMemory(
      id: string,
      input: UpdateMemoryInput
    ) {
      const memory = memories.value.find(item => {
        return item.id === id
      })

      if (!memory) {
        return {
          success: false,
          message: "没有找到该记忆"
        }
      }

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      }

      if (input.memoryType) {
        updateData.memory_type = input.memoryType
      }

      if (typeof input.title === "string") {
        const title = input.title.trim()

        if (!title) {
          return {
            success: false,
            message: "记忆标题不能为空"
          }
        }

        updateData.title = title
      }

      if (typeof input.content === "string") {
        const content = input.content.trim()

        if (!content) {
          return {
            success: false,
            message: "记忆内容不能为空"
          }
        }

        updateData.content = content
      }

      if (typeof input.importance === "number") {
        updateData.importance =
          normalizeImportance(input.importance)
      }

      if (input.source) {
        updateData.source = input.source
      }

      if (typeof input.active === "boolean") {
        updateData.active = input.active
      }

      saving.value = true
      errorMessage.value = ""

      const { data, error } = await supabase
        .from("ai_memories")
        .update(updateData)
        .eq("id", id)
        .select(`
          id,
          user_id,
          memory_type,
          title,
          content,
          importance,
          source,
          active,
          created_at,
          updated_at
        `)
        .single()

      saving.value = false

      if (error) {
        console.error(
          "修改 AI 长期记忆失败：",
          error
        )

        errorMessage.value = error.message

        return {
          success: false,
          message: error.message
        }
      }

      const updatedMemory = rowToMemory(
        data as AiMemoryRow
      )

      const index = memories.value.findIndex(item => {
        return item.id === id
      })

      if (index !== -1) {
        memories.value[index] = updatedMemory
      }

      sortMemories()

      console.log("AI 长期记忆修改成功")

      return {
        success: true,
        memory: updatedMemory
      }
    }

    async function activateMemory(id: string) {
      return updateMemory(id, {
        active: true
      })
    }

    async function deactivateMemory(id: string) {
      return updateMemory(id, {
        active: false
      })
    }

    async function deleteMemory(id: string) {
      const index = memories.value.findIndex(item => {
        return item.id === id
      })

      if (index === -1) {
        return {
          success: false,
          message: "没有找到该记忆"
        }
      }

      const oldMemory = memories.value[index]

      memories.value.splice(index, 1)

      const { error } = await supabase
        .from("ai_memories")
        .delete()
        .eq("id", id)

      if (error) {
        memories.value.splice(index, 0, oldMemory)

        console.error(
          "删除 AI 长期记忆失败：",
          error
        )

        errorMessage.value = error.message

        return {
          success: false,
          message: error.message
        }
      }

      console.log("AI 长期记忆删除成功")

      return {
        success: true
      }
    }

    async function findSimilarMemory(
      memoryType: AiMemoryType,
      content: string
    ) {
      const normalizedContent = content
        .trim()
        .toLowerCase()

      return memories.value.find(memory => {
        return (
          memory.memoryType === memoryType &&
          memory.content.trim().toLowerCase() ===
            normalizedContent
        )
      })
    }

    async function addOrUpdateMemory(
      input: CreateMemoryInput
    ) {
      const existingMemory =
        await findSimilarMemory(
          input.memoryType,
          input.content
        )

      if (existingMemory) {
        return updateMemory(existingMemory.id, {
          title: input.title,
          content: input.content,
          importance:
            input.importance ??
            existingMemory.importance,
          source:
            input.source ??
            existingMemory.source,
          active: true
        })
      }

      return addMemory(input)
    }

    function getMemoryTypeText(
      type: AiMemoryType
    ) {
      if (type === "study_preference") {
        return "学习偏好"
      }

      if (type === "weak_subject") {
        return "薄弱科目"
      }

      if (type === "study_schedule") {
        return "学习时间"
      }

      if (type === "learning_goal") {
        return "学习目标"
      }

      return "个人备注"
    }

    function getSourceText(
      source: AiMemorySource
    ) {
      if (source === "ai_chat") {
        return "AI 对话"
      }

      if (source === "study_analysis") {
        return "学习分析"
      }

      if (source === "ai_plan") {
        return "AI 计划"
      }

      return "手动添加"
    }

    function clearMemoryState() {
      memories.value = []
      loading.value = false
      saving.value = false
      initialized.value = false
      errorMessage.value = ""
    }

    return {
      memories,
      loading,
      saving,
      initialized,
      errorMessage,
      activeMemories,
      inactiveMemories,
      importantMemories,
      memoriesByType,
      memorySummary,
      loadMemories,
      addMemory,
      updateMemory,
      addOrUpdateMemory,
      activateMemory,
      deactivateMemory,
      deleteMemory,
      getMemoryTypeText,
      getSourceText,
      clearMemoryState
    }
  }
)