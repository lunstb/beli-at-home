import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bookmark, Copy, Trash2, UtensilsCrossed } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { ScoreBadge } from '../components/shared/ScoreBadge';
import { EmptyState } from '../components/shared/EmptyState';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { getBookmarks, removeBookmark } from '../api/bookmarks';
import { cloneDish } from '../api/dishes';
import { useToast } from '../components/shared/Toast';
import type { Bookmark as BookmarkType } from '../types';

export function BookmarksPage() {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBookmarks()
      .then(setBookmarks)
      .catch(() => setBookmarks([]))
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (dishId: number) => {
    try {
      await removeBookmark(dishId);
      setBookmarks((prev) => prev.filter((b) => b.dish_id !== dishId));
    } catch (err: any) {
      toast(err.message || 'Failed to remove bookmark', 'error');
    }
  };

  const handleClone = async (dishId: number) => {
    try {
      const cloned = await cloneDish(dishId);
      navigate(`/rank/${cloned.id}`);
    } catch (err: any) {
      toast(err.message || 'Failed to clone dish', 'error');
    }
  };

  if (loading) return <LoadingSpinner />;

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
          <h1 className="text-xl font-bold text-stone-800">Saved Meals</h1>
        </div>

        {bookmarks.length === 0 ? (
          <EmptyState
            icon={<Bookmark size={48} />}
            heading="No bookmarks yet"
            subtext="Discover meals from friends and save the ones you want to try!"
            action={
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-medium text-sm hover:bg-[var(--color-primary-dark)] transition-colors"
              >
                Discover Meals
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {bookmarks.map((bm) => (
              <div
                key={bm.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[var(--color-warm-border)]"
              >
                <div
                  onClick={() => navigate(`/dishes/${bm.dish_id}`)}
                  className="cursor-pointer"
                >
                  <div className="aspect-square overflow-hidden bg-stone-100 relative">
                    {bm.dish_photo ? (
                      <img
                        src={bm.dish_photo}
                        alt={bm.dish_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-300">
                        <UtensilsCrossed size={40} />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <ScoreBadge rating={bm.dish_rating} size="sm" />
                    </div>
                  </div>
                  <div className="p-3 pb-1">
                    <h3 className="font-semibold text-stone-800 text-sm truncate">
                      {bm.dish_name}
                    </h3>
                    {bm.owner_username && (
                      <p className="text-xs text-stone-400 mt-0.5">
                        by {bm.owner_username}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 px-3 pb-3 pt-1">
                  <button
                    onClick={() => handleClone(bm.dish_id)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium bg-orange-50 text-[var(--color-primary)] hover:bg-orange-100 transition-colors"
                  >
                    <Copy size={12} />
                    I Made This
                  </button>
                  <button
                    onClick={() => handleRemove(bm.dish_id)}
                    className="p-1.5 rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
