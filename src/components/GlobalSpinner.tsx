import React from 'react'

export default function GlobalSpinner() {
  return (
    <div
    className='flex justify-center items-center w-full h-full'
    >
        <div
        className='rounded-full w-6 h-6 bg-cyan-600 animate-bounce'
        ></div>
    </div>
  )
}
