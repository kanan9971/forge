'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'default' | 'outline' | 'destructive' | 'ghost';
type ButtonSize = 'default' | 'icon';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  className,
  variant = 'default',
  size = 'default',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50',
        variant === 'default' && 'bg-white text-black hover:bg-zinc-200',
        variant === 'outline' && 'border border-zinc-700 bg-transparent hover:bg-zinc-900',
        variant === 'destructive' && 'bg-red-600 text-white hover:bg-red-700',
        variant === 'ghost' && 'bg-transparent hover:bg-zinc-900',
        size === 'default' && 'h-10 px-4 py-2',
        size === 'icon' && 'h-10 w-10 p-0',
        className
      )}
      {...props}
    />
  );
}

