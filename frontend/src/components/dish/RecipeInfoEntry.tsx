import { useRef } from 'react';
import { Link, FileText, Image, X, Upload } from 'lucide-react';

export interface RecipeInfoFormData {
  id?: number;
  type: 'link' | 'text' | 'image';
  content: string;
  file?: File;
}

interface RecipeInfoEntryProps {
  entry: RecipeInfoFormData;
  index: number;
  onChange: (index: number, entry: RecipeInfoFormData) => void;
  onRemove: (index: number) => void;
}

export function RecipeInfoEntry({ entry, index, onChange, onRemove }: RecipeInfoEntryProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const typeOptions = [
    { value: 'link', label: 'Link', icon: Link },
    { value: 'text', label: 'Text', icon: FileText },
    { value: 'image', label: 'Image', icon: Image },
  ] as const;

  return (
    <div className="bg-stone-50 rounded-xl p-4 border border-[var(--color-warm-border)] animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1">
          {typeOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  onChange(index, { ...entry, type: opt.value, content: '', file: undefined })
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  entry.type === opt.value
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-white text-stone-500 hover:bg-stone-100'
                }`}
              >
                <Icon size={14} />
                {opt.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="p-1 text-stone-400 hover:text-red-500 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {entry.type === 'link' && (
        <input
          type="url"
          value={entry.content}
          onChange={(e) => onChange(index, { ...entry, content: e.target.value })}
          placeholder="https://recipe-url.com/..."
          className="w-full px-3 py-2 rounded-lg border border-[var(--color-warm-border)] text-sm outline-none focus:border-[var(--color-primary)] transition-colors bg-white"
        />
      )}

      {entry.type === 'text' && (
        <textarea
          value={entry.content}
          onChange={(e) => onChange(index, { ...entry, content: e.target.value })}
          placeholder="Add recipe notes, tips, or instructions..."
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-[var(--color-warm-border)] text-sm outline-none focus:border-[var(--color-primary)] transition-colors resize-none bg-white"
        />
      )}

      {entry.type === 'image' && (
        <div>
          {entry.file || entry.content ? (
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={entry.file ? URL.createObjectURL(entry.file) : entry.content}
                alt="Recipe"
                className="w-full h-32 object-cover"
              />
              <button
                type="button"
                onClick={() => onChange(index, { ...entry, content: '', file: undefined })}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full h-24 border-2 border-dashed border-stone-300 rounded-lg flex flex-col items-center justify-center gap-1 text-stone-400 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
            >
              <Upload size={20} />
              <span className="text-xs">Upload image</span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onChange(index, { ...entry, file });
            }}
          />
        </div>
      )}
    </div>
  );
}
