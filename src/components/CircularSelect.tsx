import { useState } from 'react'

interface CircularSelectProps {
  options: { value: string; label: string }[]
  value?: string
  onChange?: (value: string) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export const CircularSelect = ({ 
  options, 
  value, 
  onChange, 
  className = '',
  size = 'md'
}: CircularSelectProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedValue, setSelectedValue] = useState(value || '')

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base'
  }

  const handleSelect = (optionValue: string) => {
    setSelectedValue(optionValue)
    onChange?.(optionValue)
    setIsOpen(false)
  }

  const isSelected = !!selectedValue

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Circular Select Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          ${sizeClasses[size]}
          rounded-full
          border-2
          transition-all
          duration-200
          flex
          items-center
          justify-center
          font-medium
          focus:outline-none
          focus:ring-2
          focus:ring-blue-300
          focus:ring-offset-2
          ${isSelected 
            ? 'bg-blue-500 border-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:border-blue-600 dark:hover:bg-blue-500' 
            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
          }
        `}
      >
        {isSelected ? (
          // Checkmark icon for selected state
          <svg 
            className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'}`} 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
              clipRule="evenodd" 
            />
          </svg>
        ) : (
          // Plus icon or empty state for unselected
          <svg 
            className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
            />
          </svg>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Options Menu */}
          <div className="absolute top-full left-0 mt-2 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg min-w-48 py-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`
                  w-full
                  text-left
                  px-4
                  py-2
                  text-sm
                  transition-colors
                  duration-150
                  flex
                  items-center
                  justify-between
                  ${selectedValue === option.value 
                    ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }
                `}
              >
                <span>{option.label}</span>
                {selectedValue === option.value && (
                  <svg 
                    className="w-4 h-4 text-blue-500" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
