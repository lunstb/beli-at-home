import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ArrowUp, ArrowDown } from 'lucide-react';
import { UtensilsCrossed } from 'lucide-react';
import type { RankingResult as RankingResultType } from '../../types';
import { Confetti } from '../shared/Confetti';

interface RankingResultProps {
  result: RankingResultType;
}

export function RankingResult({ result }: RankingResultProps) {
  const navigate = useNavigate();
  const [displayScore, setDisplayScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowScore(true);
      setShowConfetti(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showScore) return;
    const target = result.newRating ?? 0;
    const duration = 1000;
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        setDisplayScore(target);
        clearInterval(interval);
      } else {
        setDisplayScore(current);
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [showScore, result.newRating]);

  return (
    <>
    <Confetti active={showConfetti} />
    <div className="flex flex-col items-center text-center py-8 animate-fade-in">
      <div className="w-48 h-48 rounded-2xl overflow-hidden shadow-lg mb-6 bg-stone-100">
        {result.anchorDish.photo_path ? (
          <img
            src={result.anchorDish.photo_path}
            alt={result.anchorDish.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300">
            <UtensilsCrossed size={48} />
          </div>
        )}
      </div>

      <h2 className="text-xl font-bold text-stone-800 mb-2">{result.anchorDish.name}</h2>

      {showScore && (
        <div className="animate-count-up">
          <div className="text-6xl font-bold text-[var(--color-primary)] mb-1">
            {displayScore.toFixed(1)}
          </div>
          <p className="text-stone-400 text-sm mb-4">out of 10</p>
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <Trophy size={20} className="text-yellow-500" />
        <span className="text-stone-700 font-semibold">
          Your #{result.rankPosition} meal of {result.totalDishes}
        </span>
      </div>

      {result.delta !== null && result.delta !== 0 && (
        <div
          className={`flex items-center gap-1 text-sm font-medium ${
            result.delta > 0 ? 'text-green-500' : 'text-red-500'
          }`}
        >
          {result.delta > 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
          {result.delta > 0 ? '+' : ''}{result.delta.toFixed(1)} from previous
        </div>
      )}

      <div className="flex gap-3 mt-8 w-full max-w-xs">
        <button
          onClick={() => navigate('/profile')}
          className="flex-1 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-xl hover:bg-[var(--color-primary-dark)] transition-colors text-sm"
        >
          View My Kitchen
        </button>
        <button
          onClick={() => navigate('/')}
          className="flex-1 py-3 bg-stone-100 text-stone-700 font-semibold rounded-xl hover:bg-stone-200 transition-colors text-sm"
        >
          Done
        </button>
      </div>
    </div>
    </>
  );
}
