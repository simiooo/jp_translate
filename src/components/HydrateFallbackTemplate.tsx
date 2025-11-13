
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png'

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
  fullScreen = false,
  className = '',
}: HydrateFallbackProps) {
  const containerClasses = cn(
    fullScreen
      ? 'fixed h-screen inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50'
      : 'flex h-full items-center justify-center',
    className
  );

  return (
    <div className={containerClasses}>
      <img className='w-48' src={logo} alt="" />
    </div>
  );
}