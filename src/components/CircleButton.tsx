import React from "react";
import { Button } from "./ui/button";
import { cn } from "~/lib/utils";
import { type VariantProps } from "class-variance-authority";
import { buttonVariants } from "./ui/button";

interface CircleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  loading?: boolean;
  children: React.ReactNode;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const CircleButton: React.FC<CircleButtonProps> = ({
  onClick,
  disabled = false,
  loading = false,
  title,
  className = "",
  variant = "outline",
  size = "icon",
  children,
  ...props
}) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "rounded-full p-2 transition-all duration-200",
        className
      )}
      title={title}
      variant={variant}
      size={size}
      {...props}
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
    </Button>
  );
};
