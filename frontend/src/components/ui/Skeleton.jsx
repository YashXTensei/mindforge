import React from 'react';

// Base Skeleton Block
export function Skeleton({ className = '' }) {
    return (
        <div className={`animate-pulse bg-gray-700/50 rounded-md ${className}`} />
    );
}

// Specific Skeleton for Document/Resource Cards
export function CardSkeleton() {
    return (
        <div className="flex items-center gap-4 p-4 bg-gray-800/30 border border-gray-700/50 rounded-lg">
            {/* Icon Skeleton */}
            <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
            
            {/* Content Skeleton */}
            <div className="flex-1 space-y-3">
                {/* Title */}
                <Skeleton className="h-4 w-3/4" />
                
                {/* Meta info (Size, pages, category) */}
                <div className="flex gap-3">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-20" />
                </div>

                {/* Tags */}
                <div className="flex gap-2 mt-1">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                </div>
            </div>
        </div>
    );
}
