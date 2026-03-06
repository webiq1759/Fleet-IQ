
import React from 'react';
import { Skeleton } from './Skeleton';

export const AssetDetailsSkeleton = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pb-20">
      <div className="max-w-7xl mx-auto px-0 lg:px-8 py-0 lg:py-6">
        
        {/* Header Skeleton */}
        <div className="hidden lg:block mb-6 px-4 lg:px-0 space-y-4">
           <Skeleton className="h-4 w-20" />
           <div className="flex justify-between items-start">
              <div className="space-y-2 w-1/2">
                 <Skeleton className="h-10 w-3/4" />
                 <div className="flex gap-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                 </div>
              </div>
              <div className="flex gap-2">
                 <Skeleton className="h-10 w-24 rounded-lg" />
                 <Skeleton className="h-10 w-24 rounded-lg" />
              </div>
           </div>
        </div>

        {/* Gallery Skeleton */}
        <div className="relative h-[300px] md:h-[500px] w-full lg:rounded-2xl overflow-hidden mb-8">
           <Skeleton className="w-full h-full !rounded-none lg:!rounded-2xl" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 px-4 lg:px-0">
           {/* Left Content */}
           <div className="lg:col-span-2 space-y-8">
              {/* Specs */}
              <div className="flex gap-4">
                 <Skeleton className="h-20 w-24 rounded-xl" />
                 <Skeleton className="h-20 w-24 rounded-xl" />
                 <Skeleton className="h-20 w-24 rounded-xl" />
              </div>

              {/* Description */}
              <div className="space-y-4 pt-4">
                 <Skeleton className="h-6 w-48" />
                 <Skeleton className="h-4 w-full" />
                 <Skeleton className="h-4 w-full" />
                 <Skeleton className="h-4 w-3/4" />
              </div>

              {/* Features */}
              <div className="space-y-4 pt-4">
                 <Skeleton className="h-6 w-48" />
                 <div className="grid grid-cols-2 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-6 w-full" />
                    ))}
                 </div>
              </div>
           </div>

           {/* Right Column: Booking Widget */}
           <div className="hidden lg:block lg:col-span-1">
              <div className="sticky top-24 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                 <div className="flex justify-between items-end mb-6">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-12" />
                 </div>
                 <Skeleton className="h-14 w-full rounded-lg mb-4" />
                 <Skeleton className="h-12 w-full rounded-lg mb-4" />
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                 </div>
                 <Skeleton className="h-10 w-full rounded-lg mt-6" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
