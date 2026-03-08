import { get, post } from './client';
import type { User } from '../types';

export function loginWithGoogle(credential: string): Promise<{ token: string; user: User }> {
  return post('/api/auth/google', { credential });
}

export async function getMe(): Promise<User> {
  const res = await get<{ user: User }>('/api/auth/me');
  return res.user;
}
