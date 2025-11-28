// Type definitions for the /teach feature

export interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  token_count: number;
  created_at: string;
}

export interface Conversation {
  id: number;
  title: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

// SSE Event types
export interface SSEStartEvent {
  type: 'start';
  data: {
    message: string;
    conversation_id: number;
  };
}

export interface SSEChunkEvent {
  type: 'chunk';
  data: {
    content: string;
    role: 'assistant';
  };
}

export interface SSECompleteEvent {
  type: 'complete';
  data: {
    conversation_id: number;
    title: string;
    message: Message;
  };
}

export interface SSEEndEvent {
  type: 'end';
  data: {
    status: string;
  };
}

export interface SSEErrorEvent {
  type: 'error';
  data: {
    message: string;
  };
}

export type SSEEvent = SSEStartEvent | SSEChunkEvent | SSECompleteEvent | SSEEndEvent | SSEErrorEvent;

// API Responses
export interface ConversationListResponse {
  conversations: Conversation[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ConversationHistoryResponse {
  conversation: Conversation;
  messages: Message[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}