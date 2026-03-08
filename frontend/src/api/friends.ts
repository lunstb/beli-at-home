import { get, post, put, del } from './client';
import type { Friend, FriendRequest, SearchUser, User } from '../types';

export async function getFriends(): Promise<Friend[]> {
  const res = await get<{ friends: Friend[] }>('/api/friends');
  return res.friends;
}

export function sendFriendRequest(userId: number): Promise<{ friendship: { id: number } }> {
  return post('/api/friends/request', { userId });
}

export function acceptFriendRequest(id: number): Promise<{ friendship: { id: number } }> {
  return put(`/api/friends/${id}/accept`);
}

export function declineFriendRequest(id: number): Promise<{ friendship: { id: number } }> {
  return put(`/api/friends/${id}/decline`);
}

export function removeFriend(id: number): Promise<void> {
  return del(`/api/friends/${id}`);
}

export async function getFriendRequests(): Promise<FriendRequest[]> {
  const res = await get<{ requests: FriendRequest[] }>('/api/friends/requests');
  return res.requests;
}

export async function searchUsers(query: string): Promise<SearchUser[]> {
  const res = await get<{ users: SearchUser[] }>(`/api/users/search?q=${encodeURIComponent(query)}`);
  return res.users;
}

export async function getUser(id: number): Promise<User> {
  const res = await get<{ user: User }>(`/api/users/${id}`);
  return res.user;
}

export async function updateProfile(data: { username?: string; bio?: string }): Promise<User> {
  const res = await put<{ user: User }>('/api/users/me', data);
  return res.user;
}
