import React, { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'link' | 'normal' | 'text';
  size?: 'sm' | 'md' | 'lg';
}
const component =  React.forwardRef<HTMLButtonElement, ButtonProps>(function ({
  loading = false,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps, ref) {
  const baseClasses = 'font-medium focus:outline-none focus:ring-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-2xl',
    md: 'px-6 py-2.5 text-sm rounded-3xl',
    lg: 'px-8 py-3 text-base rounded-3xl'
  }
  
  const textSizeClasses = {
    sm: 'p-1 rounded text-xs',
    md: 'p-1.5 rounded-lg text-sm',
    lg: 'p-2 rounded-lg text-base'
  }
  
  const variantClasses = {
    primary: 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 focus:ring-offset-2',
    secondary: 'text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-gray-300',
    link: 'text-blue-600 bg-transparent hover:text-blue-800 hover:underline focus:ring-blue-500 p-0',
    normal: 'text-gray-700 bg-gray-100 border border-gray-300 hover:bg-gray-200 focus:ring-gray-400',
    text: 'hover:bg-gray-200 focus:ring-gray-300'
  }
  
  const currentSizeClasses = variant === 'link' ? '' : variant === 'text' ? textSizeClasses[size] : sizeClasses[size]
  const currentVariantClasses = variantClasses[variant]

  return (
    <button
    ref={ref}
      type="button"
      className={`${baseClasses} ${currentSizeClasses} ${currentVariantClasses} ${className} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
      disabled={loading || props.disabled}
      {...props}
    >
      
      {loading ? <span
      >{'Loading...'}</span> : children}
    </button>
  )
})
export const Button =  component
