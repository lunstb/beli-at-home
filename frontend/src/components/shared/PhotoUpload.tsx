import { useRef } from 'react';
import { Camera } from 'lucide-react';
import { useToast } from './Toast';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface PhotoUploadProps {
  currentUrl?: string | null;
  preview: string | null;
  onSelect: (file: File) => void;
}

export function PhotoUpload({ currentUrl, preview, onSelect }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const displayUrl = preview || currentUrl;

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer group bg-stone-100 border-2 border-dashed border-stone-300 hover:border-[var(--color-primary)] transition-colors"
    >
      {displayUrl ? (
        <img
          src={displayUrl}
          alt="Dish preview"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-stone-400 group-hover:text-[var(--color-primary)] transition-colors">
          <Camera size={40} strokeWidth={1.5} />
          <span className="mt-2 text-sm font-medium">Tap to add a photo</span>
        </div>
      )}
      {displayUrl && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <Camera
            size={32}
            className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            if (file.size > MAX_FILE_SIZE) {
              toast('Photo must be under 10MB', 'error');
              return;
            }
            onSelect(file);
          }
        }}
      />
    </div>
  );
}
