import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`animate-pulse bg-gray-200 rounded-md ${className}`} />
  );
};

export const MarketSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-3xl p-3 space-y-3 shadow-sm border border-gray-100">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="space-y-2 px-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex justify-between items-center pt-1">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-8" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkillSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 p-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-[32px] p-5 shadow-sm border border-gray-100 space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex gap-3">
              <Skeleton className="w-10 h-10 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex justify-between items-center pt-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-24 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const WantedSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 p-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const ReadSkeleton: React.FC = () => {
  return (
    <div className="p-6 space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-4 w-32" />
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-[32px]" />
          <Skeleton className="h-48 w-full rounded-[32px]" />
        </div>
      </div>
    </div>
  );
};
