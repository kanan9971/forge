'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'secondary';

export function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variant === 'default' && 'border-zinc-700 bg-zinc-100 text-zinc-900',
        variant === 'secondary' && 'border-zinc-800 bg-zinc-900 text-zinc-200',
        className
      )}
      {...props}
    />
  );
}

