
import React from 'react';
import { Skeleton } from './Skeleton';

interface DashboardSkeletonProps {
  type?: 'table' | 'cards';
  count?: number;
}

export const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({ type = 'table', count = 5 }) => {
  
  if (type === 'cards') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="p-6 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div className="flex justify-between mb-4">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-32" />
                </div>
            ))}
        </div>
      );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        <div className="p-0">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="flex items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800 last:border-0 gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-24" />
                </div>
            ))}
        </div>
    </div>
  );
};
