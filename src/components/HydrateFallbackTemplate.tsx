import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FiLoader, FiClock, FiRefreshCw } from 'react-icons/fi';
import { cn } from '@/lib/utils';

interface HydrateFallbackProps {
  /**
   * Custom loading message
   * @default 'Loading...'
   */
  message?: string;
  
  /**
   * Whether to show the loading component as full screen
   * @default false
   */
  fullScreen?: boolean;
  
  /**
   * Custom class names
   */
  className?: string;
  
  /**
   * Loading animation variant
   * @default 'spinner'
   */
  variant?: 'spinner' | 'pulse' | 'bounce';
}

export function HydrateFallbackTemplate({
  message = 'Loading...',
  fullScreen = false,
  className = '',
  variant = 'spinner'
}: HydrateFallbackProps) {
  const containerClasses = cn(
    fullScreen
      ? 'fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50'
      : 'flex h-full items-center justify-center',
    className
  );

  const renderAnimation = () => {
    switch (variant) {
      case 'spinner':
        return (
          <FiLoader className="w-8 h-8 animate-spin text-primary" />
        );
      case 'pulse':
        return (
          <FiClock className="w-8 h-8 animate-pulse text-primary" />
        );
      case 'bounce':
        return (
          <FiRefreshCw className="w-8 h-8 animate-bounce text-primary" />
        );
      default:
        return (
          <FiLoader className="w-8 h-8 animate-spin text-primary" />
        );
    }
  };

  return (
    <div className={containerClasses}>
      <Card className="w-80 shadow-lg border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-center text-lg font-semibold">
            {message}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <div className="flex items-center justify-center p-4">
            {renderAnimation()}
          </div>
          <div className="text-center text-muted-foreground text-sm">
            Please wait while we prepare everything for you...
          </div>
          <div className="w-full bg-secondary rounded-full h-1.5">
            <div className="bg-primary h-1.5 rounded-full animate-pulse w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}