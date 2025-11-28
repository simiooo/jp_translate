import { createSSEStream } from './request';
import { alovaInstance } from './request';
export { createSSEStream } from './request';
import { isElectron } from './electron';
import { isBrowser } from './ssr';
import type {
  ConversationListResponse,
  ConversationHistoryResponse,
  SSEEvent
} from '~/types/teach';

const getApiBase = () => {
  if (isElectron()) {
    return 'https://risureader.top';
  }
  
  // During SSR, return a default value since location/window are not available
  if (!isBrowser()) {
    return 'https://risureader.top';
  }
  
  // In browser environment, use window.location.origin
  return window.location.origin;
};

const API_BASE = getApiBase();

// Create new conversation
export const createConversation = (message: string) => {
  return createSSEStream<SSEEvent>(
    new URL('/api/teach', API_BASE).toString(),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    }
  );
};

// Continue conversation
export const continueConversation = (conversationId: number, message: string) => {
  return createSSEStream<SSEEvent>(
    new URL(`/api/teach/${conversationId}`, API_BASE).toString(),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    }
  );
};

// Get conversation list
export const getConversations = async (page: number = 1, limit: number = 10) => {
  const response = await alovaInstance.Get<ConversationListResponse>(
    '/api/teach',
    {
      params: { page, limit },
    }
  );
  return response;
};

// Get conversation history
export const getConversationHistory = async (
  conversationId: number, 
  page: number = 1, 
  limit: number = 50
) => {
  const response = await alovaInstance.Get<ConversationHistoryResponse>(
    `/api/teach/${conversationId}`,
    {
      params: { page, limit },
    }
  );
  return response;
};