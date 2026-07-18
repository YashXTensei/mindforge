import React from 'react';

// Tum chaho toh apna Button component yahan import karke use kar sakte ho
// import { Button } from './Button'; 

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center min-h-[300px] border-2 border-dashed border-gray-700/50 rounded-xl bg-gray-800/20 transition-colors">
      
      {/* Icon Area */}
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-800 text-purple-400">
          {icon}
        </div>
      )}
      
      {/* Text Area */}
      <h3 className="mb-2 text-lg font-semibold text-gray-100">{title}</h3>
      
      {description && (
        <p className="mb-6 max-w-sm text-sm text-gray-400">
          {description}
        </p>
      )}
      
      {/* Optional Action Button (e.g. Create Note, Upload PDF) */}
      {action && (
        <div>
          {action}
        </div>
      )}
      
    </div>
  );
}