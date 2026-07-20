import { computed, ref } from "vue"
import { defineStore } from "pinia"
import { supabase } from "../lib/supabase"

import type {
  ChatMessage,
  ChatMessageRow,
  DeepSeekMessage
} from "../types/chat"

import {
  useAiMemoryStore,
  type AiMemoryType
} from "./aimemory"

export type AiChatMode =
  | "plan"
  | "analysis"
  | "question"

interface AiMessageRow extends ChatMessageRow {
  user_id: string
  mode: AiChatMode
}

interface ConversationItem {
  id: string
  title: string
  mode: AiChatMode
  lastMessage: string
  updatedAt: string
  messageCount: number
}

interface ExtractedMemory {
  memoryType: AiMemoryType
  title: string
  content: string
  importance: number
}

interface CoachFunctionResponse {
  answer?: string
  error?: string
  model?: string
  usage?: unknown
  memories?: ExtractedMemory[]
}

interface SendMessageOptions {
  content: string
  mode?: AiChatMode
  studySummary?: string
  preferences?: string
}

interface MemorySaveSummary {
  savedCount: number
  failedCount: number
}

interface AiChatActionResult {
  success: boolean
  message?: string
  answer?: string
  chatMessage?: ChatMessage
  conversationId?: string
  memorySavedCount?: number
  memoryFailedCount?: number
}

export const useAiChatStore = defineStore(
  "ai-chat",
  () => {
    const messages = ref<ChatMessage[]>([])
    const currentConversationId = ref("")
    const currentMode = ref<AiChatMode>("plan")

    const loading = ref(false)
    const sending = ref(false)
    const initialized = ref(false)
    const errorMessage = ref("")

    const lastMemorySavedCount = ref(0)

    const currentMessages = computed(() => {
      if (!currentConversationId.value) {
        return []
      }

      return messages.value
        .filter(message => {
          return (
            message.conversationId ===
            currentConversationId.value
          )
        })
        .sort((a, b) => {
          return a.createdAt.localeCompare(
            b.createdAt
          )
        })
    })

    const conversations =
      computed<ConversationItem[]>(() => {
        const conversationMap = new Map<
          string,
          ChatMessage[]
        >()

        for (const message of messages.value) {
          const current =
            conversationMap.get(
              message.conversationId
            ) ?? []

          current.push(message)

          conversationMap.set(
            message.conversationId,
            current
          )
        }

        const result: ConversationItem[] = []

        for (const [
          conversationId,
          conversationMessages
        ] of conversationMap.entries()) {
          const sortedMessages = [
            ...conversationMessages
          ].sort((a, b) => {
            return a.createdAt.localeCompare(
              b.createdAt
            )
          })

          const firstUserMessage =
            sortedMessages.find(message => {
              return message.role === "user"
            })

          const lastMessage =
            sortedMessages[
              sortedMessages.length - 1
            ]

          result.push({
            id: conversationId,
            title: createConversationTitle(
              firstUserMessage?.content ??
                "新对话"
            ),
            mode: getConversationMode(
              conversationId
            ),
            lastMessage:
              lastMessage?.content ?? "",
            updatedAt:
              lastMessage?.createdAt ?? "",
            messageCount:
              sortedMessages.length
          })
        }

        return result.sort((a, b) => {
          return b.updatedAt.localeCompare(
            a.updatedAt
          )
        })
      })

    function rowToChatMessage(
      row: AiMessageRow
    ): ChatMessage {
      return {
        id: row.id,
        conversationId:
          row.conversation_id,
        role: row.role,
        content: row.content,
        createdAt: row.created_at
      }
    }

    function createConversationTitle(
      content: string
    ) {
      const cleaned = content
        .replace(/\s+/g, " ")
        .trim()

      if (!cleaned) {
        return "新对话"
      }

      if (cleaned.length <= 22) {
        return cleaned
      }

      return `${cleaned.slice(0, 22)}…`
    }

    function getConversationMode(
      conversationId: string
    ): AiChatMode {
      const storedMode =
        localStorage.getItem(
          `ai-chat-mode-${conversationId}`
        )

      if (
        storedMode === "plan" ||
        storedMode === "analysis" ||
        storedMode === "question"
      ) {
        return storedMode
      }

      return "plan"
    }

    function saveConversationMode(
      conversationId: string,
      mode: AiChatMode
    ) {
      localStorage.setItem(
        `ai-chat-mode-${conversationId}`,
        mode
      )
    }

    function createConversationId() {
      if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID ===
          "function"
      ) {
        return crypto.randomUUID()
      }

      return `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`
    }

    async function loadMessages() {
      loading.value = true
      errorMessage.value = ""

      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser()

      if (userError || !user) {
        loading.value = false
        initialized.value = true
        messages.value = []
        currentConversationId.value = ""
        return
      }

      const { data, error } =
        await supabase
          .from("ai_messages")
          .select(`
            id,
            user_id,
            conversation_id,
            role,
            content,
            mode,
            created_at
          `)
          .order("created_at", {
            ascending: true
          })

      loading.value = false
      initialized.value = true

      if (error) {
        console.error(
          "读取 AI 对话记录失败：",
          error
        )

        errorMessage.value =
          error.message

        return
      }

      const rows =
        (data ?? []) as AiMessageRow[]

      messages.value = rows.map(row => {
        saveConversationMode(
          row.conversation_id,
          row.mode
        )

        return rowToChatMessage(row)
      })

      if (
        currentConversationId.value &&
        messages.value.some(message => {
          return (
            message.conversationId ===
            currentConversationId.value
          )
        })
      ) {
        currentMode.value =
          getConversationMode(
            currentConversationId.value
          )

        return
      }

      const latestConversation =
        conversations.value[0]

      if (latestConversation) {
        currentConversationId.value =
          latestConversation.id

        currentMode.value =
          latestConversation.mode
      } else {
        currentConversationId.value = ""
        currentMode.value = "plan"
      }

      console.log(
        "AI 对话记录加载完成"
      )
    }

    function startNewConversation(
      mode: AiChatMode = "plan"
    ) {
      const conversationId =
        createConversationId()

      currentConversationId.value =
        conversationId

      currentMode.value = mode
      errorMessage.value = ""
      lastMemorySavedCount.value = 0

      saveConversationMode(
        conversationId,
        mode
      )

      return conversationId
    }

    function selectConversation(
      conversationId: string
    ) {
      currentConversationId.value =
        conversationId

      currentMode.value =
        getConversationMode(
          conversationId
        )

      errorMessage.value = ""
      lastMemorySavedCount.value = 0
    }

    function setCurrentMode(
      mode: AiChatMode
    ) {
      currentMode.value = mode

      if (
        currentConversationId.value
      ) {
        saveConversationMode(
          currentConversationId.value,
          mode
        )
      }
    }

    async function insertMessage(
      conversationId: string,
      role: "user" | "assistant",
      content: string,
      mode: AiChatMode
    ): Promise<AiChatActionResult> {
      const normalizedContent =
        content.trim()

      if (!normalizedContent) {
        return {
          success: false,
          message: "消息内容不能为空"
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

      const { data, error } =
        await supabase
          .from("ai_messages")
          .insert({
            user_id: user.id,
            conversation_id:
              conversationId,
            role,
            content:
              normalizedContent,
            mode
          })
          .select(`
            id,
            user_id,
            conversation_id,
            role,
            content,
            mode,
            created_at
          `)
          .single()

      if (error) {
        console.error(
          "保存 AI 对话消息失败：",
          error
        )

        return {
          success: false,
          message: error.message
        }
      }

      const newMessage =
        rowToChatMessage(
          data as AiMessageRow
        )

      messages.value.push(newMessage)

      return {
        success: true,
        chatMessage: newMessage
      }
    }

    function buildConversationHistory(
      conversationId: string
    ): DeepSeekMessage[] {
      return messages.value
        .filter(message => {
          return (
            message.conversationId ===
            conversationId
          )
        })
        .sort((a, b) => {
          return a.createdAt.localeCompare(
            b.createdAt
          )
        })
        .slice(-20)
        .map(message => {
          return {
            role: message.role,
            content: message.content
          }
        })
    }

    function normalizeExtractedMemories(
      value: unknown
    ): ExtractedMemory[] {
      if (!Array.isArray(value)) {
        return []
      }

      const result: ExtractedMemory[] =
        []

      const seen =
        new Set<string>()

      for (const item of value) {
        if (
          !item ||
          typeof item !== "object"
        ) {
          continue
        }

        const candidate =
          item as Record<
            string,
            unknown
          >

        const memoryType =
          normalizeMemoryType(
            candidate.memoryType
          )

        const title =
          typeof candidate.title ===
          "string"
            ? candidate.title
                .trim()
                .slice(0, 60)
            : ""

        const content =
          typeof candidate.content ===
          "string"
            ? candidate.content
                .trim()
                .slice(0, 500)
            : ""

        const importance =
          normalizeImportance(
            candidate.importance
          )

        if (
          !memoryType ||
          !title ||
          !content
        ) {
          continue
        }

        const key =
          `${memoryType}:${content}`
            .toLowerCase()
            .replace(/\s+/g, "")

        if (seen.has(key)) {
          continue
        }

        seen.add(key)

        result.push({
          memoryType,
          title,
          content,
          importance
        })

        if (result.length >= 5) {
          break
        }
      }

      return result
    }

    function normalizeMemoryType(
      value: unknown
    ): AiMemoryType | null {
      if (
        value ===
          "study_preference" ||
        value ===
          "weak_subject" ||
        value ===
          "study_schedule" ||
        value ===
          "learning_goal" ||
        value ===
          "personal_note"
      ) {
        return value
      }

      return null
    }

    function normalizeImportance(
      value: unknown
    ) {
      const numberValue =
        typeof value === "number"
          ? value
          : Number(value)

      if (
        !Number.isFinite(numberValue)
      ) {
        return 3
      }

      return Math.min(
        5,
        Math.max(
          1,
          Math.round(numberValue)
        )
      )
    }

    async function saveExtractedMemories(
      extractedMemories: unknown
    ): Promise<MemorySaveSummary> {
      const aiMemoryStore =
        useAiMemoryStore()

      const memoriesToSave =
        normalizeExtractedMemories(
          extractedMemories
        )

      if (
        memoriesToSave.length === 0
      ) {
        return {
          savedCount: 0,
          failedCount: 0
        }
      }

      let savedCount = 0
      let failedCount = 0

      for (
        const memory of memoriesToSave
      ) {
        try {
          const result =
            await aiMemoryStore
              .addOrUpdateMemory({
                memoryType:
                  memory.memoryType,
                title: memory.title,
                content:
                  memory.content,
                importance:
                  memory.importance,
                source: "ai_chat"
              })

          if (result.success) {
            savedCount++
          } else {
            failedCount++

            console.warn(
              "自动保存 AI 记忆失败：",
              result.message
            )
          }
        } catch (error) {
          failedCount++

          console.error(
            "自动保存 AI 记忆发生异常：",
            error
          )
        }
      }

      if (savedCount > 0) {
        console.log(
          `AI 已自动保存 ${savedCount} 条长期记忆`
        )
      }

      return {
        savedCount,
        failedCount
      }
    }

    async function sendMessage(
      options: SendMessageOptions
    ): Promise<AiChatActionResult> {
      const content =
        options.content.trim()

      if (!content) {
        return {
          success: false,
          message: "请输入对话内容"
        }
      }

      if (sending.value) {
        return {
          success: false,
          message:
            "AI 正在回复，请稍候"
        }
      }

      const mode =
        options.mode ??
        currentMode.value

      if (
        !currentConversationId.value
      ) {
        startNewConversation(mode)
      }

      const conversationId =
        currentConversationId.value

      currentMode.value = mode

      saveConversationMode(
        conversationId,
        mode
      )

      sending.value = true
      errorMessage.value = ""
      lastMemorySavedCount.value = 0

      try {
        const userResult =
          await insertMessage(
            conversationId,
            "user",
            content,
            mode
          )

        if (!userResult.success) {
          errorMessage.value =
            userResult.message ??
            "保存消息失败"

          return userResult
        }

        const history =
          buildConversationHistory(
            conversationId
          )

        const aiMemoryStore =
          useAiMemoryStore()

        if (
          !aiMemoryStore.initialized
        ) {
          await aiMemoryStore
            .loadMemories()
        }

        const memorySummary =
          aiMemoryStore.memorySummary

        const { data, error } =
          await supabase.functions
            .invoke<CoachFunctionResponse>(
              "deepseek-coach",
              {
                body: {
                  mode,
                  message: content,
                  studySummary:
                    options.studySummary
                      ?.trim() ?? "",
                  preferences:
                    options.preferences
                      ?.trim() ?? "",
                  memorySummary,
                  history,
                  extractMemories: true
                }
              }
            )

        if (error) {
          console.error(
            "AI Edge Function 调用失败：",
            error
          )

          errorMessage.value =
            "AI 服务调用失败，请检查网络、函数状态和 DeepSeek 余额。"

          return {
            success: false,
            message:
              errorMessage.value
          }
        }

        if (data?.error) {
          errorMessage.value =
            data.error

          return {
            success: false,
            message: data.error
          }
        }

        const answer =
          data?.answer?.trim()

        if (!answer) {
          errorMessage.value =
            "AI 没有返回有效内容"

          return {
            success: false,
            message:
              errorMessage.value
          }
        }

        const assistantResult =
          await insertMessage(
            conversationId,
            "assistant",
            answer,
            mode
          )

        if (
          !assistantResult.success
        ) {
          errorMessage.value =
            assistantResult.message ??
            "保存 AI 回复失败"

          return assistantResult
        }

        const memoryResult =
          await saveExtractedMemories(
            data?.memories
          )

        lastMemorySavedCount.value =
          memoryResult.savedCount

        return {
          success: true,
          answer,
          conversationId,
          memorySavedCount:
            memoryResult.savedCount,
          memoryFailedCount:
            memoryResult.failedCount
        }
      } catch (error) {
        console.error(
          "AI 连续对话失败：",
          error
        )

        errorMessage.value =
          error instanceof Error
            ? error.message
            : "AI 连续对话发生未知错误"

        return {
          success: false,
          message:
            errorMessage.value
        }
      } finally {
        sending.value = false
      }
    }

    async function regenerateLastAnswer(
      studySummary = "",
      preferences = ""
    ): Promise<AiChatActionResult> {
      const conversationId =
        currentConversationId.value

      if (!conversationId) {
        return {
          success: false,
          message:
            "当前没有可重新生成的对话"
        }
      }

      const conversationMessages =
        currentMessages.value

      const lastUserMessage = [
        ...conversationMessages
      ]
        .reverse()
        .find(message => {
          return (
            message.role === "user"
          )
        })

      if (!lastUserMessage) {
        return {
          success: false,
          message:
            "没有找到用户消息"
        }
      }

      const lastAssistantMessage = [
        ...conversationMessages
      ]
        .reverse()
        .find(message => {
          return (
            message.role ===
              "assistant" &&
            message.createdAt >
              lastUserMessage.createdAt
          )
        })

      if (lastAssistantMessage) {
        const { error } =
          await supabase
            .from("ai_messages")
            .delete()
            .eq(
              "id",
              lastAssistantMessage.id
            )

        if (error) {
          console.error(
            "删除旧 AI 回复失败：",
            error
          )

          return {
            success: false,
            message: error.message
          }
        }

        messages.value =
          messages.value.filter(
            message => {
              return (
                message.id !==
                lastAssistantMessage.id
              )
            }
          )
      }

      sending.value = true
      errorMessage.value = ""
      lastMemorySavedCount.value = 0

      try {
        const history =
          buildConversationHistory(
            conversationId
          )

        const aiMemoryStore =
          useAiMemoryStore()

        if (
          !aiMemoryStore.initialized
        ) {
          await aiMemoryStore
            .loadMemories()
        }

        const { data, error } =
          await supabase.functions
            .invoke<CoachFunctionResponse>(
              "deepseek-coach",
              {
                body: {
                  mode:
                    currentMode.value,
                  message:
                    lastUserMessage.content,
                  studySummary:
                    studySummary.trim(),
                  preferences:
                    preferences.trim(),
                  memorySummary:
                    aiMemoryStore
                      .memorySummary,
                  history,
                  extractMemories: false
                }
              }
            )

        if (error) {
          console.error(
            "重新生成 AI 回复失败：",
            error
          )

          errorMessage.value =
            "重新生成失败，请稍后重试"

          return {
            success: false,
            message:
              errorMessage.value
          }
        }

        if (data?.error) {
          errorMessage.value =
            data.error

          return {
            success: false,
            message: data.error
          }
        }

        const answer =
          data?.answer?.trim()

        if (!answer) {
          errorMessage.value =
            "AI 没有返回有效内容"

          return {
            success: false,
            message:
              errorMessage.value
          }
        }

        const result =
          await insertMessage(
            conversationId,
            "assistant",
            answer,
            currentMode.value
          )

        if (!result.success) {
          return result
        }

        return {
          success: true,
          answer
        }
      } catch (error) {
        console.error(
          "重新生成 AI 回复失败：",
          error
        )

        errorMessage.value =
          error instanceof Error
            ? error.message
            : "重新生成失败"

        return {
          success: false,
          message:
            errorMessage.value
        }
      } finally {
        sending.value = false
      }
    }

    async function deleteConversation(
      conversationId: string
    ): Promise<AiChatActionResult> {
      const oldMessages = [
        ...messages.value
      ]

      messages.value =
        messages.value.filter(
          message => {
            return (
              message.conversationId !==
              conversationId
            )
          }
        )

      const { error } =
        await supabase
          .from("ai_messages")
          .delete()
          .eq(
            "conversation_id",
            conversationId
          )

      if (error) {
        messages.value = oldMessages

        console.error(
          "删除 AI 对话失败：",
          error
        )

        return {
          success: false,
          message: error.message
        }
      }

      localStorage.removeItem(
        `ai-chat-mode-${conversationId}`
      )

      if (
        currentConversationId.value ===
        conversationId
      ) {
        const nextConversation =
          conversations.value[0]

        if (nextConversation) {
          currentConversationId.value =
            nextConversation.id

          currentMode.value =
            nextConversation.mode
        } else {
          currentConversationId.value =
            ""

          currentMode.value = "plan"
        }
      }

      lastMemorySavedCount.value = 0

      return {
        success: true
      }
    }

    async function clearAllConversations(): Promise<AiChatActionResult> {
      const oldMessages = [
        ...messages.value
      ]

      const conversationIds =
        Array.from(
          new Set(
            messages.value.map(
              message =>
                message.conversationId
            )
          )
        )

      messages.value = []
      currentConversationId.value = ""

      const { error } =
        await supabase
          .from("ai_messages")
          .delete()
          .not("id", "is", null)

      if (error) {
        messages.value = oldMessages

        console.error(
          "清空 AI 对话失败：",
          error
        )

        return {
          success: false,
          message: error.message
        }
      }

      for (
        const conversationId of
        conversationIds
      ) {
        localStorage.removeItem(
          `ai-chat-mode-${conversationId}`
        )
      }

      currentMode.value = "plan"
      lastMemorySavedCount.value = 0

      return {
        success: true
      }
    }

    function clearChatState() {
      messages.value = []
      currentConversationId.value = ""
      currentMode.value = "plan"
      loading.value = false
      sending.value = false
      initialized.value = false
      errorMessage.value = ""
      lastMemorySavedCount.value = 0
    }

    return {
      messages,
      currentConversationId,
      currentMode,
      loading,
      sending,
      initialized,
      errorMessage,
      lastMemorySavedCount,
      currentMessages,
      conversations,
      loadMessages,
      startNewConversation,
      selectConversation,
      setCurrentMode,
      sendMessage,
      regenerateLastAnswer,
      deleteConversation,
      clearAllConversations,
      clearChatState
    }
  }
)