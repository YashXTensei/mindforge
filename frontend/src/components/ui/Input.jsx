// Small illustrative snippet of the structure
import React, { useId } from 'react';
import { cn } from '../../utils/utils'; // tumhara banaya hua utility

export const Input = React.forwardRef(({ label, error, className, id, ...rest }, ref) => {
  // Agar parent id nahi deta, toh auto-generate karo for accessibility
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label htmlFor={inputId} className="text-sm font-medium text-gray-300">{label}</label>}
      <input
        id={inputId}
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-red-500 focus-visible:ring-red-500", // Error override
          className
        )}
        {...rest}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input'; // React DevTools ke liye zaroori hai jab forwardRef use hota hai