import React from 'react'

export default function Spinner() {
  return (
    <div
    className='flex justify-center items-center w-100% h-12'
    >
        <div
        className='rounded-full w-6 h-6 bg-cyan-600 animate-bounce'
        ></div>
    </div>
  )
}
