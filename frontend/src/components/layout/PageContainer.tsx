import type { ReactNode } from 'react';

export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-2xl mx-auto px-4 pb-24 md:pb-8 md:ml-20">
      {children}
    </div>
  );
}
