import React, { useState } from 'react';

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

export function Select({ value, onValueChange, children }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleOpen = () => setIsOpen(!isOpen);
  
  return (
    <div className="relative">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            value,
            onValueChange,
            isOpen,
            toggleOpen
          });
        }
        return child;
      })}
    </div>
  );
}

interface SelectTriggerProps {
  children: React.ReactNode;
  isOpen?: boolean;
  toggleOpen?: () => void;
}

export function SelectTrigger({ children, isOpen, toggleOpen }: SelectTriggerProps) {
  return (
    <button
      type="button"
      onClick={toggleOpen}
      className="flex items-center justify-between w-full py-2 px-3 border border-gray-300 rounded-md bg-white text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {children}
      <svg 
        className={`h-5 w-5 text-gray-400 ml-2 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 20 20" 
        fill="currentColor"
      >
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder: string }) {
  return <span>{placeholder}</span>;
}

interface SelectContentProps {
  children: React.ReactNode;
  isOpen?: boolean;
}

export function SelectContent({ children, isOpen }: SelectContentProps) {
  if (!isOpen) return null;
  
  return (
    <div className="absolute mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200 z-10">
      <ul className="py-1 max-h-60 overflow-auto">
        {children}
      </ul>
    </div>
  );
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  onValueChange?: (value: string) => void;
  toggleOpen?: () => void;
}

export function SelectItem({ value, children, onValueChange, toggleOpen }: SelectItemProps) {
  const handleClick = () => {
    if (onValueChange) onValueChange(value);
    if (toggleOpen) toggleOpen();
  };
  
  return (
    <li
      onClick={handleClick}
      className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
    >
      {children}
    </li>
  );
} 