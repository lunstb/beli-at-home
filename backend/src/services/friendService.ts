import { getDb } from '../database/connection.js';
import { createNotification } from './notificationService.js';
import type { Friendship, User } from '../types/index.js';

export function sendRequest(requesterId: number, addresseeId: number): Friendship {
  const db = getDb();

  if (requesterId === addresseeId) {
    throw new Error('Cannot send friend request to yourself');
  }

  // Check for existing friendship in either direction
  const existing = db.prepare(
    `SELECT * FROM friendships
     WHERE (requester_id = ? AND addressee_id = ?)
        OR (requester_id = ? AND addressee_id = ?)`
  ).get(requesterId, addresseeId, addresseeId, requesterId) as Friendship | undefined;

  if (existing) {
    if (existing.status === 'accepted') {
      throw new Error('Already friends');
    }
    if (existing.status === 'pending') {
      throw new Error('Friend request already pending');
    }
    if (existing.status === 'declined') {
      // Allow re-requesting after decline
      db.prepare('DELETE FROM friendships WHERE id = ?').run(existing.id);
    }
  }

  const result = db.prepare(
    'INSERT INTO friendships (requester_id, addressee_id, status) VALUES (?, ?, ?)'
  ).run(requesterId, addresseeId, 'pending');

  createNotification(addresseeId, 'friend_request', requesterId);

  return db.prepare('SELECT * FROM friendships WHERE id = ?').get(result.lastInsertRowid) as Friendship;
}

export function acceptRequest(friendshipId: number, userId: number): Friendship {
  const db = getDb();

  const friendship = db.prepare(
    'SELECT * FROM friendships WHERE id = ? AND addressee_id = ? AND status = ?'
  ).get(friendshipId, userId, 'pending') as Friendship | undefined;

  if (!friendship) {
    throw new Error('Friend request not found');
  }

  db.prepare(
    'UPDATE friendships SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run('accepted', friendshipId);

  createNotification(friendship.requester_id, 'friend_accepted', userId);

  return db.prepare('SELECT * FROM friendships WHERE id = ?').get(friendshipId) as Friendship;
}

export function declineRequest(friendshipId: number, userId: number): Friendship {
  const db = getDb();

  const friendship = db.prepare(
    'SELECT * FROM friendships WHERE id = ? AND addressee_id = ? AND status = ?'
  ).get(friendshipId, userId, 'pending') as Friendship | undefined;

  if (!friendship) {
    throw new Error('Friend request not found');
  }

  db.prepare(
    'UPDATE friendships SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run('declined', friendshipId);

  return db.prepare('SELECT * FROM friendships WHERE id = ?').get(friendshipId) as Friendship;
}

export function removeFriend(friendshipId: number, userId: number): boolean {
  const db = getDb();

  const friendship = db.prepare(
    'SELECT * FROM friendships WHERE id = ? AND (requester_id = ? OR addressee_id = ?)'
  ).get(friendshipId, userId, userId) as Friendship | undefined;

  if (!friendship) {
    throw new Error('Friendship not found');
  }

  db.prepare('DELETE FROM friendships WHERE id = ?').run(friendshipId);
  return true;
}

export function getFriends(userId: number): (Friendship & { friend: User })[] {
  const db = getDb();

  const friendships = db.prepare(
    `SELECT f.*,
       CASE WHEN f.requester_id = ? THEN f.addressee_id ELSE f.requester_id END as friend_id
     FROM friendships f
     WHERE (f.requester_id = ? OR f.addressee_id = ?) AND f.status = 'accepted'`
  ).all(userId, userId, userId) as (Friendship & { friend_id: number })[];

  const getUserStmt = db.prepare('SELECT * FROM users WHERE id = ?');

  return friendships.map(f => ({
    ...f,
    friend: getUserStmt.get(f.friend_id) as User,
  }));
}

export function getPendingRequests(userId: number): (Friendship & { requester: User })[] {
  const db = getDb();

  const requests = db.prepare(
    `SELECT f.* FROM friendships f
     WHERE f.addressee_id = ? AND f.status = 'pending'
     ORDER BY f.created_at DESC`
  ).all(userId) as Friendship[];

  const getUserStmt = db.prepare('SELECT * FROM users WHERE id = ?');

  return requests.map(f => ({
    ...f,
    requester: getUserStmt.get(f.requester_id) as User,
  }));
}

export function areFriends(userId1: number, userId2: number): boolean {
  const db = getDb();

  const friendship = db.prepare(
    `SELECT id FROM friendships
     WHERE ((requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?))
       AND status = 'accepted'`
  ).get(userId1, userId2, userId2, userId1) as { id: number } | undefined;

  return !!friendship;
}

export function searchUsers(query: string, currentUserId: number): User[] {
  const db = getDb();

  return db.prepare(
    'SELECT * FROM users WHERE username LIKE ? AND id != ? LIMIT 20'
  ).all(`%${query}%`, currentUserId) as User[];
}
