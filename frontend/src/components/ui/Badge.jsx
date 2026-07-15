import React from 'react';
import { cn } from '../../utils/utils';

export function Badge({ children, variant = 'default', className, ...rest }) {
  // Base classes jo har badge pe hongi
  const baseStyles = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500";
  
  // Color variants
  const variants = {
    default: "bg-gray-800 text-gray-100 hover:bg-gray-700",
    primary: "bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30",
    success: "bg-green-600/20 text-green-400 border border-green-500/30",
    danger: "bg-red-600/20 text-red-400 border border-red-500/30",
    outline: "text-gray-300 border border-gray-600 hover:bg-gray-800"
  };

  return (
    <div 
      className={cn(baseStyles, variants[variant], className)} 
      {...rest}
    >
      {children}
    </div>
  );
}