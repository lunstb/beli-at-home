import { getDb } from '../database/connection.js';

export type NotificationType = 'friend_request' | 'friend_accepted' | 'tagged_in_dish' | 'friend_new_dish';

export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  from_user_id: number;
  dish_id: number | null;
  read: number;
  created_at: string;
  // joined
  from_username: string;
  from_avatar_url: string | null;
  dish_name: string | null;
  dish_photo: string | null;
}

export function createNotification(userId: number, type: NotificationType, fromUserId: number, dishId?: number) {
  const db = getDb();
  // Don't notify yourself
  if (userId === fromUserId) return;
  db.prepare(
    'INSERT INTO notifications (user_id, type, from_user_id, dish_id) VALUES (?, ?, ?, ?)'
  ).run(userId, type, fromUserId, dishId || null);
}

export function getNotifications(userId: number, limit = 50, offset = 0): Notification[] {
  const db = getDb();
  return db.prepare(
    `SELECT n.*,
       u.username as from_username,
       u.avatar_url as from_avatar_url,
       d.name as dish_name,
       d.photo_path as dish_photo
     FROM notifications n
     JOIN users u ON u.id = n.from_user_id
     LEFT JOIN dishes d ON d.id = n.dish_id
     WHERE n.user_id = ?
     ORDER BY n.created_at DESC
     LIMIT ? OFFSET ?`
  ).all(userId, limit, offset) as Notification[];
}

export function getUnreadCount(userId: number): number {
  const db = getDb();
  const row = db.prepare(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0'
  ).get(userId) as { count: number };
  return row.count;
}

export function markAllRead(userId: number) {
  const db = getDb();
  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0').run(userId);
}

export function markRead(notificationId: number, userId: number) {
  const db = getDb();
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(notificationId, userId);
}
