import React from 'react';
import { Skeleton } from './Skeleton';
import { SidebarCard } from './SidebarCard';

export function HeroSkeleton() {
  return (
    <div className="relative w-full overflow-hidden bg-[#0e0f11] pt-6 pb-8 md:pt-10 md:pb-12 px-4 sm:px-6">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row gap-6 md:gap-12 items-center">
        <div className="w-full md:w-[45%] lg:w-[50%] z-10 flex flex-col gap-4">
          <Skeleton className="h-10 sm:h-12 w-3/4" />
          <Skeleton className="h-10 sm:h-12 w-1/2" />
          
          <div className="flex flex-wrap gap-2 mt-1">
            <Skeleton className="h-5 w-10" />
            <Skeleton className="h-5 w-10" />
            <Skeleton className="h-5 w-10" />
          </div>
          
          <div className="mt-2 flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          
          <div className="mt-4">
            <Skeleton className="h-12 w-40 rounded" />
          </div>
          
          <div className="flex items-center gap-1.5 mt-6">
            <Skeleton className="w-2 h-2 rounded-full" />
            <Skeleton className="w-2 h-2 rounded-full" />
            <Skeleton className="w-2 h-2 rounded-full" />
            <Skeleton className="w-2 h-2 rounded-full" />
            <Skeleton className="w-2 h-2 rounded-full" />
          </div>
        </div>

        <div className="w-full md:w-[55%] lg:w-[50%] h-[200px] sm:h-[300px] md:h-[350px] lg:h-[400px]">
          <Skeleton className="w-full h-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function AnimeGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="aspect-[3/4] w-full rounded-md" />
          <Skeleton className="h-4 w-full mt-1" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="flex flex-col">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3 border-b border-[#1c1c22] px-2 -mx-2">
          <Skeleton className="w-8 h-8 rounded" />
          <Skeleton className="w-12 h-16 shrink-0 rounded" />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
