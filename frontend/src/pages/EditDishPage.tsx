import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { DishForm, type DishFormData } from '../components/dish/DishForm';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { getDish, updateDish, addRecipeInfo, deleteRecipeInfo, addDishPhoto, deleteDishPhoto, updateDishPhotoCaption } from '../api/dishes';
import { useToast } from '../components/shared/Toast';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import type { Dish } from '../types';

export function EditDishPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dish, setDish] = useState<Dish | null>(null);
  const [loading, setLoading] = useState(true);
  const [formDirty, setFormDirty] = useState(false);
  useUnsavedChanges(formDirty);

  useEffect(() => {
    if (!id) return;
    getDish(Number(id))
      .then(setDish)
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleSubmit = async (data: DishFormData) => {
    if (!dish) return;

    try {
      const formData = new FormData();
      // If there's a new first photo file, send it as the main photo
      const firstPhoto = data.photos[0];
      if (firstPhoto?.file) {
        formData.append('photo', firstPhoto.file);
      }
      formData.append('name', data.name);
      if (data.caption) formData.append('caption', data.caption);
      formData.append('tags', JSON.stringify(data.tags));
      formData.append('isPublic', String(data.isPublic));
      if (data.tier) formData.append('tier', data.tier);

      await updateDish(dish.id, formData);

      // Handle photo changes
      const existingPhotoIds = data.photos.filter((p) => p.id).map((p) => p.id!);

      // Delete removed photos
      if (dish.photos) {
        for (const photo of dish.photos) {
          if (!existingPhotoIds.includes(photo.id)) {
            await deleteDishPhoto(dish.id, photo.id);
          }
        }
      }

      // Add new photos (those without an id, skip the first if it was sent as main)
      for (let i = 0; i < data.photos.length; i++) {
        const photo = data.photos[i];
        if (photo.id) {
          // Existing photo - update caption if changed
          const original = dish.photos?.find((p) => p.id === photo.id);
          if (original && original.caption !== photo.caption) {
            await updateDishPhotoCaption(dish.id, photo.id, photo.caption);
          }
          continue;
        }
        if (i === 0 && photo.file) continue; // already sent as main photo
        if (!photo.file) continue;
        const photoForm = new FormData();
        photoForm.append('photo', photo.file);
        if (photo.caption) photoForm.append('caption', photo.caption);
        await addDishPhoto(dish.id, photoForm);
      }

      // Remove deleted recipe info
      const existingRecipeIds = data.recipeEntries.filter((e) => e.id).map((e) => e.id!);
      if (dish.recipe_info) {
        for (const ri of dish.recipe_info) {
          if (!existingRecipeIds.includes(ri.id)) {
            await deleteRecipeInfo(ri.id);
          }
        }
      }

      // Add new recipe info entries
      for (const entry of data.recipeEntries) {
        if (entry.id) continue;
        if (!entry.content && !entry.file) continue;
        if (entry.type === 'image' && entry.file) {
          const riForm = new FormData();
          riForm.append('image', entry.file);
          riForm.append('type', 'image');
          await addRecipeInfo(dish.id, riForm);
        } else if (entry.content) {
          const riForm = new FormData();
          riForm.append('type', entry.type);
          riForm.append('content', entry.content);
          await addRecipeInfo(dish.id, riForm);
        }
      }

      setFormDirty(false);
      toast('Meal updated!', 'success');
      navigate(`/dishes/${dish.id}`);
    } catch (err: any) {
      toast(err.message || 'Failed to update meal', 'error');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!dish) return null;

  const initialData: DishFormData = {
    name: dish.name,
    caption: dish.caption || '',
    tags: dish.tags?.map((t) => t.tag) || [],
    isPublic: dish.is_public,
    tier: dish.tier || null,
    photos: dish.photos?.map((p) => ({
      id: p.id,
      url: p.photo_path,
      caption: p.caption || '',
    })) || (dish.photo_path ? [{ url: dish.photo_path, caption: '' }] : []),
    recipeEntries:
      dish.recipe_info?.map((ri) => ({
        id: ri.id,
        type: ri.type,
        content: ri.content,
      })) || [],
  };

  return (
    <PageContainer>
      <div className="py-4">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-xl hover:bg-stone-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-stone-600" />
          </button>
          <h1 className="text-xl font-bold text-stone-800">Edit Meal</h1>
        </div>

        <DishForm
          initialData={initialData}
          onSubmit={handleSubmit}
          submitLabel="Save Changes"
          onDirty={() => setFormDirty(true)}
        />
      </div>
    </PageContainer>
  );
}
