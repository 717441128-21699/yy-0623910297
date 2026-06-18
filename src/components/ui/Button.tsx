import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '',
  disabled,
  ...props 
}: ButtonProps) {
  const baseStyles = 'font-medium rounded-md transition-all duration-200 flex items-center justify-center gap-2 active:scale-95';
  
  const variants = {
    primary: 'bg-tech-blue hover:bg-tech-blue/90 text-white hover:shadow-glow-blue',
    secondary: 'bg-card-border hover:bg-card-border/80 text-text-primary',
    danger: 'bg-risk-high hover:bg-risk-high/90 text-white hover:shadow-glow-red',
    success: 'bg-risk-resolved hover:bg-risk-resolved/90 text-white',
    ghost: 'bg-transparent hover:bg-white/5 text-text-secondary hover:text-text-primary border border-transparent hover:border-card-border',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed hover:shadow-none',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
