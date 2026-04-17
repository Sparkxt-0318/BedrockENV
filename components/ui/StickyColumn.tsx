'use client';

import type { ReactNode } from 'react';

interface StickyColumnProps {
  left: ReactNode;
  right: ReactNode;
  className?: string;
}

export function StickyColumn({ left, right, className = '' }: StickyColumnProps) {
  return (
    <div className={`flex flex-col lg:flex-row lg:gap-12 ${className}`}>
      <div className="flex-1 min-w-0">{left}</div>
      <aside className="w-full lg:w-[40%] lg:shrink-0 lg:sticky lg:top-24 lg:self-start">
        {right}
      </aside>
    </div>
  );
}
