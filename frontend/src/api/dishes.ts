import { get, del, put, postMultipart, putMultipart, post } from './client';
import type { Dish, DishPhoto } from '../types';

interface DishListParams {
  sort?: string;
  tag?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function getDishes(params: DishListParams = {}): Promise<Dish[]> {
  const searchParams = new URLSearchParams();
  if (params.sort) searchParams.set('sort', params.sort);
  if (params.tag) searchParams.set('tag', params.tag);
  if (params.search) searchParams.set('search', params.search);
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.offset) searchParams.set('offset', String(params.offset));
  const qs = searchParams.toString();
  const res = await get<{ dishes: Dish[]; total: number }>(`/api/dishes${qs ? `?${qs}` : ''}`);
  return res.dishes;
}

export async function getDish(id: number): Promise<Dish> {
  const res = await get<{ dish: Dish }>(`/api/dishes/${id}`);
  return res.dish;
}

export async function createDish(formData: FormData): Promise<Dish> {
  const res = await postMultipart<{ dish: Dish }>('/api/dishes', formData);
  return res.dish;
}

export async function updateDish(id: number, formData: FormData): Promise<Dish> {
  const res = await putMultipart<{ dish: Dish }>(`/api/dishes/${id}`, formData);
  return res.dish;
}

export async function deleteDish(id: number): Promise<void> {
  return del(`/api/dishes/${id}`);
}

export async function cloneDish(id: number): Promise<Dish> {
  const res = await post<{ dish: Dish }>(`/api/dishes/${id}/clone`);
  return res.dish;
}

export async function addRecipeInfo(dishId: number, formData: FormData): Promise<void> {
  return postMultipart(`/api/dishes/${dishId}/recipe-info`, formData);
}

export async function deleteRecipeInfo(id: number): Promise<void> {
  return del(`/api/recipe-info/${id}`);
}

export async function getUserDishes(userId: number, params: { sort?: string; tag?: string } = {}): Promise<Dish[]> {
  const searchParams = new URLSearchParams();
  if (params.sort) searchParams.set('sort', params.sort);
  if (params.tag) searchParams.set('tag', params.tag);
  const qs = searchParams.toString();
  const res = await get<{ dishes: Dish[]; total: number }>(`/api/users/${userId}/dishes${qs ? `?${qs}` : ''}`);
  return res.dishes;
}

export async function addDishPhoto(dishId: number, formData: FormData): Promise<DishPhoto> {
  const res = await postMultipart<{ photo: DishPhoto }>(`/api/dishes/${dishId}/photos`, formData);
  return res.photo;
}

export async function deleteDishPhoto(dishId: number, photoId: number): Promise<void> {
  return del(`/api/dishes/${dishId}/photos/${photoId}`);
}

export async function updateDishPhotoCaption(dishId: number, photoId: number, caption: string): Promise<void> {
  return put(`/api/dishes/${dishId}/photos/${photoId}`, { caption });
}
