import React from "react";

interface CircleButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  loading?: boolean;
  title?: string;
  className?: string;
  type?: "default" | "borderless";
  children: React.ReactNode;
}

export const CircleButton: React.FC<CircleButtonProps> = ({
  onClick,
  disabled = false,
  loading = false,
  title,
  className = "",
  type = "default",
  children,
}) => {
  const getButtonStyles = () => {
    const baseStyles = "p-2 rounded-full transition-all duration-200";
    const loadingStyles = loading ? "text-gray-400 cursor-not-allowed dark:text-gray-500" : "";
    
    if (type === "borderless") {
      return `${baseStyles} ${loadingStyles} ${
        loading 
          ? "bg-transparent" 
          : "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600"
      }`;
    } else {
      return `${baseStyles} hover:text-gray-800 dark:hover:text-gray-100 border-1 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xs ${
        loading
          ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
          : "text-gray-600 dark:text-gray-300 active:shadow-2xs active:bg-gray-200 dark:active:bg-gray-600 active:border-gray-300 dark:active:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
      }`;
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${getButtonStyles()} ${className}`}
      title={title}
    >
      {loading ? (
        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        children
      )}
    </button>
  );
};
