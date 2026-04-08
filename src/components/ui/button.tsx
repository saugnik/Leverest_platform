'use client';

import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  loading?: boolean;
  children: ReactNode;
}

const variantStyles = {
  gold: 'btn-gold',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
  danger: 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 hover:border-red-400/50 cursor-pointer transition-all duration-150 rounded-lg px-4 py-2 text-sm font-medium',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({
  variant = 'gold',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        variantStyles[variant],
        variant !== 'danger' && sizeStyles[size],
        'inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50',
        (disabled || loading) && 'opacity-50 pointer-events-none',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
        </svg>
      ) : Icon ? (
        <Icon size={size === 'sm' ? 13 : size === 'lg' ? 18 : 15} />
      ) : null}
      {children}
      {IconRight && !loading && <IconRight size={size === 'sm' ? 13 : size === 'lg' ? 18 : 15} />}
    </button>
  );
}
