import { getDb } from '../database/connection.js';
import { areFriends } from './friendService.js';

export function addBookmark(userId: number, dishId: number): void {
  const db = getDb();

  const dish = db.prepare('SELECT * FROM dishes WHERE id = ?').get(dishId) as any;
  if (!dish) {
    throw new Error('Dish not found');
  }

  if (dish.user_id === userId) {
    throw new Error('Cannot bookmark your own dish');
  }

  if (!dish.is_public) {
    throw new Error('Cannot bookmark a private dish');
  }

  if (!areFriends(userId, dish.user_id)) {
    throw new Error('Can only bookmark dishes from friends');
  }

  db.prepare('INSERT OR IGNORE INTO bookmarks (user_id, dish_id) VALUES (?, ?)').run(userId, dishId);
}

export function removeBookmark(userId: number, dishId: number): void {
  const db = getDb();
  db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND dish_id = ?').run(userId, dishId);
}

export function getBookmarks(userId: number, limit: number = 50, offset: number = 0): any[] {
  const db = getDb();

  return db.prepare(
    `SELECT b.id as bookmark_id, b.created_at as bookmarked_at,
            d.*, u.username as owner_username, u.avatar_url as owner_avatar
     FROM bookmarks b
     JOIN dishes d ON b.dish_id = d.id
     JOIN users u ON d.user_id = u.id
     WHERE b.user_id = ?
     ORDER BY b.created_at DESC
     LIMIT ? OFFSET ?`
  ).all(userId, limit, offset);
}
