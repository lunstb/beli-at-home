import { getDb } from '../database/connection.js';
import { createFeedEntry } from './feedService.js';
import { areFriends } from './friendService.js';
import { recalculateRatings } from './rankingService.js';
import type { Dish, DishTag, DishPhoto, RecipeInfo } from '../types/index.js';

interface CreateDishData {
  name: string;
  caption?: string;
  tags?: string[];
  recipeInfo?: { type: 'link' | 'text' | 'image'; content: string }[];
  isPublic?: boolean;
  tier?: 'bad' | 'ok' | 'great';
}

interface UpdateDishData {
  name?: string;
  caption?: string;
  tags?: string[];
  isPublic?: boolean;
  tier?: 'bad' | 'ok' | 'great' | null;
}

export function createDish(userId: number, data: CreateDishData, photoPath?: string): Dish {
  const db = getDb();

  const result = db.prepare(
    `INSERT INTO dishes (user_id, name, caption, photo_path, is_public, tier)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    userId,
    data.name,
    data.caption || null,
    photoPath || null,
    data.isPublic !== undefined ? (data.isPublic ? 1 : 0) : 1,
    data.tier || null
  );

  const dishId = result.lastInsertRowid as number;

  // Add photo to dish_photos for multi-photo support
  if (photoPath) {
    db.prepare('INSERT INTO dish_photos (dish_id, photo_path, sort_order) VALUES (?, ?, 0)').run(dishId, photoPath);
  }

  // Add tags
  if (data.tags && data.tags.length > 0) {
    const insertTag = db.prepare('INSERT OR IGNORE INTO dish_tags (dish_id, tag) VALUES (?, ?)');
    for (const tag of data.tags) {
      insertTag.run(dishId, tag.trim().toLowerCase());
    }
  }

  // Add recipe info
  if (data.recipeInfo && data.recipeInfo.length > 0) {
    const insertRecipe = db.prepare(
      'INSERT INTO recipe_info (dish_id, type, content, sort_order) VALUES (?, ?, ?, ?)'
    );
    data.recipeInfo.forEach((info, index) => {
      insertRecipe.run(dishId, info.type, info.content, index);
    });
  }

  // Create activity feed entry
  createFeedEntry(userId, 'new_dish', dishId);

  return getDishById(dishId)!;
}

function getDishById(dishId: number): Dish | null {
  const db = getDb();
  const dish = db.prepare('SELECT * FROM dishes WHERE id = ?').get(dishId) as Dish | undefined;
  if (!dish) return null;

  dish.is_public = Boolean(dish.is_public);
  dish.tags = db.prepare('SELECT * FROM dish_tags WHERE dish_id = ?').all(dishId) as DishTag[];
  dish.recipe_info = db.prepare('SELECT * FROM recipe_info WHERE dish_id = ? ORDER BY sort_order').all(dishId) as RecipeInfo[];
  dish.photos = db.prepare('SELECT * FROM dish_photos WHERE dish_id = ? ORDER BY sort_order').all(dishId) as DishPhoto[];

  return dish;
}

export function getDish(dishId: number, requestingUserId: number): Dish | null {
  const dish = getDishById(dishId);
  if (!dish) return null;

  // Owner can always see their own dish
  if (dish.user_id === requestingUserId) return dish;

  // Others can only see public dishes from friends
  if (!dish.is_public) return null;

  const friends = areFriends(requestingUserId, dish.user_id);
  if (!friends) return null;

  return dish;
}

export function getUserDishes(
  userId: number,
  requestingUserId: number,
  sort?: string,
  tag?: string,
  search?: string,
  limit: number = 50,
  offset: number = 0
): { dishes: Dish[]; total: number } {
  const db = getDb();
  const isOwn = userId === requestingUserId;

  let whereClause = 'WHERE d.user_id = ?';
  const params: any[] = [userId];

  if (!isOwn) {
    // Check friendship
    if (!areFriends(requestingUserId, userId)) {
      return { dishes: [], total: 0 };
    }
    whereClause += ' AND d.is_public = 1';
  }

  if (tag) {
    whereClause += ' AND EXISTS (SELECT 1 FROM dish_tags dt WHERE dt.dish_id = d.id AND dt.tag = ?)';
    params.push(tag.toLowerCase());
  }

  if (search) {
    whereClause += ' AND d.name LIKE ?';
    params.push(`%${search}%`);
  }

  let orderClause = 'ORDER BY d.created_at DESC';
  if (sort === 'rating') orderClause = 'ORDER BY d.rating DESC NULLS LAST';
  else if (sort === 'name') orderClause = 'ORDER BY d.name ASC';
  else if (sort === 'elo') orderClause = 'ORDER BY d.elo_score DESC';

  const total = db.prepare(
    `SELECT COUNT(*) as count FROM dishes d ${whereClause}`
  ).get(...params) as { count: number };

  const dishes = db.prepare(
    `SELECT d.* FROM dishes d ${whereClause} ${orderClause} LIMIT ? OFFSET ?`
  ).all(...params, limit, offset) as Dish[];

  // Attach tags and photos to each dish
  const getTagsStmt = db.prepare('SELECT * FROM dish_tags WHERE dish_id = ?');
  const getPhotosStmt = db.prepare('SELECT * FROM dish_photos WHERE dish_id = ? ORDER BY sort_order');
  for (const dish of dishes) {
    dish.is_public = Boolean(dish.is_public);
    dish.tags = getTagsStmt.all(dish.id) as DishTag[];
    dish.photos = getPhotosStmt.all(dish.id) as DishPhoto[];
  }

  return { dishes, total: total.count };
}

export function updateDish(dishId: number, userId: number, data: UpdateDishData, photoPath?: string): Dish | null {
  const db = getDb();

  const dish = db.prepare('SELECT * FROM dishes WHERE id = ? AND user_id = ?').get(dishId, userId) as Dish | undefined;
  if (!dish) return null;

  const updates: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.caption !== undefined) {
    updates.push('caption = ?');
    values.push(data.caption);
  }
  if (data.isPublic !== undefined) {
    updates.push('is_public = ?');
    values.push(data.isPublic ? 1 : 0);
  }
  if (photoPath !== undefined) {
    updates.push('photo_path = ?');
    values.push(photoPath);
  }
  if (data.tier !== undefined) {
    updates.push('tier = ?');
    values.push(data.tier);
  }

  if (updates.length > 0) {
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(dishId, userId);
    db.prepare(
      `UPDATE dishes SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`
    ).run(...values);
  }

  // Add new photo to dish_photos if provided
  if (photoPath !== undefined && photoPath !== null) {
    const maxOrder = db.prepare('SELECT MAX(sort_order) as max_order FROM dish_photos WHERE dish_id = ?').get(dishId) as { max_order: number | null };
    const sortOrder = (maxOrder.max_order ?? -1) + 1;
    db.prepare('INSERT INTO dish_photos (dish_id, photo_path, sort_order) VALUES (?, ?, ?)').run(dishId, photoPath, sortOrder);
  }

  // Update tags if provided
  if (data.tags !== undefined) {
    db.prepare('DELETE FROM dish_tags WHERE dish_id = ?').run(dishId);
    const insertTag = db.prepare('INSERT OR IGNORE INTO dish_tags (dish_id, tag) VALUES (?, ?)');
    for (const tag of data.tags) {
      insertTag.run(dishId, tag.trim().toLowerCase());
    }
  }

  return getDishById(dishId);
}

export function deleteDish(dishId: number, userId: number): boolean {
  const db = getDb();

  const dish = db.prepare('SELECT * FROM dishes WHERE id = ? AND user_id = ?').get(dishId, userId) as Dish | undefined;
  if (!dish) return false;

  db.prepare('DELETE FROM dishes WHERE id = ? AND user_id = ?').run(dishId, userId);

  // Recalculate ratings after deletion
  recalculateRatings(userId);

  return true;
}

export function cloneDish(sourceDishId: number, userId: number): Dish | null {
  const db = getDb();

  const sourceDish = db.prepare('SELECT * FROM dishes WHERE id = ?').get(sourceDishId) as Dish | undefined;
  if (!sourceDish) return null;

  // Check that source dish is public and belongs to a friend
  if (!sourceDish.is_public) return null;
  if (sourceDish.user_id === userId) return null;
  if (!areFriends(userId, sourceDish.user_id)) return null;

  // Clone the dish
  const result = db.prepare(
    `INSERT INTO dishes (user_id, name, caption, is_public)
     VALUES (?, ?, ?, 1)`
  ).run(userId, sourceDish.name, sourceDish.caption);

  const newDishId = result.lastInsertRowid as number;

  // Clone tags
  const tags = db.prepare('SELECT * FROM dish_tags WHERE dish_id = ?').all(sourceDishId) as DishTag[];
  const insertTag = db.prepare('INSERT OR IGNORE INTO dish_tags (dish_id, tag) VALUES (?, ?)');
  for (const tag of tags) {
    insertTag.run(newDishId, tag.tag);
  }

  // Clone recipe info
  const recipes = db.prepare('SELECT * FROM recipe_info WHERE dish_id = ? ORDER BY sort_order').all(sourceDishId) as RecipeInfo[];
  const insertRecipe = db.prepare(
    'INSERT INTO recipe_info (dish_id, type, content, sort_order) VALUES (?, ?, ?, ?)'
  );
  for (const recipe of recipes) {
    insertRecipe.run(newDishId, recipe.type, recipe.content, recipe.sort_order);
  }

  // Create activity feed entry
  createFeedEntry(userId, 'tried_friend_dish', newDishId, JSON.stringify({
    source_dish_id: sourceDishId,
    source_user_id: sourceDish.user_id,
  }));

  return getDishById(newDishId);
}

export function addRecipeInfo(
  dishId: number,
  userId: number,
  type: 'link' | 'text' | 'image',
  content: string
): RecipeInfo | null {
  const db = getDb();

  const dish = db.prepare('SELECT * FROM dishes WHERE id = ? AND user_id = ?').get(dishId, userId) as Dish | undefined;
  if (!dish) return null;

  const maxOrder = db.prepare(
    'SELECT MAX(sort_order) as max_order FROM recipe_info WHERE dish_id = ?'
  ).get(dishId) as { max_order: number | null };

  const sortOrder = (maxOrder.max_order ?? -1) + 1;

  const result = db.prepare(
    'INSERT INTO recipe_info (dish_id, type, content, sort_order) VALUES (?, ?, ?, ?)'
  ).run(dishId, type, content, sortOrder);

  return db.prepare('SELECT * FROM recipe_info WHERE id = ?').get(result.lastInsertRowid) as RecipeInfo;
}

export function addDishPhoto(dishId: number, userId: number, photoPath: string, caption?: string): DishPhoto | null {
  const db = getDb();
  const dish = db.prepare('SELECT * FROM dishes WHERE id = ? AND user_id = ?').get(dishId, userId) as Dish | undefined;
  if (!dish) return null;

  const maxOrder = db.prepare('SELECT MAX(sort_order) as max_order FROM dish_photos WHERE dish_id = ?').get(dishId) as { max_order: number | null };
  const sortOrder = (maxOrder.max_order ?? -1) + 1;

  const result = db.prepare('INSERT INTO dish_photos (dish_id, photo_path, caption, sort_order) VALUES (?, ?, ?, ?)').run(dishId, photoPath, caption || null, sortOrder);

  // If this is the first photo, also set it as the dish's main photo_path for backward compatibility
  if (sortOrder === 0) {
    db.prepare('UPDATE dishes SET photo_path = ? WHERE id = ?').run(photoPath, dishId);
  }

  return db.prepare('SELECT * FROM dish_photos WHERE id = ?').get(result.lastInsertRowid) as DishPhoto;
}

export function deleteDishPhoto(photoId: number, userId: number): boolean {
  const db = getDb();
  const photo = db.prepare(
    `SELECT dp.* FROM dish_photos dp JOIN dishes d ON dp.dish_id = d.id WHERE dp.id = ? AND d.user_id = ?`
  ).get(photoId, userId) as DishPhoto | undefined;
  if (!photo) return false;

  db.prepare('DELETE FROM dish_photos WHERE id = ?').run(photoId);

  // If we deleted the main photo, update dish's photo_path to next available
  const dish = db.prepare('SELECT photo_path FROM dishes WHERE id = ?').get(photo.dish_id) as { photo_path: string | null };
  if (dish?.photo_path === photo.photo_path) {
    const next = db.prepare('SELECT photo_path FROM dish_photos WHERE dish_id = ? ORDER BY sort_order LIMIT 1').get(photo.dish_id) as { photo_path: string } | undefined;
    db.prepare('UPDATE dishes SET photo_path = ? WHERE id = ?').run(next?.photo_path || null, photo.dish_id);
  }

  return true;
}

export function updateDishPhotoCaption(photoId: number, userId: number, caption: string): boolean {
  const db = getDb();
  const photo = db.prepare(
    `SELECT dp.id FROM dish_photos dp JOIN dishes d ON dp.dish_id = d.id WHERE dp.id = ? AND d.user_id = ?`
  ).get(photoId, userId);
  if (!photo) return false;
  db.prepare('UPDATE dish_photos SET caption = ? WHERE id = ?').run(caption || null, photoId);
  return true;
}

export function deleteRecipeInfo(recipeInfoId: number, userId: number): boolean {
  const db = getDb();

  const info = db.prepare(
    `SELECT ri.* FROM recipe_info ri
     JOIN dishes d ON ri.dish_id = d.id
     WHERE ri.id = ? AND d.user_id = ?`
  ).get(recipeInfoId, userId) as RecipeInfo | undefined;

  if (!info) return false;

  db.prepare('DELETE FROM recipe_info WHERE id = ?').run(recipeInfoId);
  return true;
}
