# /teach Feature Implementation Plan

## Overview
Implement a new `/teach` feature module for the Japanese learning application. This is an LLM-style chat interface for Japanese language learning with conversation history, new chat creation, and continuing existing conversations.

## Technical Stack
- **Package Manager**: pnpm
- **UI Framework**: shadcn/ui
- **Routing**: React Router v7
- **State Management**: Zustand + React hooks
- **Data Fetching**: Alova + ahooks
- **SSE Streaming**: Custom EventSourceStream implementation
- **Styling**: Tailwind CSS

## API Endpoints (Based on Documentation)

### 1. Create New Conversation
- **Endpoint**: `POST /api/teach`
- **Request**: `{ "message": "user message" }`
- **Response**: SSE stream with events: `start`, `chunk`, `complete`, `end`

### 2. Continue Conversation
- **Endpoint**: `POST /api/teach/:id`
- **Request**: `{ "message": "user message" }`
- **Response**: SSE stream with events: `start`, `chunk`, `complete`, `end`

### 3. List Conversations
- **Endpoint**: `GET /api/teach?page=1&limit=10`
- **Response**: `{ conversations: [...], pagination: {...} }`

### 4. Get Conversation History
- **Endpoint**: `GET /api/teach/:id?page=1&limit=50`
- **Response**: `{ conversation: {...}, messages: [...], pagination: {...} }`

## Mobile Responsive Design Requirements

The /teach feature must support mobile devices with the following responsive behaviors:

### Mobile Layout (xs, sm breakpoints)
- **Full-screen conversation list**: When no conversation is selected, show full list
- **Full-screen chat**: When conversation is selected, hide list and show chat only
- **Back button**: In chat view, show back button to return to conversation list
- **Bottom navigation**: Chat input fixed at bottom with proper safe area handling
- **Touch-friendly**: Minimum 44px touch targets, proper spacing

### Tablet & Desktop (md+ breakpoints)
- **Sidebar layout**: Persistent conversation list on left (collapsible)
- **Split view**: Conversation list and chat visible simultaneously
- **Resizable panels**: Using shadcn/ui Resizable component

### Responsive Breakpoints
- `xs`: < 640px (mobile portrait)
- `sm`: 640px - 768px (mobile landscape/small tablets)
- `md`: 768px+ (tablets/desktops)

## Implementation Steps

### Phase 1: Type Definitions
**File**: `src/types/teach.ts`

```typescript
// Message interface
export interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  token_count: number;
  created_at: string;
}

// Conversation interface
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

export type SSEEvent = SSEStartEvent | SSEChunkEvent | SSECompleteEvent | SSEEndEvent;

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
```

### Phase 2: API Service Functions
**File**: `src/utils/teachApi.ts`

```typescript
import { createSSEStream } from './request';
import type { 
  ConversationListResponse, 
  ConversationHistoryResponse,
  SSEEvent 
} from '~/types/teach';

const API_BASE = isElectron() ? 'https://risureader.top' : location.origin;

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
```

### Phase 3: Custom Hooks

#### Hook 1: useTeachHistory
**File**: `src/pages/teach/hooks/useTeachHistory.ts`

Similar to `useTranslationHistory` but for conversations:
- Manages conversation list state
- Handles pagination
- Search functionality
- Loading states

#### Hook 2: useTeachConversation
**File**: `src/pages/teach/hooks/useTeachConversation.ts`

Manages active conversation:
- Current conversation state
- Message list
- SSE streaming
- Sending messages
- Loading states

### Phase 4: UI Components

#### Component 1: MessageBubble
**File**: `src/pages/teach/components/MessageBubble.tsx`

Displays individual messages with:
- User/assistant styling
- Markdown rendering
- Timestamp
- Token count

#### Component 2: ChatInput
**File**: `src/pages/teach/components/ChatInput.tsx`

Message input component with:
- Textarea with auto-resize
- Send button
- Loading state
- Enter to send, Shift+Enter for new line

#### Component 3: ConversationList
**File**: `src/pages/teach/components/ConversationList.tsx`

Sidebar with:
- Conversation items
- Search bar
- New conversation button
- Infinite scroll pagination
- Collapsible (similar to HistorySidebar)

#### Component 4: ConversationItem
**File**: `src/pages/teach/components/ConversationItem.tsx`

Individual conversation list item with:
- Title
- Last message preview
- Timestamp
- Message count

### Phase 5: Main Page Component
**File**: `src/pages/teach/HomePage.tsx`

Main chat interface with:
- Resizable layout (sidebar + chat area)
- Conversation list sidebar
- Message display area
- Input area
- Loading states
- Error handling

### Phase 6: Routing
**File**: `src/routes.ts`

Add route:
```typescript
route("teach", "./pages/teach/HomePage.tsx")
```

### Phase 7: Navigation
**File**: `src/components/TitleBar.tsx`

Add navigation link to the teach feature in the main navigation.

## Design Patterns Used

1. **SSE Streaming**: Using existing EventSourceStream class
2. **Pagination**: Using ahooks useAntdTable pattern
3. **Responsive Design**: Using useResponsive hook
4. **State Management**: Using React hooks + Zustand
5. **Error Handling**: Using Toast notifications
6. **Loading States**: Using Skeleton components
7. **Resizable Layout**: Using shadcn/ui Resizable components

## Key Features

1. **Real-time Streaming**: SSE for live AI responses
2. **Conversation History**: Persistent chat history
3. **Search**: Search through conversations
4. **Pagination**: Infinite scroll for history
5. **Responsive**: Mobile-friendly design
6. **Loading States**: Smooth UX with skeletons
7. **Error Handling**: User-friendly error messages

## File Structure

```
src/
├── types/
│   └── teach.ts
├── utils/
│   └── teachApi.ts
├── pages/
│   └── teach/
│       ├── HomePage.tsx
│       ├── hooks/
│       │   ├── useTeachHistory.ts
│       │   └── useTeachConversation.ts
│       └── components/
│           ├── MessageBubble.tsx
│           ├── ChatInput.tsx
│           ├── ConversationList.tsx
│           └── ConversationItem.tsx
└── routes.ts
```

## Next Steps

1. Switch to Code mode to implement the types and API functions
2. Create the custom hooks
3. Build the UI components
4. Integrate everything into the main page
5. Add routing and navigation
6. Test the implementation