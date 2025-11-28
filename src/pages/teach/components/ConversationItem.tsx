import React from "react";
import { cn } from "@/lib/utils";
import type { Conversation } from "~/types/teach";

interface ConversationItemProps {
  conversation: Conversation;
  isActive?: boolean;
  onClick?: () => void;
  isCollapsed?: boolean;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive = false,
  onClick,
  isCollapsed = false,
}) => {
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (title: string) => {
    return title.charAt(0).toUpperCase();
  };

  const avatarColors = [
    "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300",
  ];

  const avatarColor = avatarColors[conversation.id ? conversation.id % avatarColors.length : 0];

  return (
    <div
      onClick={onClick}
      className={cn(
        "cursor-pointer border-b last:border-b-0 transition-colors",
        "hover:bg-accent",
        isActive && "bg-accent",
        isCollapsed ? "p-2" : "p-4"
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {isCollapsed ? (
        <div className="flex justify-center items-center">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
              avatarColor
            )}
          >
            {getInitials(conversation.title)}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-medium line-clamp-1 flex-1">
              {conversation.title}
            </h3>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatRelativeTime(conversation.updated_at)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {conversation.message_count} messages
            </span>
          </div>
        </div>
      )}
    </div>
  );
};