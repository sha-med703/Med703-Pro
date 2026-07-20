export type ChatRole = "user" | "assistant"

export interface ChatMessage {
  id: string
  conversationId: string
  role: ChatRole
  content: string
  createdAt: string
}

export interface ChatMessageRow {
  id: string
  conversation_id: string
  role: ChatRole
  content: string
  created_at: string
}

export interface DeepSeekMessage {
  role: ChatRole
  content: string
}