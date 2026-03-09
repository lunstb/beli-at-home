import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { BottomSheet } from '../components/shared/BottomSheet';
import { DishForm, type DishFormData } from '../components/dish/DishForm';
import { useToast } from '../components/shared/Toast';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { createDish, addRecipeInfo, addDishPhoto, updateDishPhotoCaption } from '../api/dishes';

export function AddDishPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showRankModal, setShowRankModal] = useState(false);
  const [createdDishId, setCreatedDishId] = useState<number | null>(null);
  const [formDirty, setFormDirty] = useState(false);
  useUnsavedChanges(formDirty && !showRankModal);

  const handleSubmit = async (data: DishFormData) => {
    try {
      const formData = new FormData();
      // Attach first photo as the main dish photo
      if (data.photos.length > 0 && data.photos[0].file) {
        formData.append('photo', data.photos[0].file);
      }
      formData.append('name', data.name);
      if (data.caption) formData.append('caption', data.caption);
      formData.append('tags', JSON.stringify(data.tags));
      formData.append('isPublic', String(data.isPublic));
      if (data.tier) formData.append('tier', data.tier);
      if (data.taggedUserIds.length > 0) {
        formData.append('taggedUsers', JSON.stringify(data.taggedUserIds));
      }

      const dish = await createDish(formData);

      // Upload additional photos (skip first, it was the main photo)
      for (let i = 1; i < data.photos.length; i++) {
        const photo = data.photos[i];
        if (!photo.file) continue;
        const photoForm = new FormData();
        photoForm.append('photo', photo.file);
        if (photo.caption) photoForm.append('caption', photo.caption);
        await addDishPhoto(dish.id, photoForm);
      }

      // Update first photo's caption if set
      if (data.photos.length > 0 && data.photos[0].caption && dish.photos && dish.photos.length > 0) {
        await updateDishPhotoCaption(dish.id, dish.photos[0].id, data.photos[0].caption);
      }

      // Add recipe info entries
      for (const entry of data.recipeEntries) {
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

      setCreatedDishId(dish.id);
      setShowRankModal(true);
    } catch (err: any) {
      toast(err.message || 'Failed to create meal', 'error');
    }
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
          <h1 className="text-xl font-bold text-stone-800">Add a Meal</h1>
        </div>

        <DishForm onSubmit={handleSubmit} submitLabel="Save Meal" onDirty={() => setFormDirty(true)} />
      </div>

      {/* Rank Modal */}
      <BottomSheet open={showRankModal} onClose={() => { setShowRankModal(false); navigate(`/dishes/${createdDishId}`); }}>
        <h2 className="text-lg font-bold text-stone-800 mb-2">Meal saved!</h2>
        <p className="text-sm text-stone-500 mb-6">
          Want to rank this meal now? Compare it against your other meals to find out where it stands.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/rank/${createdDishId}`)}
            className="flex-1 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-xl hover:bg-[var(--color-primary-dark)] transition-colors text-sm"
          >
            Rank It!
          </button>
          <button
            onClick={() => { setShowRankModal(false); navigate(`/dishes/${createdDishId}`); }}
            className="flex-1 py-3 bg-stone-100 text-stone-700 font-semibold rounded-xl hover:bg-stone-200 transition-colors text-sm"
          >
            Not Now
          </button>
        </div>
      </BottomSheet>
    </PageContainer>
  );
}
