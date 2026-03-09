import { get, post, put, del } from './client';
import type { Friend, FriendRequest, SearchUser, User } from '../types';

export async function getFriends(): Promise<Friend[]> {
  const res = await get<{ friends: any[] }>('/api/friends');
  return res.friends.map((f) => ({
    id: f.friend?.id ?? f.id,
    username: f.friend?.username ?? f.username,
    avatar_url: f.friend?.avatar_url ?? f.avatar_url,
    bio: f.friend?.bio ?? f.bio,
    friendship_id: f.id,
    friends_since: f.updated_at,
  }));
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
  const res = await get<{ requests: any[] }>('/api/friends/requests');
  return res.requests.map((r) => ({
    id: r.id,
    requester_id: r.requester_id,
    addressee_id: r.addressee_id,
    status: r.status,
    created_at: r.created_at,
    updated_at: r.updated_at,
    username: r.requester?.username ?? r.username,
    avatar_url: r.requester?.avatar_url ?? r.avatar_url,
  }));
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
