import { get } from './client';
import type { ActivityItem, Dish } from '../types';

export async function getFeed(params: { limit?: number; offset?: number } = {}): Promise<ActivityItem[]> {
  const searchParams = new URLSearchParams();
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.offset) searchParams.set('offset', String(params.offset));
  const qs = searchParams.toString();
  const res = await get<{ feed: ActivityItem[] }>(`/api/feed${qs ? `?${qs}` : ''}`);
  return res.feed;
}

export async function getDiscoverFeed(params: { limit?: number; offset?: number } = {}): Promise<Dish[]> {
  const searchParams = new URLSearchParams();
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.offset) searchParams.set('offset', String(params.offset));
  const qs = searchParams.toString();
  const res = await get<{ dishes: Dish[] }>(`/api/feed/discover${qs ? `?${qs}` : ''}`);
  return res.dishes;
}
