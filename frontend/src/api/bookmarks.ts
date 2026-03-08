import { get, post, del } from './client';
import type { Bookmark } from '../types';

export async function getBookmarks(): Promise<Bookmark[]> {
  const res = await get<{ bookmarks: Bookmark[] }>('/api/bookmarks');
  return res.bookmarks;
}

export function addBookmark(dishId: number): Promise<{ success: boolean }> {
  return post('/api/bookmarks', { dishId });
}

export function removeBookmark(dishId: number): Promise<void> {
  return del(`/api/bookmarks/${dishId}`);
}
