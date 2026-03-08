import { formatScore } from '../../utils/formatters';
import { getScoreColor } from '../../utils/constants';

interface ScoreBadgeProps {
  rating: number | null | undefined;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreBadge({ rating, size = 'md' }: ScoreBadgeProps) {
  const colors = getScoreColor(rating);
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
  };

  return (
    <div
      className={`${sizeClasses[size]} ${colors.bg} ${colors.border} ${colors.color} border-2 rounded-full flex items-center justify-center font-bold shrink-0`}
    >
      {formatScore(rating)}
    </div>
  );
}
