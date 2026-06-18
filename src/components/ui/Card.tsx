import { ReactNode, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  borderColor?: string;
  glow?: boolean;
}

export function Card({ children, className = '', borderColor = '', glow = false, style, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'bg-card-bg border border-card-border rounded-lg p-4 shadow-card transition-all duration-300',
        glow && 'hover:shadow-card-hover hover:-translate-y-0.5',
        borderColor,
        className
      )}
      style={style}
      {...rest}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

Card.Header = function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-4 pb-3 border-b border-card-border', className)}>
      {children}
    </div>
  );
};

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

Card.Title = function CardTitle({ children, className = '' }: CardTitleProps) {
  return (
    <h3 className={cn('text-base font-semibold text-text-primary font-sans', className)}>
      {children}
    </h3>
  );
};

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

Card.Content = function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={className}>{children}</div>;
};
