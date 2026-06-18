import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className="flex-1 overflow-auto">
      <div className={`min-h-full p-6 ${className}`}>
        {children}
      </div>
    </div>
  );
}
