import React, { useState, useEffect } from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';

interface SwitchProps {
  initialChecked?: boolean;
  onChange?: (checked: boolean) => void;
}

export const Switch: React.FC<SwitchProps> = ({ initialChecked = false, onChange }) => {
  const [isChecked, setIsChecked] = useState(initialChecked);

  useEffect(() => {
    const isDarkMode = localStorage.getItem('theme') === 'dark';
    setIsChecked(isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleSwitch = () => {
    const newCheckedState = !isChecked;
    setIsChecked(newCheckedState);
    if (newCheckedState) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    onChange?.(newCheckedState);
  };

  return (
    <button
      type="button"
      onClick={toggleSwitch}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out
        ${isChecked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      `}
      role="switch"
      aria-checked={isChecked}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out
          ${isChecked ? 'translate-x-6' : 'translate-x-1'}
          flex items-center justify-center
        `}
      >
        {isChecked ? (
          <FaMoon className="h-3 w-3 text-gray-800" />
        ) : (
          <FaSun className="h-3 w-3 text-yellow-500" />
        )}
      </span>
    </button>
  );
};
