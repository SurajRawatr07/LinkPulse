import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/30 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap shrink-0 cursor-pointer rounded-xl select-none';

    const variants = {
      primary:
        'pearl-btn-dark active:translate-y-px',
      secondary:
        'pearl-btn-pearl active:translate-y-px',
      outline:
        'border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-800 shadow-2xs active:translate-y-px',
      ghost:
        'bg-transparent hover:bg-neutral-100 text-neutral-700 hover:text-neutral-900 active:translate-y-px',
      danger:
        'bg-red-600 hover:bg-red-700 text-white shadow-xs border border-red-700/20 active:translate-y-px',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 h-8 gap-1.5',
      md: 'text-sm px-4 py-2 h-9.5 gap-2',
      lg: 'text-sm sm:text-[15px] px-5 py-2.5 h-11 gap-2.5 font-semibold',
      icon: 'h-9 w-9 p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
