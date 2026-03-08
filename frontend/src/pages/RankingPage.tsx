import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Equal, SkipForward, UtensilsCrossed } from 'lucide-react';
import { ComparisonCard } from '../components/ranking/ComparisonCard';
import { ProgressDots } from '../components/ranking/ProgressDots';
import { RankingResult } from '../components/ranking/RankingResult';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { useToast } from '../components/shared/Toast';
import { startRankingSession, submitComparison, skipMatchup, getRankingResults } from '../api/ranking';
import type { Matchup, RankingResult as RankingResultType } from '../types';

export function RankingPage() {
  const { dishId } = useParams<{ dishId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [matchup, setMatchup] = useState<Matchup | null>(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [result, setResult] = useState<RankingResultType | null>(null);
  const [loading, setLoading] = useState(true);
  const [notEnough, setNotEnough] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);

  useEffect(() => {
    if (!dishId) return;
    startRankingSession(Number(dishId))
      .then((session) => {
        setSessionId(session.sessionId);
        setMatchup(session.matchup);
        setTotalRounds(session.totalRounds);
        setCurrentRound(session.currentRound);
        setLoading(false);
      })
      .catch((err: any) => {
        if (err.message && err.message.includes('at least 2')) {
          setNotEnough(true);
          setLoading(false);
        } else {
          toast(err.message || 'Something went wrong', 'error');
          navigate('/');
        }
      });
  }, [dishId, navigate]);

  const handleSelect = async (winnerId: number, loserId: number, isDraw = false) => {
    if (!sessionId || submitting) return;
    setSubmitting(true);
    if (!isDraw) setSelectedId(winnerId);

    // Brief pause for selection animation
    await new Promise((r) => setTimeout(r, 400));

    try {
      const res = await submitComparison(sessionId, winnerId, loserId, isDraw);
      if (res.nextMatchup === null) {
        // Session complete - fetch results
        const results = await getRankingResults(sessionId);
        setResult(results);
      } else {
        setAnimatingOut(true);
        await new Promise((r) => setTimeout(r, 250));
        setMatchup(res.nextMatchup);
        setCurrentRound(res.currentRound);
        setSelectedId(null);
        setAnimatingOut(false);
      }
    } catch (err: any) {
      toast(err.message || 'Something went wrong', 'error');
    }
    setSubmitting(false);
  };

  const handleSkip = async () => {
    if (!sessionId || !matchup || submitting) return;
    setSubmitting(true);
    try {
      const res = await skipMatchup(sessionId, matchup.opponentDish.id);
      if (res.nextMatchup) {
        setAnimatingOut(true);
        await new Promise((r) => setTimeout(r, 250));
        setMatchup(res.nextMatchup);
        setCurrentRound((prev) => prev + 1);
        setSelectedId(null);
        setAnimatingOut(false);
      }
    } catch (err: any) {
      toast(err.message || 'Something went wrong', 'error');
    }
    setSubmitting(false);
  };

  if (loading) return <LoadingSpinner />;

  if (notEnough) {
    return (
      <div className="max-w-lg mx-auto px-4 pb-24 md:pb-8">
        <div className="flex items-center gap-3 py-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-xl hover:bg-stone-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-stone-600" />
          </button>
        </div>
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <UtensilsCrossed size={32} className="text-[var(--color-primary)]" />
          </div>
          <h2 className="text-lg font-bold text-stone-800 mb-2">Not enough meals yet</h2>
          <p className="text-sm text-stone-500 mb-6">
            Add at least 2 meals to start ranking them against each other.
          </p>
          <button
            onClick={() => navigate('/dishes/new')}
            className="px-6 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-xl hover:bg-[var(--color-primary-dark)] transition-colors text-sm"
          >
            Add a Meal
          </button>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="max-w-lg mx-auto px-4 pb-24 md:pb-8">
        <RankingResult result={result} />
      </div>
    );
  }

  if (!matchup) return null;

  return (
    <div className="max-w-lg mx-auto px-4 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 py-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-xl hover:bg-stone-100 transition-colors"
        >
          <ArrowLeft size={20} className="text-stone-600" />
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold text-stone-800">Which was better?</h1>
          <p className="text-xs text-stone-400">
            Round {currentRound} of {totalRounds}
          </p>
        </div>
        <div className="w-9" /> {/* spacer */}
      </div>

      <ProgressDots currentRound={currentRound - 1} totalRounds={totalRounds} />

      {/* Matchup cards */}
      <div
        className={`grid grid-cols-2 gap-3 mt-6 transition-all duration-250 ${
          animatingOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        <ComparisonCard
          dish={matchup.anchorDish}
          selected={selectedId === matchup.anchorDish.id}
          onSelect={() => handleSelect(matchup.anchorDish.id, matchup.opponentDish.id)}
        />
        <ComparisonCard
          dish={matchup.opponentDish}
          selected={selectedId === matchup.opponentDish.id}
          onSelect={() => handleSelect(matchup.opponentDish.id, matchup.anchorDish.id)}
        />
      </div>

      {/* Action buttons */}
      <div className="mt-6 space-y-3">
        <button
          onClick={() =>
            handleSelect(matchup.anchorDish.id, matchup.opponentDish.id, true)
          }
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-3 bg-stone-100 text-stone-600 font-medium rounded-xl hover:bg-stone-200 transition-colors text-sm disabled:opacity-50"
        >
          <Equal size={18} />
          Too Close to Call
        </button>
        <button
          onClick={handleSkip}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-2 text-stone-400 font-medium text-sm hover:text-stone-600 transition-colors disabled:opacity-50"
        >
          <SkipForward size={16} />
          Skip
        </button>
      </div>
    </div>
  );
}
