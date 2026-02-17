'use client';

import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';

import 'react-day-picker/dist/style.css';

type Props = React.ComponentProps<typeof DayPicker> & {
  className?: string;
};

export function Calendar({ className, ...props }: Props) {
  return (
    <div className={cn('rounded-2xl border border-zinc-800 bg-zinc-950 p-3', className)}>
      <DayPicker
        showOutsideDays
        classNames={{
          caption: 'flex justify-between items-center mb-2 text-zinc-100',
          caption_label: 'text-sm font-medium',
          nav: 'flex items-center gap-2',
          nav_button:
            'h-8 w-8 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-200',
          table: 'w-full border-collapse',
          head_row: 'flex',
          head_cell: 'text-zinc-500 w-10 text-xs font-medium',
          row: 'flex w-full mt-2',
          cell: 'w-10 h-10 text-center text-sm p-0 relative',
          day: 'w-10 h-10 rounded-xl hover:bg-zinc-900 text-zinc-100',
          day_selected: 'bg-blue-600 hover:bg-blue-600 text-white',
          day_today: 'border border-zinc-700',
          day_outside: 'text-zinc-700',
        }}
        {...props}
      />
    </div>
  );
}

