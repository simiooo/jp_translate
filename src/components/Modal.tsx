import React, { useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = "",
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle ESC key press
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle overlay click
  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  // Size classes
  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-full mx-4",
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      {/* Glassmorphism Overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-md" />

      {/* Modal Content */}
      <div
        ref={modalRef}
        className={`
          relative w-full ${sizeClasses[size]}
          bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl
          rounded-2xl shadow-2xl
          border border-white/20 dark:border-gray-700/20
          transform transition-all duration-300 ease-out
          animate-fade-in
          ${className}
        `}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 pb-4">
            {title && (
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="
                  p-2 rounded-full 
                  text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400
                  hover:bg-gray-100/50 dark:hover:bg-gray-800/50
                  transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-blue-500/50
                "
                aria-label="关闭"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className={`${title || showCloseButton ? "px-6 pb-6" : "p-6"}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

// Hook for easier modal management
export const useModal = <T,>(initialState = false, initParams?: T) => {
  const [isOpen, setIsOpen] = React.useState(initialState);
  const [params, setParams] = React.useState<T | undefined>(initParams);
  const openModal = React.useCallback((param?: T) => {
    setParams(param);
    setIsOpen(true);
  }, []);
  const closeModal = React.useCallback((param?: T) => {
    setParams(param);
    setIsOpen(false);
  }, []);
  const toggleModal = React.useCallback((param?: T) => {
    setParams(param);
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal,
    params
  };
};
