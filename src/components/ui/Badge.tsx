import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'high' | 'medium' | 'low' | 'resolved' | 'pending' | 'processing' | 'responded';
  className?: string;
  pulse?: boolean;
  size?: 'sm' | 'md';
}

export function Badge({ children, variant = 'default', className = '', pulse = false, size = 'md' }: BadgeProps) {
  const variants: Record<string, string> = {
    default: 'bg-tech-blue/20 text-tech-blue border-tech-blue/50',
    high: 'bg-risk-high/20 text-risk-high border-risk-high/50',
    medium: 'bg-risk-medium/20 text-risk-medium border-risk-medium/50',
    low: 'bg-risk-low/20 text-risk-low border-risk-low/50',
    resolved: 'bg-risk-resolved/20 text-risk-resolved border-risk-resolved/50',
    pending: 'bg-risk-low/20 text-risk-low border-risk-low/50',
    processing: 'bg-risk-medium/20 text-risk-medium border-risk-medium/50',
    responded: 'bg-risk-resolved/20 text-risk-resolved border-risk-resolved/50',
  };

  const sizes: Record<string, string> = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-0.5 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded border',
        sizes[size],
        variants[variant],
        pulse && 'animate-pulse-fast',
        className
      )}
    >
      {(variant === 'high' || variant === 'medium') && size === 'md' ? (
        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1" />
      ) : null}
      {children}
    </span>
  );
}
