import { get, post } from './client';
import type { Notification } from '../types';

export async function getNotifications(limit = 50, offset = 0): Promise<Notification[]> {
  const res = await get<{ notifications: Notification[] }>(`/api/notifications?limit=${limit}&offset=${offset}`);
  return res.notifications;
}

export async function getUnreadCount(): Promise<number> {
  const res = await get<{ count: number }>('/api/notifications/unread-count');
  return res.count;
}

export async function markAllRead(): Promise<void> {
  await post('/api/notifications/read-all');
}

export async function markNotificationRead(id: number): Promise<void> {
  await post(`/api/notifications/${id}/read`);
}
