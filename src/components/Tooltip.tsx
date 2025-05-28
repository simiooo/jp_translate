import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip = ({ content, children, placement = 'top' }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionClasses = () => {
    switch(placement) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2';
    }
  };

  const getArrowPositionClasses = () => {
    switch(placement) {
      case 'top':
        return '-bottom-1 left-1/2';
      case 'bottom':
        return '-top-1 left-1/2';
      case 'left':
        return '-right-1 top-1/2';
      case 'right':
        return '-left-1 top-1/2';
      default:
        return '-bottom-1 left-1/2';
    }
  };

  return (
    <div 
      className="relative visible inline-block" 
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={() => setIsVisible(true)} 
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-100 bg-black  text-white rounded-xl p-2 text-sm max-w-sm shadow-lg ${getPositionClasses()} min-w-20`}>
          {content}
          <div 
            className={`absolute w-2 h-2 bg-black transform rotate-45 ${getArrowPositionClasses()}`}
            style={{ 
              [placement === 'top' || placement === 'bottom' ? 'left' : 'top']: '50%',
              [placement === 'left' || placement === 'right' ? 'margin' : '']: '0'
            }}
          ></div>
        </div>
      )}
    </div>
  );
};