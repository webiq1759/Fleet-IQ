
import React from 'react';

export const AssetCardSkeleton = () => {
   return (
      <div className="bg-white rounded-xl overflow-hidden border border-slate-200 h-full flex flex-col animate-pulse">
         {/* Image Placeholder */}
         <div className="aspect-[4/3] w-full bg-slate-200 relative"></div>

         {/* Content Placeholders */}
         <div className="p-4 flex flex-col flex-1">
            {/* Title and Rating */}
            <div className="flex justify-between items-start mb-2">
               <div className="h-5 bg-slate-200 rounded w-3/4"></div>
               <div className="h-5 bg-slate-200 rounded w-1/4"></div>
            </div>

            {/* Location */}
            <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>

            {/* Specs */}
            <div className="flex gap-2 mb-4 overflow-hidden">
               <div className="h-6 w-20 bg-slate-200 rounded"></div>
               <div className="h-6 w-20 bg-slate-200 rounded"></div>
               <div className="h-6 w-20 bg-slate-200 rounded"></div>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
               <div className="space-y-1">
                  <div className="h-6 w-16 bg-slate-200 rounded"></div>
                  <div className="h-3 w-8 bg-slate-200 rounded"></div>
               </div>
               <div className="h-9 w-24 bg-slate-200 rounded-lg"></div>
            </div>
         </div>
      </div>
   );
};
