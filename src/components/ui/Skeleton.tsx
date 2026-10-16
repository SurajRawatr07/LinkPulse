import React from 'react';
import { cn } from '../../lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse bg-slate-200 dark:bg-slate-800 rounded-md', className)}
      {...props}
    />
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 py-3 px-4 border-b border-slate-100 dark:border-slate-800/80 animate-pulse">
      <Skeleton className="h-4 w-4 rounded shrink-0" />
      <Skeleton className="h-4 w-32 shrink-0" />
      <Skeleton className="h-4 flex-1 hidden sm:block" />
      {Array.from({ length: columns - 3 }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-20 shrink-0" />
      ))}
      <Skeleton className="h-7 w-7 rounded shrink-0 ml-auto" />
    </div>
  );
}
