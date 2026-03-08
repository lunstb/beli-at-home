interface ProgressDotsProps {
  currentRound: number;
  totalRounds: number;
}

export function ProgressDots({ currentRound, totalRounds }: ProgressDotsProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalRounds }, (_, i) => (
        <div
          key={i}
          className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
            i < currentRound
              ? 'bg-[var(--color-primary)]'
              : i === currentRound
              ? 'bg-[var(--color-primary-light)] scale-125'
              : 'bg-stone-200'
          }`}
        />
      ))}
    </div>
  );
}
