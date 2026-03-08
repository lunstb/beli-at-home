import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  heading: string;
  subtext: string;
  action?: ReactNode;
}

export function EmptyState({ icon, heading, subtext, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in">
      <div className="text-stone-300 mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-stone-700 mb-2">{heading}</h3>
      <p className="text-stone-400 text-sm max-w-xs mb-6">{subtext}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
