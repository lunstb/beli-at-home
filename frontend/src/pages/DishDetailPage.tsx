import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  BarChart3,
  Bookmark,
  BookmarkCheck,
  Copy,
  ExternalLink,
  FileText,
  Calendar,
  UtensilsCrossed,
  ThumbsDown,
  Meh,
  ThumbsUp,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { BottomSheet } from '../components/shared/BottomSheet';
import { ScoreBadge } from '../components/shared/ScoreBadge';
import { DishDetailSkeleton } from '../components/shared/Skeleton';
import { getDish, deleteDish, cloneDish } from '../api/dishes';
import { addBookmark, removeBookmark } from '../api/bookmarks';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/shared/Toast';
import { formatDate } from '../utils/formatters';
import type { Dish } from '../types';

export function DishDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [dish, setDish] = useState<Dish | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getDish(Number(id))
      .then(setDish)
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate, location.key]);

  const isOwner = dish && user && dish.user_id === user.id;

  // Build photo list from photos array or fallback to photo_path
  const photos: { url: string; caption: string | null }[] = [];
  if (dish) {
    if (dish.photos && dish.photos.length > 0) {
      dish.photos.forEach((p) => photos.push({ url: p.photo_path, caption: p.caption }));
    } else if (dish.photo_path) {
      photos.push({ url: dish.photo_path, caption: null });
    }
  }

  const scrollToPhoto = (index: number) => {
    if (!scrollRef.current) return;
    const child = scrollRef.current.children[index] as HTMLElement;
    if (child) {
      child.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
      setActivePhoto(index);
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const width = scrollRef.current.clientWidth;
    const index = Math.round(scrollLeft / width);
    setActivePhoto(index);
  };

  const handleDelete = async () => {
    if (!dish) return;
    setDeleting(true);
    try {
      await deleteDish(dish.id);
      toast('Meal deleted', 'success');
      navigate('/profile');
    } catch (err: any) {
      toast(err.message || 'Failed to delete meal', 'error');
      setDeleting(false);
    }
  };

  const handleBookmark = async () => {
    if (!dish) return;
    try {
      if (bookmarked) {
        await removeBookmark(dish.id);
        setBookmarked(false);
      } else {
        await addBookmark(dish.id);
        setBookmarked(true);
        toast('Meal bookmarked!', 'success');
      }
    } catch (err: any) {
      toast(err.message || 'Failed to update bookmark', 'error');
    }
  };

  const handleClone = async () => {
    if (!dish) return;
    try {
      const cloned = await cloneDish(dish.id);
      navigate(`/rank/${cloned.id}`);
    } catch (err: any) {
      toast(err.message || 'Failed to clone meal', 'error');
    }
  };

  if (loading) return <PageContainer><DishDetailSkeleton /></PageContainer>;
  if (!dish) return null;

  return (
    <PageContainer>
      {/* Photo gallery */}
      <div className="relative -mx-4 md:mx-0">
        {photos.length > 0 ? (
          <div className="relative">
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
            >
              {photos.map((photo, i) => (
                <div key={i} className="shrink-0 w-full snap-start">
                  <div className="aspect-[4/3] bg-stone-100 md:rounded-2xl overflow-hidden relative">
                    <img
                      src={photo.url}
                      alt={dish.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/15" />
                  </div>
                </div>
              ))}
            </div>
            {/* Photo navigation arrows */}
            {photos.length > 1 && (
              <>
                {activePhoto > 0 && (
                  <button
                    onClick={() => scrollToPhoto(activePhoto - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/30 backdrop-blur-sm rounded-full text-white hover:bg-black/50 transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                )}
                {activePhoto < photos.length - 1 && (
                  <button
                    onClick={() => scrollToPhoto(activePhoto + 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/30 backdrop-blur-sm rounded-full text-white hover:bg-black/50 transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                )}
              </>
            )}
            {/* Dot indicators */}
            {photos.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => scrollToPhoto(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === activePhoto ? 'bg-white w-4' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-[4/3] bg-stone-100 md:rounded-2xl overflow-hidden">
            <div className="w-full h-full flex items-center justify-center text-stone-300">
              <UtensilsCrossed size={64} />
            </div>
          </div>
        )}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 bg-black/30 backdrop-blur-sm rounded-full text-white hover:bg-black/50 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="absolute -bottom-6 right-4">
          <ScoreBadge rating={dish.rating} size="lg" />
        </div>
      </div>

      {/* Photo caption */}
      {photos.length > 0 && photos[activePhoto]?.caption && (
        <p className="text-xs text-stone-400 italic mt-2 text-center">
          {photos[activePhoto].caption}
        </p>
      )}

      <div className="pt-10 pb-6 space-y-6">
        {/* Title and caption */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-stone-800">{dish.name}</h1>
            {dish.tier && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                dish.tier === 'great' ? 'bg-green-50 text-green-600' :
                dish.tier === 'ok' ? 'bg-yellow-50 text-yellow-600' :
                'bg-red-50 text-red-500'
              }`}>
                {dish.tier === 'great' ? <ThumbsUp size={12} /> :
                 dish.tier === 'ok' ? <Meh size={12} /> :
                 <ThumbsDown size={12} />}
                {dish.tier === 'ok' ? 'Decent' : dish.tier.charAt(0).toUpperCase() + dish.tier.slice(1)}
              </span>
            )}
          </div>
          {dish.caption && (
            <p className="text-stone-500 mt-1">{dish.caption}</p>
          )}
          <div className="flex items-center gap-1.5 mt-2 text-xs text-stone-400">
            <Calendar size={12} />
            <span>Added {formatDate(dish.created_at)}</span>
          </div>
        </div>

        {/* Tags */}
        {dish.tags && dish.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {dish.tags.map((tag) => (
              <span
                key={tag.id}
                className="px-3 py-1 bg-orange-50 text-[var(--color-primary)] rounded-full text-xs font-medium"
              >
                {tag.tag}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons */}
        {isOwner ? (
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/rank/${dish.id}`)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-xl hover:bg-[var(--color-primary-dark)] transition-colors text-sm"
            >
              <BarChart3 size={18} />
              Rank This Meal
            </button>
            <button
              onClick={() => navigate(`/dishes/${dish.id}/edit`)}
              className="p-3 bg-stone-100 text-stone-600 rounded-xl hover:bg-stone-200 transition-colors"
            >
              <Edit3 size={18} />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleBookmark}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors ${
                bookmarked
                  ? 'bg-orange-50 text-[var(--color-primary)] border border-[var(--color-primary)]'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {bookmarked ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
              {bookmarked ? 'Bookmarked' : 'Bookmark'}
            </button>
            <button
              onClick={handleClone}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--color-primary)] text-white font-semibold rounded-xl hover:bg-[var(--color-primary-dark)] transition-colors text-sm"
            >
              <Copy size={18} />
              I Made This!
            </button>
          </div>
        )}

        {/* Recipe Info */}
        {dish.recipe_info && dish.recipe_info.length > 0 && (
          <div className="bg-white rounded-2xl border border-[var(--color-warm-border)] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-warm-border)]">
              <BookOpen size={18} className="text-[var(--color-primary)]" />
              <h2 className="text-sm font-semibold text-stone-700">Recipe</h2>
            </div>
            <div className="divide-y divide-[var(--color-warm-border)]">
              {dish.recipe_info.map((ri) => (
                <div key={ri.id}>
                  {ri.type === 'link' && (
                    <a
                      href={ri.content}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3.5 hover:bg-orange-50/50 transition-colors group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center shrink-0 group-hover:bg-orange-100 transition-colors">
                        <ExternalLink size={16} className="text-[var(--color-primary)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-700 truncate">{ri.content.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}</p>
                        <p className="text-xs text-stone-400 truncate">{ri.content}</p>
                      </div>
                    </a>
                  )}
                  {ri.type === 'text' && (
                    <div className="px-4 py-3.5">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText size={14} className="text-stone-400" />
                        <span className="text-xs font-medium text-stone-400 uppercase tracking-wide">Notes</span>
                      </div>
                      <p className="text-sm text-stone-600 whitespace-pre-wrap leading-relaxed">{ri.content}</p>
                    </div>
                  )}
                  {ri.type === 'image' && (
                    <div>
                      <img
                        src={ri.content}
                        alt="Recipe"
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      <BottomSheet open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
        <h2 className="text-lg font-bold text-stone-800 mb-2">Delete Meal?</h2>
        <p className="text-sm text-stone-500 mb-6">
          This will permanently delete &ldquo;{dish.name}&rdquo; and its ranking history. This can&rsquo;t be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors text-sm disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="flex-1 py-3 bg-stone-100 text-stone-700 font-semibold rounded-xl hover:bg-stone-200 transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </BottomSheet>
    </PageContainer>
  );
}
