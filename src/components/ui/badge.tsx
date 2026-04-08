'use client';

import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'gold' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
  className?: string;
}

const variantMap: Record<string, string> = {
  default: 'bg-slate-500/15 text-slate-300 border-slate-500/25',
  gold: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
  success: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
  warning: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
  danger: 'bg-red-400/15 text-red-300 border-red-400/30',
  info: 'bg-blue-400/15 text-blue-300 border-blue-400/30',
  muted: 'bg-white/5 text-slate-400 border-white/8',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'badge',
        variantMap[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
