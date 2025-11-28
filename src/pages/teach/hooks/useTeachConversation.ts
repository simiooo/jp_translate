import { useState, useCallback, useRef, useEffect } from "react";
import { useThrottle } from "ahooks";
import { createConversation, continueConversation, getConversationHistory, createSSEStream } from "~/utils/teachApi";
import type { Message, Conversation, SSEEvent } from "~/types/teach";
import { Toast } from "~/components/ToastCompat";
import { EventSourceStream } from "~/utils/request";

interface UseTeachConversationProps {
  conversationId: number | null;
  onConversationCreated?: (conversationId: number) => void;
}

export function useTeachConversation({
  conversationId,
  onConversationCreated
}: UseTeachConversationProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const throttledStreamingContent = useThrottle(streamingContent, { wait: 700 });
  
  const sseStreamRef = useRef<ReturnType<typeof createSSEStream> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversationHistory = useCallback(async (id: number) => {
    try {
      setIsLoading(true);
      const data = await getConversationHistory(id, 1, 50);
      setCurrentConversation(data.conversation);
      setMessages(data.messages);
    } catch (error) {
      console.error("Failed to load conversation history:", error);
      Toast.error("Failed to load conversation history");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load conversation history when conversationId changes
  useEffect(() => {
    console.log("conversationId")
    console.log(conversationId);
    
    if (typeof conversationId === 'number') {
      loadConversationHistory(conversationId);
    } else {
      // New conversation, clear messages
      setMessages([]);
      setCurrentConversation(null);
    }
  }, [conversationId, loadConversationHistory]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  

  const handleSSEEvent = useCallback((event: SSEEvent) => {
    const { type, data } = event;
    
    switch (type) {
      case 'start':
        setIsStreaming(true);
        setStreamingContent("");
        break;
        
      case 'chunk':
        setStreamingContent(prev => prev + data.content);
        break;
        
      case 'complete': {
        // Add the completed assistant message
        const assistantMessage: Message = data.message;
        setMessages(prev => [...prev, assistantMessage]);
        setStreamingContent("");
        setIsStreaming(false);
        
        // Update conversation info
        if (data.conversation_id && data.title) {
          setCurrentConversation(prev => ({
            id: data.conversation_id,
            title: data.title,
            message_count: (prev?.message_count || 0) + 1,
            created_at: prev?.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));
        }
        
        // Notify parent component of new conversation
        if (data.conversation_id && !conversationId) {
          onConversationCreated?.(data.conversation_id);
        }
        break;
      }
        
      case 'end':
        setIsStreaming(false);
        break;
        
      case 'error':
        setIsStreaming(false);
        setStreamingContent("");
        Toast.error("Failed to get response from server");
        break;
    }
  }, [conversationId, onConversationCreated]);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isStreaming) return;

    try {
      // Add user message immediately
      const userMessage: Message = {
        id: Date.now(),
        role: 'user',
        content: message,
        token_count: 0,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMessage]);

      // Create or continue conversation
      setIsStreaming(true);
      setStreamingContent("");

      const sse = conversationId 
        ? continueConversation(conversationId, message)
        : createConversation(message);
      ;(sseStreamRef.current as EventSourceStream<SSEEvent>) = sse;
      
      sse
        .on('data', handleSSEEvent)
        .on('error', (error) => {
          console.error("SSE error:", error);
          setIsStreaming(false);
          setStreamingContent("");
          Toast.error("Connection error occurred");
        })
        .connect();

    } catch (error) {
      console.error("Failed to send message:", error);
      Toast.error("Failed to send message");
      setIsStreaming(false);
      setStreamingContent("");
    }
  }, [conversationId, isStreaming, handleSSEEvent]);

  const stopStreaming = useCallback(() => {
    if (sseStreamRef.current) {
      sseStreamRef.current.close();
      sseStreamRef.current = null;
    }
    setIsStreaming(false);
    setStreamingContent("");
  }, []);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setCurrentConversation(null);
    setStreamingContent("");
    setIsStreaming(false);
    if (sseStreamRef.current) {
      sseStreamRef.current.close();
      sseStreamRef.current = null;
    }
  }, []);

  return {
    messages,
    currentConversation,
    isLoading,
    isStreaming,
    streamingContent: throttledStreamingContent,
    sendMessage,
    stopStreaming,
    clearConversation,
    messagesEndRef,
  };
}