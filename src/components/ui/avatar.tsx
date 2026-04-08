'use client';

import { cn } from '@/lib/utils';

interface AvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  src?: string;
}

const sizeMap = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

const colorPool = [
  'from-amber-500 to-yellow-600',
  'from-blue-500 to-blue-600',
  'from-emerald-500 to-green-600',
  'from-purple-500 to-violet-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-teal-600',
  'from-orange-500 to-orange-600',
];

function getColor(name: string): string {
  const idx = name.charCodeAt(0) % colorPool.length;
  return colorPool[idx];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function Avatar({ name, size = 'md', className, src }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover border border-white/10', sizeMap[size], className)}
      />
    );
  }
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold bg-gradient-to-br text-white flex-shrink-0',
        sizeMap[size],
        getColor(name),
        className
      )}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}
