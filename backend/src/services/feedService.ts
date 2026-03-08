import { getDb } from '../database/connection.js';

export function createFeedEntry(
  userId: number,
  type: 'new_dish' | 'ranked_dish' | 'tried_friend_dish',
  dishId: number,
  metadata?: string
): void {
  const db = getDb();
  db.prepare(
    'INSERT INTO activity_feed (user_id, type, dish_id, metadata) VALUES (?, ?, ?, ?)'
  ).run(userId, type, dishId, metadata || null);
}

export function getFriendsFeed(userId: number, limit: number = 20, offset: number = 0): any[] {
  const db = getDb();

  return db.prepare(
    `SELECT af.*, u.username, u.avatar_url, d.name as dish_name, d.photo_path as dish_photo, d.rating as dish_rating
     FROM activity_feed af
     JOIN users u ON af.user_id = u.id
     LEFT JOIN dishes d ON af.dish_id = d.id
     WHERE af.user_id IN (
       SELECT CASE WHEN requester_id = ? THEN addressee_id ELSE requester_id END
       FROM friendships
       WHERE (requester_id = ? OR addressee_id = ?) AND status = 'accepted'
     )
     ORDER BY af.created_at DESC
     LIMIT ? OFFSET ?`
  ).all(userId, userId, userId, limit, offset);
}

export function getDiscoverFeed(userId: number, limit: number = 20, offset: number = 0): any[] {
  const db = getDb();

  return db.prepare(
    `SELECT d.*, u.username, u.avatar_url as owner_avatar
     FROM dishes d
     JOIN users u ON d.user_id = u.id
     WHERE d.user_id IN (
       SELECT CASE WHEN requester_id = ? THEN addressee_id ELSE requester_id END
       FROM friendships
       WHERE (requester_id = ? OR addressee_id = ?) AND status = 'accepted'
     )
     AND d.is_public = 1
     AND d.rating IS NOT NULL
     AND d.id NOT IN (SELECT dish_id FROM bookmarks WHERE user_id = ?)
     ORDER BY d.rating DESC
     LIMIT ? OFFSET ?`
  ).all(userId, userId, userId, userId, limit, offset);
}
