import React from 'react';
import { cn } from '../../utils/utils';

export const Button = React.forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading,
  icon,
  className, 
  ...rest 
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed gap-2";
  
  const variants = {
    primary: "bg-purple-600 text-white hover:bg-purple-700",
    secondary: "bg-gray-800 text-gray-100 hover:bg-gray-700",
    danger: "bg-red-500 text-white hover:bg-red-600",
    ghost: "hover:bg-gray-800 text-gray-300"
  };

  const sizes = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4",
    lg: "h-12 px-8 text-lg",
    icon: "h-10 w-10" // For buttons that only contain an icon
  };

  return (
    <button 
      ref={ref}
      className={cn(baseStyles, variants[variant], sizes[size], className)} 
      disabled={isLoading || rest.disabled}
      {...rest}
    >
      {isLoading ? (
        <span className="animate-spin mr-2">⏳</span> // Placeholder spinner
      ) : icon ? (
        icon
      ) : null}
      {children}
    </button>
  );
});

Button.displayName = 'Button';
