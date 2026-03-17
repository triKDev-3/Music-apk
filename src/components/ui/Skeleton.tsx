import React from 'react';

function Base({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded ${className}`}
      style={{ background: 'var(--bg-card)' }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="p-4 rounded-lg" style={{ background: 'var(--bg-card)' }}>
      <Base className="aspect-square rounded-md mb-4 w-full" />
      <Base className="h-4 w-3/4 mb-2" />
      <Base className="h-3 w-1/2" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-2">
      <Base className="w-6 h-4" />
      <Base className="w-10 h-10 rounded" />
      <div className="flex-1 space-y-2">
        <Base className="h-4 w-1/3" />
        <Base className="h-3 w-1/4" />
      </div>
      <Base className="h-3 w-16" />
      <Base className="h-3 w-8" />
    </div>
  );
}
