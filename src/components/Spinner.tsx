import React from 'react'
interface SpinnerProps {
  children?: React.ReactNode;
  loading?: boolean;
}
export default function Spinner(props: SpinnerProps) {
  return (
    <div className='relative w-full h-full'>
      {/* Children content */}
      <div className='w-full h-full'>
        {props.children}
      </div>
      
      {/* Loading overlay with frosted glass effect */}
      {props?.loading && (
        <div className='absolute inset-0 backdrop-blur-sm bg-white/30 dark:bg-gray-900/30 flex justify-center items-center z-10'>
          <div className='rounded-full w-8 h-8 bg-cyan-600 dark:bg-cyan-400 animate-bounce shadow-lg'></div>
        </div>
      )}
    </div>
  )
}
