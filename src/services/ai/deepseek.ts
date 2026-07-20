import { supabase } from "../../lib/supabase"

export type AiMode =
  | "plan"
  | "analysis"
  | "question"

export type AiMessageRole =
  | "user"
  | "assistant"

export interface AiHistoryMessage {
  role: AiMessageRole
  content: string
}

export interface DeepSeekRequest {
  message: string
  mode?: AiMode
  studySummary?: string
  preferences?: string
  memorySummary?: string
  history?: AiHistoryMessage[]
}

export interface DeepSeekUsage {
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
}

export interface DeepSeekResponse {
  answer: string
  model: string
  usage: DeepSeekUsage | null
}

interface EdgeFunctionResponse {
  answer?: string
  error?: string
  model?: string
  usage?: DeepSeekUsage | null
}

export interface AiServiceResult {
  success: boolean
  data?: DeepSeekResponse
  message?: string
}

function normalizeText(value?: string) {
  return value?.trim() ?? ""
}

function normalizeHistory(
  history?: AiHistoryMessage[]
) {
  if (!Array.isArray(history)) {
    return []
  }

  return history
    .filter(item => {
      return (
        item &&
        (item.role === "user" ||
          item.role === "assistant") &&
        typeof item.content === "string" &&
        item.content.trim().length > 0
      )
    })
    .map(item => {
      return {
        role: item.role,
        content: item.content.trim()
      }
    })
    .slice(-20)
}

export async function askDeepSeek(
  request: DeepSeekRequest
): Promise<AiServiceResult> {
  const message = normalizeText(request.message)
  const studySummary = normalizeText(
    request.studySummary
  )
  const preferences = normalizeText(
    request.preferences
  )
  const memorySummary = normalizeText(
    request.memorySummary
  )
  const history = normalizeHistory(request.history)
  const mode = request.mode ?? "plan"

  if (
    !message &&
    !studySummary &&
    history.length === 0
  ) {
    return {
      success: false,
      message: "请提供问题、学习数据或聊天记录"
    }
  }

  try {
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error(
        "读取登录状态失败：",
        sessionError
      )

      return {
        success: false,
        message: "读取登录状态失败，请重新登录"
      }
    }

    if (!session) {
      return {
        success: false,
        message: "请先登录账号"
      }
    }

    const { data, error } =
      await supabase.functions.invoke<EdgeFunctionResponse>(
        "deepseek-coach",
        {
          body: {
            mode,
            message,
            studySummary,
            preferences,
            memorySummary,
            history
          }
        }
      )

    if (error) {
      console.error(
        "DeepSeek Edge Function 调用失败：",
        error
      )

      return {
        success: false,
        message:
          "AI 服务调用失败，请检查网络、函数部署状态和 DeepSeek 余额"
      }
    }

    if (data?.error) {
      return {
        success: false,
        message: data.error
      }
    }

    const answer = data?.answer?.trim()

    if (!answer) {
      return {
        success: false,
        message: "AI 没有返回有效内容"
      }
    }

    return {
      success: true,
      data: {
        answer,
        model:
          data?.model?.trim() || "deepseek-chat",
        usage: data?.usage ?? null
      }
    }
  } catch (error) {
    console.error(
      "DeepSeek 服务执行失败：",
      error
    )

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "AI 服务发生未知错误"
    }
  }
}

export async function generateStudyPlan(
  options: {
    message: string
    studySummary?: string
    preferences?: string
    memorySummary?: string
    history?: AiHistoryMessage[]
  }
) {
  return askDeepSeek({
    ...options,
    mode: "plan"
  })
}

export async function analyzeStudyData(
  options: {
    message: string
    studySummary?: string
    preferences?: string
    memorySummary?: string
    history?: AiHistoryMessage[]
  }
) {
  return askDeepSeek({
    ...options,
    mode: "analysis"
  })
}

export async function askMedicalQuestion(
  options: {
    message: string
    studySummary?: string
    preferences?: string
    memorySummary?: string
    history?: AiHistoryMessage[]
  }
) {
  return askDeepSeek({
    ...options,
    mode: "question"
  })
}