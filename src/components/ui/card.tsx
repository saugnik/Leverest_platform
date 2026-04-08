'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  gold?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover = false, gold = false, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'glass-card rounded-xl',
        hover && 'glass-card-hover',
        gold && 'gold-border',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between px-5 py-4 border-b border-white/5', className)}>
      {children}
    </div>
  );
}

export function CardBody({ children, className }: CardHeaderProps) {
  return <div className={cn('p-5', className)}>{children}</div>;
}

export function CardFooter({ children, className }: CardHeaderProps) {
  return (
    <div className={cn('px-5 py-3 border-t border-white/5 flex items-center justify-between', className)}>
      {children}
    </div>
  );
}
