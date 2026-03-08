import { post, get } from './client';
import type { RankingSession, RankingCompareResult, RankingResult } from '../types';

export function startRankingSession(dishId: number): Promise<RankingSession> {
  return post('/api/ranking/session', { dishId });
}

export function submitComparison(
  sessionId: string,
  winnerDishId: number,
  loserDishId: number,
  isDraw?: boolean
): Promise<RankingCompareResult> {
  return post('/api/ranking/compare', { sessionId, winnerDishId, loserDishId, isDraw });
}

export function skipMatchup(sessionId: string, skippedDishId: number): Promise<RankingCompareResult> {
  return post('/api/ranking/skip', { sessionId, skippedDishId });
}

export function getRankingResults(sessionId: string): Promise<RankingResult> {
  return get(`/api/ranking/results/${sessionId}`);
}
