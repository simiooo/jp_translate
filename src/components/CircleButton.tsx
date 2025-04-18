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
    const loadingStyles = loading ? "text-gray-400 cursor-not-allowed" : "";
    
    if (type === "borderless") {
      return `${baseStyles} ${loadingStyles} ${
        loading 
          ? "bg-transparent" 
          : "text-gray-600 hover:text-gray-800 hover:bg-gray-100 active:bg-gray-200"
      }`;
    } else {
      return `${baseStyles} hover:text-gray-800 border-1 border-gray-200 bg-white shadow-xs ${
        loading
          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
          : "text-gray-600 active:shadow-2xs active:bg-gray-200 active:border-gray-300 hover:bg-gray-100"
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
