import React from 'react'
import { Skeleton } from './ui/skeleton'
import { cn } from '~/lib/utils'

interface SpinnerProps {
  children?: React.ReactNode;
  loading?: boolean;
  className?: string;
}

export default function Spinner({ children, loading = false, className }: SpinnerProps) {
  if (!children) {
    // Standalone spinner mode - show a simple loading indicator
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <div className='rounded-full w-8 h-8 bg-primary animate-bounce shadow-lg'></div>
      </div>
    )
  }

  return (
    <div className='relative w-full h-full'>
      {/* Children content */}
      <div className={cn('w-full h-full', loading && 'opacity-50')}>
        {children}
      </div>
      
      {/* Loading overlay with skeleton */}
      {loading && (
        <div className='absolute inset-0 backdrop-blur-sm bg-background/30 flex justify-center items-center z-10'>
          <div className='space-y-2'>
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
        </div>
      )}
    </div>
  )
}
