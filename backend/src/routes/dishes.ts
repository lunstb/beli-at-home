import { Router, Request, Response } from 'express';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { uploadDishPhoto, uploadRecipeImage } from '../middleware/upload.js';
import { uploadFile } from '../services/storageService.js';
import {
  createDish,
  getDish,
  getUserDishes,
  updateDish,
  deleteDish,
  cloneDish,
  addRecipeInfo,
  deleteRecipeInfo,
  addDishPhoto,
  deleteDishPhoto,
  updateDishPhotoCaption,
  setDishTaggedUsers,
  getDishTaggedUsers,
} from '../services/dishService.js';
import { createNotification } from '../services/notificationService.js';

const router = Router();

router.post('/', authMiddleware, uploadDishPhoto.single('photo'), async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;

  try {
    const { name, caption, tags, recipeInfo, isPublic, tier, taggedUsers } = req.body;

    if (!name || name.trim().length === 0) {
      res.status(400).json({ error: 'Meal name is required' });
      return;
    }

    let parsedTags: string[] | undefined;
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch {
        parsedTags = [];
      }
    }

    let parsedRecipeInfo: any[] | undefined;
    if (recipeInfo) {
      try {
        parsedRecipeInfo = typeof recipeInfo === 'string' ? JSON.parse(recipeInfo) : recipeInfo;
      } catch {
        parsedRecipeInfo = [];
      }
    }

    let parsedTaggedUsers: number[] = [];
    if (taggedUsers) {
      try {
        parsedTaggedUsers = typeof taggedUsers === 'string' ? JSON.parse(taggedUsers) : taggedUsers;
      } catch {
        parsedTaggedUsers = [];
      }
    }

    let photoPath: string | undefined;
    if (req.file) {
      const ext = path.extname(req.file.originalname) || '.jpg';
      const key = `dishes/${uuidv4()}${ext}`;
      photoPath = await uploadFile(req.file.buffer, key, req.file.mimetype);
    }

    const validTiers = ['bad', 'ok', 'great'];
    const dish = createDish(authReq.user!.id, {
      name: name.trim(),
      caption: caption?.trim(),
      tags: parsedTags,
      recipeInfo: parsedRecipeInfo,
      isPublic: isPublic !== undefined ? isPublic === 'true' || isPublic === true : true,
      tier: tier && validTiers.includes(tier) ? tier : undefined,
    }, photoPath);

    if (parsedTaggedUsers.length > 0) {
      setDishTaggedUsers(dish.id, authReq.user!.id, parsedTaggedUsers);
      for (const taggedUserId of parsedTaggedUsers) {
        createNotification(taggedUserId, 'tagged_in_dish', authReq.user!.id, dish.id);
      }
    }

    res.status(201).json({ dish });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authMiddleware, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { sort, tag, search, limit, offset } = req.query;

  const result = getUserDishes(
    authReq.user!.id,
    authReq.user!.id,
    sort as string,
    tag as string,
    search as string,
    limit ? parseInt(limit as string, 10) : 50,
    offset ? parseInt(offset as string, 10) : 0
  );

  res.json(result);
});

router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const dishId = parseInt(req.params.id as string, 10);

  if (isNaN(dishId)) {
    res.status(400).json({ error: 'Invalid dish ID' });
    return;
  }

  const dish = getDish(dishId, authReq.user!.id);
  if (!dish) {
    res.status(404).json({ error: 'Dish not found' });
    return;
  }

  (dish as any).tagged_users = getDishTaggedUsers(dishId);

  res.json({ dish });
});

router.put('/:id', authMiddleware, uploadDishPhoto.single('photo'), async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const dishId = parseInt(req.params.id as string, 10);

  if (isNaN(dishId)) {
    res.status(400).json({ error: 'Invalid dish ID' });
    return;
  }

  try {
    const { name, caption, tags, isPublic, tier, taggedUsers } = req.body;

    let parsedTags: string[] | undefined;
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch {
        parsedTags = [];
      }
    }

    let parsedTaggedUsers: number[] | undefined;
    if (taggedUsers) {
      try {
        parsedTaggedUsers = typeof taggedUsers === 'string' ? JSON.parse(taggedUsers) : taggedUsers;
      } catch {
        parsedTaggedUsers = [];
      }
    }

    let photoPath: string | undefined;
    if (req.file) {
      const ext = path.extname(req.file.originalname) || '.jpg';
      const key = `dishes/${uuidv4()}${ext}`;
      photoPath = await uploadFile(req.file.buffer, key, req.file.mimetype);
    }

    const validTiers = ['bad', 'ok', 'great'];

    // Get existing tagged users before update for diffing
    const existingTaggedUsers = parsedTaggedUsers ? getDishTaggedUsers(dishId).map(u => u.id) : [];

    const dish = updateDish(dishId, authReq.user!.id, {
      name,
      caption,
      tags: parsedTags,
      isPublic: isPublic !== undefined ? isPublic === 'true' || isPublic === true : undefined,
      tier: tier !== undefined ? (validTiers.includes(tier) ? tier : null) : undefined,
    }, photoPath);

    if (!dish) {
      res.status(404).json({ error: 'Dish not found or not authorized' });
      return;
    }

    if (parsedTaggedUsers) {
      setDishTaggedUsers(dishId, authReq.user!.id, parsedTaggedUsers);
      // Notify only newly tagged users
      const newlyTagged = parsedTaggedUsers.filter(id => !existingTaggedUsers.includes(id));
      for (const taggedUserId of newlyTagged) {
        createNotification(taggedUserId, 'tagged_in_dish', authReq.user!.id, dishId);
      }
    }

    res.json({ dish });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const dishId = parseInt(req.params.id as string, 10);

  if (isNaN(dishId)) {
    res.status(400).json({ error: 'Invalid dish ID' });
    return;
  }

  const success = deleteDish(dishId, authReq.user!.id);
  if (!success) {
    res.status(404).json({ error: 'Dish not found or not authorized' });
    return;
  }

  res.json({ success: true });
});

router.post('/:id/clone', authMiddleware, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const dishId = parseInt(req.params.id as string, 10);

  if (isNaN(dishId)) {
    res.status(400).json({ error: 'Invalid dish ID' });
    return;
  }

  const dish = cloneDish(dishId, authReq.user!.id);
  if (!dish) {
    res.status(404).json({ error: 'Dish not found or not accessible' });
    return;
  }

  res.status(201).json({ dish });
});

router.post('/:id/recipe-info', authMiddleware, uploadRecipeImage.single('image'), async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const dishId = parseInt(req.params.id as string, 10);

  if (isNaN(dishId)) {
    res.status(400).json({ error: 'Invalid dish ID' });
    return;
  }

  const { type, content } = req.body;

  if (!type || !['link', 'text', 'image'].includes(type)) {
    res.status(400).json({ error: 'Invalid recipe info type' });
    return;
  }

  let finalContent = content;
  if (type === 'image' && req.file) {
    const ext = path.extname(req.file.originalname) || '.jpg';
    const key = `recipes/${uuidv4()}${ext}`;
    finalContent = await uploadFile(req.file.buffer, key, req.file.mimetype);
  }

  if (!finalContent) {
    res.status(400).json({ error: 'Content is required' });
    return;
  }

  const info = addRecipeInfo(dishId, authReq.user!.id, type, finalContent);
  if (!info) {
    res.status(404).json({ error: 'Dish not found or not authorized' });
    return;
  }

  res.status(201).json({ recipeInfo: info });
});

// Add additional photo to a dish
router.post('/:id/photos', authMiddleware, uploadDishPhoto.single('photo'), async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const dishId = parseInt(req.params.id as string, 10);
  if (isNaN(dishId)) { res.status(400).json({ error: 'Invalid dish ID' }); return; }

  try {
    if (!req.file) { res.status(400).json({ error: 'Photo is required' }); return; }
    const ext = path.extname(req.file.originalname) || '.jpg';
    const key = `dishes/${uuidv4()}${ext}`;
    const photoPath = await uploadFile(req.file.buffer, key, req.file.mimetype);
    const caption = req.body.caption || null;

    const photo = addDishPhoto(dishId, authReq.user!.id, photoPath, caption);
    if (!photo) { res.status(404).json({ error: 'Dish not found' }); return; }

    res.status(201).json({ photo });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a dish photo
router.delete('/:dishId/photos/:photoId', authMiddleware, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const photoId = parseInt(req.params.photoId as string, 10);
  if (isNaN(photoId)) { res.status(400).json({ error: 'Invalid photo ID' }); return; }

  const success = deleteDishPhoto(photoId, authReq.user!.id);
  if (!success) { res.status(404).json({ error: 'Photo not found' }); return; }
  res.json({ success: true });
});

// Update photo caption
router.put('/:dishId/photos/:photoId', authMiddleware, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const photoId = parseInt(req.params.photoId as string, 10);
  if (isNaN(photoId)) { res.status(400).json({ error: 'Invalid photo ID' }); return; }

  const success = updateDishPhotoCaption(photoId, authReq.user!.id, req.body.caption || '');
  if (!success) { res.status(404).json({ error: 'Photo not found' }); return; }
  res.json({ success: true });
});

export default router;

// Also export a separate router for recipe-info deletion
export const recipeInfoRouter = Router();

recipeInfoRouter.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const infoId = parseInt(req.params.id as string, 10);

  if (isNaN(infoId)) {
    res.status(400).json({ error: 'Invalid recipe info ID' });
    return;
  }

  const success = deleteRecipeInfo(infoId, authReq.user!.id);
  if (!success) {
    res.status(404).json({ error: 'Recipe info not found or not authorized' });
    return;
  }

  res.json({ success: true });
});
