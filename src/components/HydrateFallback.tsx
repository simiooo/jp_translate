import React from 'react';

interface LoadingProps {
  /**
   * The size of the spinner
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  
  /**
   * The color of the spinner
   * @default 'primary'
   */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  
  /**
   * The variant of the loading component
   * @default 'spinner'
   */
  variant?: 'spinner' | 'dots' | 'bars' | 'ring';
  
  /**
   * Whether to show the loading component as full screen
   * @default false
   */
  fullScreen?: boolean;
  
  /**
   * Custom label text
   * @default 'Loading...'
   */
  label?: string;
  
  /**
   * Whether to show the label
   * @default true
   */
  showLabel?: boolean;
  
  /**
   * Custom class names
   */
  className?: string;
  
  /**
   * Custom style
   */
  style?: React.CSSProperties;
}

export function HydrateFallback({
  size = 'md',
  color = 'primary',
  variant = 'spinner',
  fullScreen = false,
  label = 'Loading...',
  showLabel = true,
  className = '',
  style
}: LoadingProps) {
  // Size classes
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };
  
  // Color classes
  const colorClasses = {
    primary: 'bg-cyan-600 dark:bg-cyan-400',
    secondary: 'bg-gray-600 dark:bg-gray-400',
    success: 'bg-green-600 dark:bg-green-400',
    warning: 'bg-yellow-600 dark:bg-yellow-400',
    error: 'bg-red-600 dark:bg-red-400'
  };
  
  // Variant classes
  const variantClasses = {
    spinner: `rounded-full ${colorClasses[color]} animate-spin`,
    dots: `rounded-full ${colorClasses[color]} animate-bounce`,
    bars: `rounded ${colorClasses[color]}`,
    ring: `rounded-full ${colorClasses[color]} animate-spin border-4 border-t-transparent`
  };
  
  // Container classes
  const containerClasses = fullScreen
    ? 'fixed inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50'
    : 'flex flex-col items-center justify-center';
  
  // Size-specific classes for different variants
  const getSizeClasses = () => {
    if (variant === 'ring') {
      return sizeClasses[size];
    }
    if (variant === 'bars') {
      return `${sizeClasses[size].replace('w-', 'w-').replace('h-', 'h-')} h-2`;
    }
    return sizeClasses[size];
  };
  
  // Render different variants
  const renderSpinner = () => {
    const spinnerSizeClasses = getSizeClasses();
    
    switch (variant) {
      case 'spinner':
        return (
          <div 
            className={`${spinnerSizeClasses} ${variantClasses.spinner}`}
            style={style}
          />
        );
      
      case 'dots':
        return (
          <div className="flex space-x-1">
            <div 
              className={`${spinnerSizeClasses.replace('w-', 'w-').replace('h-', 'h-')} ${variantClasses.dots}`}
              style={style}
            />
            <div 
              className={`${spinnerSizeClasses.replace('w-', 'w-').replace('h-', 'h-')} ${variantClasses.dots}`} 
              style={{...style, animationDelay: '0.1s'}}
            />
            <div 
              className={`${spinnerSizeClasses.replace('w-', 'w-').replace('h-', 'h-')} ${variantClasses.dots}`} 
              style={{...style, animationDelay: '0.2s'}}
            />
          </div>
        );
      
      case 'bars':
        return (
          <div className="flex space-x-1">
            <div 
              className={`${spinnerSizeClasses} ${variantClasses.bars}`}
              style={{...style, animation: 'bars1 1s infinite'}}
            />
            <div 
              className={`${spinnerSizeClasses} ${variantClasses.bars}`} 
              style={{...style, animation: 'bars2 1s infinite'}}
            />
            <div 
              className={`${spinnerSizeClasses} ${variantClasses.bars}`} 
              style={{...style, animation: 'bars3 1s infinite'}}
            />
          </div>
        );
      
      case 'ring':
        return (
          <div 
            className={`${spinnerSizeClasses} ${variantClasses.ring}`}
            style={style}
          />
        );
      
      default:
        return (
          <div 
            className={`${spinnerSizeClasses} ${variantClasses.spinner}`}
            style={style}
          />
        );
    }
  };
  
  return (
    <div className={`${containerClasses} ${className}`}>
      {renderSpinner()}
      {showLabel && (
        <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">
          {label}
        </p>
      )}
      
      {/* Keyframes for bar animations */}
      <style>{`
        @keyframes bars1 {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1); }
        }
        @keyframes bars2 {
          0%, 100% { transform: scaleY(0.7); }
          50% { transform: scaleY(1); }
        }
        @keyframes bars3 {
          0%, 100% { transform: scaleY(0.9); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}