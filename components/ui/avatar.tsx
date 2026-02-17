'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export function Avatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-zinc-800 bg-zinc-900',
        className
      )}
      {...props}
    />
  );
}

export function AvatarFallback({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-zinc-800 text-sm font-medium text-zinc-100',
        className
      )}
      {...props}
    />
  );
}

