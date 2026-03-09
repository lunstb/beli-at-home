import { useState, useRef, useEffect } from 'react';
import { Plus, Eye, EyeOff, ThumbsDown, Meh, ThumbsUp, Camera, X } from 'lucide-react';
import { useToast } from '../shared/Toast';
import { ImageCropper } from '../shared/ImageCropper';
import { TagInput } from './TagInput';
import { RecipeInfoEntry, type RecipeInfoFormData } from './RecipeInfoEntry';

export type Tier = 'bad' | 'ok' | 'great';

export interface PhotoEntry {
  id?: number;
  file?: File;
  url?: string;
  caption: string;
}

export interface DishFormData {
  name: string;
  caption: string;
  tags: string[];
  isPublic: boolean;
  tier: Tier | null;
  photos: PhotoEntry[];
  recipeEntries: RecipeInfoFormData[];
}

interface DishFormProps {
  initialData?: DishFormData;
  onSubmit: (data: DishFormData) => Promise<void>;
  submitLabel: string;
  onDirty?: () => void;
}

function getDefaultFormData(): DishFormData {
  return {
    name: '',
    caption: '',
    tags: [],
    isPublic: true,
    tier: null,
    photos: [],
    recipeEntries: [],
  };
}

const tierOptions: { value: Tier; label: string; icon: typeof ThumbsDown; desc: string; color: string; activeColor: string }[] = [
  { value: 'bad', label: 'Bad', icon: ThumbsDown, desc: '0 – 3.9', color: 'text-red-400', activeColor: 'bg-red-50 border-red-300 text-red-600' },
  { value: 'ok', label: 'Decent', icon: Meh, desc: '4.0 – 6.9', color: 'text-yellow-500', activeColor: 'bg-yellow-50 border-yellow-300 text-yellow-600' },
  { value: 'great', label: 'Great', icon: ThumbsUp, desc: '7.0 – 10', color: 'text-green-500', activeColor: 'bg-green-50 border-green-300 text-green-600' },
];

export function DishForm({ initialData, onSubmit, submitLabel, onDirty }: DishFormProps) {
  const [form, setForm] = useState<DishFormData>(initialData || getDefaultFormData());
  const [submitting, setSubmitting] = useState(false);
  const [cropQueue, setCropQueue] = useState<string[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) {
      onDirty?.();
    }
    mountedRef.current = true;
  }, [form]);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const handlePhotoFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > MAX_FILE_SIZE) {
        toast(`"${file.name}" exceeds 10MB limit`, 'error');
        continue;
      }
      urls.push(URL.createObjectURL(file));
    }

    if (urls.length > 0) {
      setCropQueue(urls);
    }
    e.target.value = '';
  };

  const handleCropDone = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
    setForm((f) => ({ ...f, photos: [...f.photos, { file, url, caption: '' }] }));
    setCropQueue((q) => q.slice(1));
  };

  const handleCropCancel = () => {
    setCropQueue((q) => q.slice(1));
  };

  const removePhoto = (index: number) => {
    setForm((f) => ({
      ...f,
      photos: f.photos.filter((_, i) => i !== index),
    }));
  };

  const updatePhotoCaption = (index: number, caption: string) => {
    setForm((f) => {
      const photos = [...f.photos];
      photos[index] = { ...photos[index], caption };
      return { ...f, photos };
    });
  };

  const handleRecipeChange = (index: number, entry: RecipeInfoFormData) => {
    setForm((f) => {
      const entries = [...f.recipeEntries];
      entries[index] = entry;
      return { ...f, recipeEntries: entries };
    });
  };

  const handleRecipeRemove = (index: number) => {
    setForm((f) => ({
      ...f,
      recipeEntries: f.recipeEntries.filter((_, i) => i !== index),
    }));
  };

  const addRecipeEntry = () => {
    setForm((f) => ({
      ...f,
      recipeEntries: [...f.recipeEntries, { type: 'link' as const, content: '' }],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Photos */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Photos</label>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {form.photos.map((photo, index) => (
            <div key={index} className="shrink-0 w-40">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-stone-100">
                <img
                  src={photo.url || (photo.file ? URL.createObjectURL(photo.file) : '')}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-1.5 right-1.5 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                >
                  <X size={14} />
                </button>
              </div>
              <input
                type="text"
                value={photo.caption}
                onChange={(e) => updatePhotoCaption(index, e.target.value)}
                placeholder="Caption..."
                className="w-full mt-1.5 px-2 py-1.5 rounded-lg border border-[var(--color-warm-border)] text-xs outline-none focus:border-[var(--color-primary)] bg-white"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className={`shrink-0 rounded-xl border-2 border-dashed border-stone-300 flex flex-col items-center justify-center gap-1 text-stone-400 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors ${
              form.photos.length === 0 ? 'w-full h-48' : 'w-40 aspect-square'
            }`}
          >
            <Camera size={24} />
            <span className="text-xs font-medium">Add Photo</span>
          </button>
        </div>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handlePhotoFiles}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          Meal Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Mom's famous lasagna..."
          required
          className="w-full px-4 py-3 rounded-xl border border-[var(--color-warm-border)] text-sm outline-none focus:border-[var(--color-primary)] transition-colors bg-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Caption</label>
        <textarea
          value={form.caption}
          onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
          placeholder="What makes this meal special?"
          rows={2}
          className="w-full px-4 py-3 rounded-xl border border-[var(--color-warm-border)] text-sm outline-none focus:border-[var(--color-primary)] transition-colors resize-none bg-white"
        />
      </div>

      {/* Quality Tier */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          How was it?
        </label>
        <p className="text-xs text-stone-400 mb-2">This determines the rating range for this meal</p>
        <div className="grid grid-cols-3 gap-2">
          {tierOptions.map((opt) => {
            const Icon = opt.icon;
            const isActive = form.tier === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm((f) => ({ ...f, tier: isActive ? null : opt.value }))}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${
                  isActive
                    ? opt.activeColor
                    : 'border-stone-200 text-stone-400 hover:border-stone-300'
                }`}
              >
                <Icon size={22} />
                <span className="text-sm font-semibold">{opt.label}</span>
                <span className="text-[10px] opacity-70">{opt.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Tags</label>
        <TagInput
          tags={form.tags}
          onChange={(tags) => setForm((f) => ({ ...f, tags }))}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-stone-700">Recipe Info</label>
          <button
            type="button"
            onClick={addRecipeEntry}
            className="flex items-center gap-1 text-sm text-[var(--color-primary)] font-medium hover:text-[var(--color-primary-dark)] transition-colors"
          >
            <Plus size={16} />
            Add
          </button>
        </div>
        {form.recipeEntries.length === 0 ? (
          <button
            type="button"
            onClick={addRecipeEntry}
            className="w-full py-4 border-2 border-dashed border-stone-200 rounded-xl text-stone-400 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors text-sm"
          >
            Add a recipe link, notes, or photo
          </button>
        ) : (
          <div className="space-y-3">
            {form.recipeEntries.map((entry, index) => (
              <RecipeInfoEntry
                key={index}
                entry={entry}
                index={index}
                onChange={handleRecipeChange}
                onRemove={handleRecipeRemove}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between py-3 px-4 bg-white rounded-xl border border-[var(--color-warm-border)]">
        <div className="flex items-center gap-2">
          {form.isPublic ? (
            <Eye size={18} className="text-stone-500" />
          ) : (
            <EyeOff size={18} className="text-stone-500" />
          )}
          <span className="text-sm text-stone-700">Visible to friends</span>
        </div>
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, isPublic: !f.isPublic }))}
          className={`w-11 h-6 rounded-full transition-colors relative ${
            form.isPublic ? 'bg-[var(--color-primary)]' : 'bg-stone-300'
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              form.isPublic ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      <button
        type="submit"
        disabled={submitting || !form.name.trim()}
        className="w-full py-3.5 bg-[var(--color-primary)] text-white font-semibold rounded-xl hover:bg-[var(--color-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
      >
        {submitting ? 'Saving...' : submitLabel}
      </button>

      {cropQueue.length > 0 && (
        <ImageCropper
          imageSrc={cropQueue[0]}
          onCropDone={handleCropDone}
          onCancel={handleCropCancel}
        />
      )}
    </form>
  );
}
