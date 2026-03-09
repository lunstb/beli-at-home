import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, ChefHat } from 'lucide-react';
import { PageContainer } from '../components/layout/PageContainer';
import { DishCard } from '../components/dish/DishCard';
import { EmptyState } from '../components/shared/EmptyState';
import { DishGridSkeleton } from '../components/shared/Skeleton';
import { useAuth } from '../hooks/useAuth';
import { getDishes } from '../api/dishes';
import { formatScore } from '../utils/formatters';
import type { Dish } from '../types';

export function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('rating');
  const [filterTag, setFilterTag] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getDishes({ sort, tag: filterTag || undefined, limit: 200 })
      .then(setDishes)
      .catch(() => setDishes([]))
      .finally(() => setLoading(false));
  }, [sort, filterTag, location.key]);

  const allTags = useMemo(() => {
    const tagMap = new Map<string, number>();
    dishes.forEach((d) => {
      d.tags?.forEach((t) => {
        tagMap.set(t.tag, (tagMap.get(t.tag) || 0) + 1);
      });
    });
    return Array.from(tagMap.entries())
      .sort((a, b) => b[1] - a[1]);
  }, [dishes]);

  const topTags = allTags.slice(0, 3);

  const avgRating = useMemo(() => {
    const rated = dishes.filter((d) => d.rating !== null);
    if (rated.length === 0) return null;
    return rated.reduce((sum, d) => sum + d.rating!, 0) / rated.length;
  }, [dishes]);

  const tierCounts = useMemo(() => {
    const counts = { great: 0, ok: 0, bad: 0, unrated: 0 };
    dishes.forEach((d) => {
      if (d.tier === 'great') counts.great++;
      else if (d.tier === 'ok') counts.ok++;
      else if (d.tier === 'bad') counts.bad++;
      else counts.unrated++;
    });
    return counts;
  }, [dishes]);

  const filteredDishes = search
    ? dishes.filter((d) => d.name.toLowerCase().includes(search.toLowerCase()))
    : dishes;

  if (!user) return null;

  return (
    <PageContainer>
      <div className="py-6">
        {/* Profile header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-stone-200 overflow-hidden shrink-0">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-400 text-xl font-bold">
                {(user.username || '?')[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-stone-800 truncate">
              {user.username}
            </h1>
            {user.bio && (
              <p className="text-sm text-stone-500 line-clamp-2">{user.bio}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 border border-[var(--color-warm-border)] text-center">
            <p className="text-2xl font-bold text-stone-800">{dishes.length}</p>
            <p className="text-xs text-stone-400">meals</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[var(--color-warm-border)] text-center">
            <p className="text-2xl font-bold text-stone-800">{formatScore(avgRating)}</p>
            <p className="text-xs text-stone-400">avg rating</p>
          </div>
        </div>

        {/* Tier Breakdown */}
        {(tierCounts.great + tierCounts.ok + tierCounts.bad > 0) && (
          <div className="bg-white rounded-xl p-4 border border-[var(--color-warm-border)] mb-6">
            <h3 className="text-sm font-semibold text-stone-700 mb-3">Tier Breakdown</h3>
            <div className="flex rounded-full overflow-hidden h-3 bg-stone-100">
              {tierCounts.great > 0 && (
                <div
                  className="bg-green-400 transition-all duration-500"
                  style={{ width: `${(tierCounts.great / dishes.length) * 100}%` }}
                />
              )}
              {tierCounts.ok > 0 && (
                <div
                  className="bg-yellow-400 transition-all duration-500"
                  style={{ width: `${(tierCounts.ok / dishes.length) * 100}%` }}
                />
              )}
              {tierCounts.bad > 0 && (
                <div
                  className="bg-red-400 transition-all duration-500"
                  style={{ width: `${(tierCounts.bad / dishes.length) * 100}%` }}
                />
              )}
              {tierCounts.unrated > 0 && (
                <div
                  className="bg-stone-200 transition-all duration-500"
                  style={{ width: `${(tierCounts.unrated / dishes.length) * 100}%` }}
                />
              )}
            </div>
            <div className="flex gap-4 mt-2 text-xs text-stone-500">
              {tierCounts.great > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  Great {tierCounts.great}
                </span>
              )}
              {tierCounts.ok > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  Decent {tierCounts.ok}
                </span>
              )}
              {tierCounts.bad > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  Bad {tierCounts.bad}
                </span>
              )}
              {tierCounts.unrated > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-stone-200" />
                  Unrated {tierCounts.unrated}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Taste Profile */}
        {topTags.length > 0 && (
          <div className="bg-white rounded-xl p-4 border border-[var(--color-warm-border)] mb-6">
            <h3 className="text-sm font-semibold text-stone-700 mb-2">Taste Profile</h3>
            <div className="flex gap-2">
              {topTags.map(([name, count]) => (
                <span
                  key={name}
                  className="px-3 py-1 bg-orange-50 text-[var(--color-primary)] rounded-full text-xs font-medium"
                >
                  {name} ({count})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Search and filters */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search meals..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--color-warm-border)] text-sm outline-none focus:border-[var(--color-primary)] transition-colors bg-white"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-[var(--color-warm-border)] text-sm outline-none bg-white text-stone-700"
          >
            <option value="rating">Rating</option>
            <option value="newest">Newest</option>
            <option value="name">Name</option>
          </select>
        </div>

        {/* Tag filter pills */}
        {allTags.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-2 scrollbar-hide">
            <button
              onClick={() => setFilterTag(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filterTag === null
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
              }`}
            >
              All
            </button>
            {allTags.map(([name]) => (
              <button
                key={name}
                onClick={() => setFilterTag(filterTag === name ? null : name)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  filterTag === name
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        {/* Dish grid */}
        {loading ? (
          <DishGridSkeleton />
        ) : filteredDishes.length === 0 ? (
          <EmptyState
            icon={<ChefHat size={48} />}
            heading="Your kitchen is empty"
            subtext="Add your first meal and start building your rankings!"
            action={
              <button
                onClick={() => navigate('/dishes/new')}
                className="px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-medium text-sm hover:bg-[var(--color-primary-dark)] transition-colors"
              >
                Add a Meal
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredDishes.map((dish) => (
              <DishCard key={dish.id} dish={dish} />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
