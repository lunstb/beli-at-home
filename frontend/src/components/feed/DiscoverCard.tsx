import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, BookmarkCheck, Copy, UtensilsCrossed } from 'lucide-react';
import { ScoreBadge } from '../shared/ScoreBadge';
import { useToast } from '../shared/Toast';
import { addBookmark } from '../../api/bookmarks';
import { cloneDish } from '../../api/dishes';
import type { Dish } from '../../types';

interface DiscoverCardProps {
  dish: Dish;
}

export function DiscoverCard({ dish }: DiscoverCardProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookmarked, setBookmarked] = useState(false);
  const [cloning, setCloning] = useState(false);

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (bookmarked) return;
    try {
      await addBookmark(dish.id);
      setBookmarked(true);
      toast('Meal saved!', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to bookmark', 'error');
    }
  };

  const handleClone = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setCloning(true);
    try {
      const cloned = await cloneDish(dish.id);
      navigate(`/rank/${cloned.id}`);
    } catch (err: any) {
      toast(err.message || 'Failed to clone meal', 'error');
      setCloning(false);
    }
  };

  return (
    <div
      onClick={() => navigate(`/dishes/${dish.id}`)}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[var(--color-warm-border)] cursor-pointer group"
    >
      <div className="aspect-square overflow-hidden bg-stone-100 relative">
        {dish.photo_path ? (
          <img
            src={dish.photo_path}
            alt={dish.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300">
            <UtensilsCrossed size={40} />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <ScoreBadge rating={dish.rating} size="sm" />
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-stone-800 text-sm truncate">{dish.name}</h3>
        {dish.username && (
          <p className="text-xs text-stone-400 mt-0.5">
            by {dish.username}
          </p>
        )}
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleBookmark}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              bookmarked
                ? 'bg-orange-50 text-[var(--color-primary)]'
                : 'bg-stone-50 text-stone-500 hover:bg-orange-50 hover:text-[var(--color-primary)]'
            }`}
          >
            {bookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            {bookmarked ? 'Saved' : 'Save'}
          </button>
          <button
            onClick={handleClone}
            disabled={cloning}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium bg-stone-50 text-stone-500 hover:bg-orange-50 hover:text-[var(--color-primary)] transition-colors disabled:opacity-50"
          >
            <Copy size={14} />
            I Made This
          </button>
        </div>
      </div>
    </div>
  );
}
