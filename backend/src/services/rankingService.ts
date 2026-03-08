import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../database/connection.js';
import { createFeedEntry } from './feedService.js';
import type { Dish } from '../types/index.js';

const K = 32;

interface RankingSession {
  userId: number;
  anchorDishId: number;
  opponents: number[];
  currentRound: number;
  totalRounds: number;
  previousAnchorRating: number | null;
}

// In-memory store for active sessions
const activeSessions = new Map<string, RankingSession>();

function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function selectOpponents(userId: number, anchorDishId: number, count: number): number[] {
  const db = getDb();

  const anchorDish = db.prepare('SELECT * FROM dishes WHERE id = ? AND user_id = ?').get(anchorDishId, userId) as Dish | undefined;
  if (!anchorDish) return [];

  const allDishes = db.prepare(
    'SELECT * FROM dishes WHERE user_id = ? AND id != ? ORDER BY elo_score ASC'
  ).all(userId, anchorDishId) as Dish[];

  if (allDishes.length === 0) return [];

  const selected: number[] = [];

  if (anchorDish.ranking_count === 0) {
    // New dish: pick dishes spread across the elo range
    if (allDishes.length <= count) {
      return allDishes.map(d => d.id);
    }
    const step = allDishes.length / count;
    for (let i = 0; i < count; i++) {
      const index = Math.min(Math.floor(i * step + step / 2), allDishes.length - 1);
      if (!selected.includes(allDishes[index].id)) {
        selected.push(allDishes[index].id);
      }
    }
    // Fill remaining if duplicates removed some
    for (const d of allDishes) {
      if (selected.length >= count) break;
      if (!selected.includes(d.id)) {
        selected.push(d.id);
      }
    }
  } else {
    // Existing dish: pick closest elo
    const sorted = [...allDishes].sort(
      (a, b) => Math.abs(a.elo_score - anchorDish.elo_score) - Math.abs(b.elo_score - anchorDish.elo_score)
    );
    for (let i = 0; i < Math.min(count, sorted.length); i++) {
      selected.push(sorted[i].id);
    }
  }

  return selected;
}

export function startSession(userId: number, dishId: number): {
  sessionId: string;
  matchup: { anchorDish: Dish; opponentDish: Dish };
  totalRounds: number;
  currentRound: number;
} {
  const db = getDb();

  const totalDishes = db.prepare('SELECT COUNT(*) as count FROM dishes WHERE user_id = ?').get(userId) as { count: number };
  if (totalDishes.count < 2) {
    throw new Error('You need at least 2 dishes to start ranking');
  }

  const anchorDish = db.prepare('SELECT * FROM dishes WHERE id = ? AND user_id = ?').get(dishId, userId) as Dish | undefined;
  if (!anchorDish) {
    throw new Error('Dish not found');
  }

  const totalRounds = Math.min(Math.max(Math.floor(totalDishes.count / 2), 3), 4);
  const actualRounds = Math.min(totalRounds, totalDishes.count - 1);

  const opponents = selectOpponents(userId, dishId, actualRounds);
  if (opponents.length === 0) {
    throw new Error('No opponents available');
  }

  const sessionId = uuidv4();
  activeSessions.set(sessionId, {
    userId,
    anchorDishId: dishId,
    opponents,
    currentRound: 0,
    totalRounds: opponents.length,
    previousAnchorRating: anchorDish.rating,
  });

  const opponentDish = db.prepare('SELECT * FROM dishes WHERE id = ?').get(opponents[0]) as Dish;
  anchorDish.is_public = Boolean(anchorDish.is_public);
  opponentDish.is_public = Boolean(opponentDish.is_public);

  return {
    sessionId,
    matchup: { anchorDish, opponentDish },
    totalRounds: opponents.length,
    currentRound: 1,
  };
}

export function submitComparison(
  userId: number,
  sessionId: string,
  winnerDishId: number,
  loserDishId: number,
  isDraw: boolean = false
): {
  nextMatchup: { anchorDish: Dish; opponentDish: Dish } | null;
  currentRound: number;
  totalRounds: number;
} {
  const db = getDb();
  const session = activeSessions.get(sessionId);

  if (!session || session.userId !== userId) {
    throw new Error('Invalid session');
  }

  // Get current elo scores
  const dishA = db.prepare('SELECT * FROM dishes WHERE id = ?').get(winnerDishId) as Dish;
  const dishB = db.prepare('SELECT * FROM dishes WHERE id = ?').get(loserDishId) as Dish;

  if (!dishA || !dishB) {
    throw new Error('Dish not found');
  }

  const eA = expectedScore(dishA.elo_score, dishB.elo_score);
  const eB = expectedScore(dishB.elo_score, dishA.elo_score);

  let newEloA: number;
  let newEloB: number;

  if (isDraw) {
    newEloA = dishA.elo_score + K * (0.5 - eA);
    newEloB = dishB.elo_score + K * (0.5 - eB);
  } else {
    newEloA = dishA.elo_score + K * (1 - eA);
    newEloB = dishB.elo_score + K * (0 - eB);
  }

  // Update elo scores and ranking counts
  db.prepare('UPDATE dishes SET elo_score = ?, ranking_count = ranking_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(newEloA, winnerDishId);
  db.prepare('UPDATE dishes SET elo_score = ?, ranking_count = ranking_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(newEloB, loserDishId);

  // Record comparison
  db.prepare(
    'INSERT INTO comparisons (user_id, winner_dish_id, loser_dish_id, session_id) VALUES (?, ?, ?, ?)'
  ).run(userId, winnerDishId, loserDishId, sessionId);

  // Advance session
  session.currentRound++;

  // Check if session is complete
  if (session.currentRound >= session.totalRounds) {
    return {
      nextMatchup: null,
      currentRound: session.currentRound,
      totalRounds: session.totalRounds,
    };
  }

  // Get next opponent
  const nextOpponentId = session.opponents[session.currentRound];
  const anchorDish = db.prepare('SELECT * FROM dishes WHERE id = ?').get(session.anchorDishId) as Dish;
  const opponentDish = db.prepare('SELECT * FROM dishes WHERE id = ?').get(nextOpponentId) as Dish;
  anchorDish.is_public = Boolean(anchorDish.is_public);
  opponentDish.is_public = Boolean(opponentDish.is_public);

  return {
    nextMatchup: { anchorDish, opponentDish },
    currentRound: session.currentRound + 1,
    totalRounds: session.totalRounds,
  };
}

export function skipComparison(
  userId: number,
  sessionId: string,
  skippedDishId: number
): {
  nextMatchup: { anchorDish: Dish; opponentDish: Dish } | null;
  currentRound: number;
  totalRounds: number;
} {
  const db = getDb();
  const session = activeSessions.get(sessionId);

  if (!session || session.userId !== userId) {
    throw new Error('Invalid session');
  }

  // Try to find a replacement opponent
  const usedOpponents = new Set(session.opponents);
  usedOpponents.add(skippedDishId);
  usedOpponents.add(session.anchorDishId);

  const replacement = db.prepare(
    `SELECT id FROM dishes WHERE user_id = ? AND id NOT IN (${Array.from(usedOpponents).map(() => '?').join(',')})
     ORDER BY ABS(elo_score - (SELECT elo_score FROM dishes WHERE id = ?)) ASC LIMIT 1`
  ).get(userId, ...Array.from(usedOpponents), session.anchorDishId) as { id: number } | undefined;

  if (replacement) {
    // Replace current opponent
    session.opponents[session.currentRound] = replacement.id;

    const anchorDish = db.prepare('SELECT * FROM dishes WHERE id = ?').get(session.anchorDishId) as Dish;
    const opponentDish = db.prepare('SELECT * FROM dishes WHERE id = ?').get(replacement.id) as Dish;
    anchorDish.is_public = Boolean(anchorDish.is_public);
    opponentDish.is_public = Boolean(opponentDish.is_public);

    return {
      nextMatchup: { anchorDish, opponentDish },
      currentRound: session.currentRound + 1,
      totalRounds: session.totalRounds,
    };
  }

  // No replacement available, end session early
  session.currentRound = session.totalRounds;
  return {
    nextMatchup: null,
    currentRound: session.currentRound,
    totalRounds: session.totalRounds,
  };
}

export function getSessionResults(userId: number, sessionId: string): {
  anchorDish: Dish;
  newRating: number | null;
  rankPosition: number;
  totalDishes: number;
  delta: number | null;
} {
  const session = activeSessions.get(sessionId);
  if (!session || session.userId !== userId) {
    throw new Error('Invalid session');
  }

  const db = getDb();

  // Recalculate all ratings
  recalculateRatings(userId);

  // Get updated anchor dish
  const anchorDish = db.prepare('SELECT * FROM dishes WHERE id = ?').get(session.anchorDishId) as Dish;
  anchorDish.is_public = Boolean(anchorDish.is_public);

  // Get rank position
  const ranked = db.prepare(
    'SELECT id FROM dishes WHERE user_id = ? ORDER BY elo_score DESC'
  ).all(userId) as { id: number }[];

  const rankPosition = ranked.findIndex(d => d.id === session.anchorDishId) + 1;

  // Calculate delta
  let delta: number | null = null;
  if (session.previousAnchorRating !== null && anchorDish.rating !== null) {
    delta = anchorDish.rating - session.previousAnchorRating;
  }

  // Create activity feed entry
  createFeedEntry(userId, 'ranked_dish', session.anchorDishId, JSON.stringify({
    rating: anchorDish.rating,
    rank: rankPosition,
  }));

  // Clean up session
  activeSessions.delete(sessionId);

  return {
    anchorDish,
    newRating: anchorDish.rating,
    rankPosition,
    totalDishes: ranked.length,
    delta,
  };
}

export function recalculateRatings(userId: number): void {
  const db = getDb();

  const dishes = db.prepare(
    'SELECT * FROM dishes WHERE user_id = ? ORDER BY elo_score DESC'
  ).all(userId) as Dish[];

  if (dishes.length === 0) return;

  if (dishes.length === 1) {
    // Single dish gets null rating (not enough data)
    db.prepare('UPDATE dishes SET rating = NULL WHERE id = ?').run(dishes[0].id);
    return;
  }

  // Only rate dishes that have been ranked at least once
  const rankedDishes = dishes.filter(d => d.ranking_count > 0);
  const unrankedDishes = dishes.filter(d => d.ranking_count === 0);

  if (rankedDishes.length === 0) {
    // No ranked dishes, set all to null
    const stmt = db.prepare('UPDATE dishes SET rating = NULL WHERE id = ?');
    for (const dish of dishes) {
      stmt.run(dish.id);
    }
    return;
  }

  if (rankedDishes.length === 1) {
    // Only one ranked dish, give it a 5.0
    db.prepare('UPDATE dishes SET rating = 5.0 WHERE id = ?').run(rankedDishes[0].id);
    for (const dish of unrankedDishes) {
      db.prepare('UPDATE dishes SET rating = NULL WHERE id = ?').run(dish.id);
    }
    return;
  }

  // Map elo range to display ratings
  const highestElo = rankedDishes[0].elo_score;
  const lowestElo = rankedDishes[rankedDishes.length - 1].elo_score;
  const floor = rankedDishes.length > 5 ? 2.0 : 0.0;
  const ceiling = 10.0;

  const eloRange = highestElo - lowestElo;

  const stmt = db.prepare('UPDATE dishes SET rating = ? WHERE id = ?');

  // Tier clamp ranges: bad = 0-3.9, ok = 4.0-6.9, great = 7.0-10.0
  const tierRanges: Record<string, [number, number]> = {
    bad: [0, 3.9],
    ok: [4.0, 6.9],
    great: [7.0, 10.0],
  };

  for (const dish of rankedDishes) {
    let rating: number;
    if (eloRange === 0) {
      rating = (ceiling + floor) / 2;
    } else {
      const normalized = (dish.elo_score - lowestElo) / eloRange;
      rating = floor + normalized * (ceiling - floor);
    }

    // Clamp to tier range if tier is set
    if (dish.tier && tierRanges[dish.tier]) {
      const [min, max] = tierRanges[dish.tier];
      rating = Math.max(min, Math.min(max, rating));
    }

    // Round to 1 decimal
    rating = Math.round(rating * 10) / 10;
    stmt.run(rating, dish.id);
  }

  // Unranked dishes get null rating
  for (const dish of unrankedDishes) {
    stmt.run(null, dish.id);
  }
}
