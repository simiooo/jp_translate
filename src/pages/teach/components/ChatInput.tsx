import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ArrowUpIcon, StopCircle } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onStopStreaming?: () => void;
  isStreaming?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStopStreaming,
  isStreaming = false,
  placeholder = "Type your message...",
  disabled = false,
}) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  return (
    <div className="bg-background p-4">
      <InputGroup>
        <InputGroupTextarea
          ref={textareaRef}
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn("resize-none")}
          rows={1}
        />

        <InputGroupAddon align="block-end">
          <InputGroupText className="ml-auto text-xs">
            <span></span>
          </InputGroupText>
          {isStreaming ? (
            <InputGroupButton
              type="button"
              variant="destructive"
              size="icon-sm"
              className="rounded-full"
              onClick={onStopStreaming}
            >
              <StopCircle className="h-4 w-4" />
            </InputGroupButton>
          ) : (
            <InputGroupButton
              type="button"
              variant="default"
              size="icon-sm"
              className="rounded-full"
              onClick={handleSend}
              disabled={disabled || !message.trim()}
            >
              <ArrowUpIcon />
            </InputGroupButton>
          )}
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
};
