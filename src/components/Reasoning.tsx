import { ForwardedRef, forwardRef } from "react";

interface ReasoningProps {
  thinking?: string;
  ref?: React.MutableRefObject<HTMLDivElement>
}

export const Reasoning = forwardRef(
  ({ thinking }: ReasoningProps, ref: ForwardedRef<HTMLDivElement>) => {
    if (!thinking) return null;

    return (
      <div
        
        className="
      p-4
      2xl:p-5
      lg:p-5
      shadow-lg
      bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl w-full
      "
      >
        <h3 className="text-sm font-semibold text-black-800 dark:text-gray-200 mb-2">
            思考……
          </h3>
        <div
        ref={ref}
          className="
      sm:size-96
      md:size-96 
      lg:size-96 
      xl:size-96
      2xl:size-96
      overflow-hidden
      overflow-y-auto
      pr-3
       "
        >
          
          <div className="text-sm text-black-700 dark:text-gray-300 whitespace-pre-wrap">
            {thinking}
          </div>
        </div>
      </div>
    );
  }
);
