import React, { InputHTMLAttributes, forwardRef } from 'react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg'
  label?: string
  error?: boolean
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ size = 'md', label, error = false, className = '', ...props }, ref) => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5', 
      lg: 'w-6 h-6'
    }

    const iconSizeClasses = {
      sm: 'w-2.5 h-2.5',
      md: 'w-3 h-3',
      lg: 'w-3.5 h-3.5'
    }

    const labelSizeClasses = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base'
    }

    return (
      <label className={`inline-flex items-center cursor-pointer ${className}`}>
        <div className="relative">
          <input
            ref={ref}
            type="checkbox"
            className="sr-only"
            {...props}
          />
          <div
            className={`
              ${sizeClasses[size]}
              rounded-full
              border-2
              transition-all
              duration-200
              flex
              items-center
              justify-center
              ${props.checked
                ? 'bg-blue-500 border-blue-500'
                : error
                ? 'bg-white dark:bg-gray-800 border-red-400 hover:border-red-500'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }
              ${props.disabled
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer'
              }
              focus-within:ring-2
              focus-within:ring-blue-300
              focus-within:ring-offset-2
            `}
          >
            {props.checked && (
              <svg
                className={`${iconSizeClasses[size]} text-white`}
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
        </div>
        {label && (
          <span
            className={`
              ml-2
              ${labelSizeClasses[size]}
              ${error ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'}
              ${props.disabled ? 'opacity-50' : ''}
            `}
          >
            {label}
          </span>
        )}
      </label>
    )
  }
)

Checkbox.displayName = 'Checkbox'
