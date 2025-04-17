import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  variant?: 'primary' | 'secondary'
}

export function Button({ 
  loading = false,
  variant = 'primary',
  className = '',
  children,
  ...props 
}: ButtonProps) {
  const baseClasses = 'px-6 py-2.5 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 transition-all duration-200'
  
  const variantClasses = variant === 'primary' 
    ? 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 focus:ring-offset-2' 
    : 'text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-gray-300'

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${className} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
      disabled={loading}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  )
}
