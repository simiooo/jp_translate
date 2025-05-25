import React from 'react'
interface SpinnerProps {
  children?: React.ReactNode;
  loading?: boolean;
}
export default function Spinner(props: SpinnerProps) {
  return (
    <div
    className='h-1/1 w-1/1'
    >
        <div
        className='h-[calc(100%)] w-100% flex justify-center items-center'
        >
          {props.children}
        </div>
         {props?.loading && <div
         className={`h-0 visible -translate-4 flex justify-center items-center`}
         >
          <div
        className='rounded-full w-6 h-6 shadow-2xl bg-cyan-600 animate-bounce'
        ></div>
         </div> }
    </div>
  )
}
